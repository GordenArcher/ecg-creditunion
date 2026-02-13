# backend/core/apps/credit_union/services/import_service.py
import logging
import pandas as pd
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Any
from django.db import transaction
from django.utils import timezone
from django.core.files.uploadedfile import UploadedFile
import re

from apps.users.models import User, Station, Division
from apps.credit_union.models import Member, Wallet, SavingsAccount, InterestRate

logger = logging.getLogger(__name__)


class MemberExcelImporter:
    """Import members from Excel by Staff #"""
    
    REQUIRED_HEADERS = ['Staff #']
    OPTIONAL_HEADERS = [
        'Station', 'Division', 'Directorate',
        'Entrance Fee', 'Nominee', 'Address', 
        'Witness', 'Relationship', 'Joined Date'
    ]
    
    @classmethod
    def import_members(cls, excel_file: UploadedFile, admin_user) -> Dict:
        """
        Import members from Excel file using Staff # as identifier.
        
        Args:
            excel_file: Uploaded Excel file
            admin_user: Admin user performing the import
        
        Returns:
            Dictionary with import results
        """
        try:
            # Read Excel preserving original headers
            df = pd.read_excel(excel_file)
            
            # Log original headers for debugging
            logger.info(f"Member import - Original Excel headers: {list(df.columns)}")
            
            header_mapping = {}
            for col in df.columns:
                header_mapping[str(col).strip()] = col
            
            missing_headers = [h for h in cls.REQUIRED_HEADERS if h not in header_mapping]
            if missing_headers:
                raise ValueError(f"Missing required headers: {', '.join(missing_headers)}")
            
            created_members = []
            failed_rows = []
            skipped_rows = []
            all_warnings = []
            
            # Track created stations/divisions
            created_stations = set()
            created_divisions = set()
            
            with transaction.atomic():
                for index, row in df.iterrows():
                    row_num = index + 2
                    
                    try:
                        result = cls._process_member_row(row, header_mapping, admin_user, row_num)
                        
                        if result['status'] == 'success':
                            created_members.append({
                                'row': row_num,
                                'member_id': str(result['member_id']),
                                'user_id': str(result['user_id']),
                                'staff_id': result['staff_id'],
                                'full_name': result['full_name'],
                                'wallet_number': result.get('wallet_number', ''),
                                'warnings': result.get('warnings', [])
                            })
                            
                            if result.get('station_created'):
                                created_stations.add(result['station_name'])
                            if result.get('division_created'):
                                created_divisions.add(result['division_name'])
                                
                            all_warnings.extend(result.get('warnings', []))
                                
                        elif result['status'] == 'failed':
                            failed_rows.append({
                                'row': row_num,
                                'error': result['error'],
                                'data': cls._clean_row_data(row, header_mapping),
                                'field_errors': result.get('field_errors', {})
                            })
                            
                        elif result['status'] == 'skipped':
                            skipped_rows.append({
                                'row': row_num,
                                'reason': result['reason'],
                                'data': cls._clean_row_data(row, header_mapping)
                            })
                            
                    except Exception as e:
                        logger.error(f"Unexpected error at row {row_num}: {str(e)}", exc_info=True)
                        failed_rows.append({
                            'row': row_num,
                            'error': f"Unexpected error: {str(e)}",
                            'data': cls._clean_row_data(row, header_mapping),
                            'field_errors': {}
                        })
            
            
            savings_rate = InterestRate.get_active_rate('SAVINGS')
            
            summary = {
                'total_rows': len(df),
                'total_processed': len(created_members) + len(failed_rows) + len(skipped_rows),
                'successful': len(created_members),
                'failed': len(failed_rows),
                'skipped': len(skipped_rows),
                'success_rate': f"{(len(created_members) / max(len(df), 1) * 100):.1f}%",
                'stations_created': list(created_stations),
                'divisions_created': list(created_divisions),
                'imported_by': admin_user.email,
                'timestamp': timezone.now().isoformat(),
                'default_interest_rate': float(savings_rate.rate) if savings_rate else 0
            }
            
            return {
                'summary': summary,
                'successful': created_members,
                'failed': failed_rows,
                'skipped': skipped_rows,
                'warnings': all_warnings,
            }
                
        except Exception as e:
            logger.error(f"Error importing members: {str(e)}", exc_info=True)
            raise
    
    @classmethod
    def _clean_row_data(cls, row: pd.Series, header_mapping: Dict) -> Dict:
        """Clean row data for JSON response."""
        cleaned = {}
        for header, col in header_mapping.items():
            if col in row:
                value = row[col]
                if pd.isna(value):
                    cleaned[header] = None
                else:
                    cleaned[header] = str(value)
        return cleaned
    
    @classmethod
    def _clean_string(cls, value: Any) -> str:
        """Clean string values."""
        if pd.isna(value) or value is None:
            return ''
        return str(value).strip()
    
    @classmethod
    def _parse_date(cls, value: Any) -> Optional[datetime]:
        """Parse date from various formats."""
        if pd.isna(value) or value is None:
            return None
        
        try:
            if isinstance(value, (datetime, pd.Timestamp)):
                return value
            
            value_str = str(value).strip()
            date_formats = [
                '%Y/%m/%d', '%d/%m/%Y', '%Y-%m-%d', 
                '%d-%m-%Y', '%m/%d/%Y', '%d %b %Y'
            ]
            
            for fmt in date_formats:
                try:
                    return datetime.strptime(value_str, fmt)
                except ValueError:
                    continue
            
            try:
                serial = float(value_str)
                base_date = datetime(1899, 12, 30)
                return base_date + pd.Timedelta(days=serial)
            except (ValueError, TypeError):
                pass
                
        except Exception:
            pass
        
        return None
    
    @classmethod
    def _get_value(cls, row: pd.Series, header_mapping: Dict, header: str, default=None):
        """Get value from row by header."""
        if header in header_mapping:
            value = row.get(header_mapping[header])
            return value if pd.notna(value) else default
        return default
    
    @classmethod
    def _get_or_create_station(cls, station_name: str) -> Tuple[Optional[Station], bool]:
        """Get or create station by name."""
        if not station_name:
            return None, False
        
        try:
            station = Station.objects.filter(name__iexact=station_name).first()
            if station:
                return station, False
            
            # Create new station
            clean_name = re.sub(r'[^A-Za-z]', '', station_name.upper())
            code = clean_name[:3] if clean_name else 'STN'
            if len(code) < 3:
                code = code.ljust(3, 'X')
            
            # Make code unique
            counter = 1
            original_code = code
            while Station.objects.filter(code=code).exists():
                code = f"{original_code}{counter:02d}"
                counter += 1
            
            station = Station.objects.create(
                code=code,
                name=station_name,
                is_active=True
            )
            return station, True
            
        except Exception as e:
            logger.error(f"Error creating station '{station_name}': {str(e)}")
            return None, False
    
    @classmethod
    def _get_or_create_division(cls, division_name: str, directorate: str = '') -> Tuple[Optional[Division], bool]:
        """Get or create division by name."""
        if not division_name:
            return None, False
        
        try:
            division = Division.objects.filter(name__iexact=division_name).first()
            if division:
                return division, False
            
            clean_name = re.sub(r'[^A-Za-z]', '', division_name.upper())
            code = clean_name[:3] if clean_name else 'DIV'
            if len(code) < 3:
                code = code.ljust(3, 'X')
            
            counter = 1
            original_code = code
            while Division.objects.filter(code=code).exists():
                code = f"{original_code}{counter:02d}"
                counter += 1
            
            division = Division.objects.create(
                code=code,
                name=division_name,
                directorate=directorate or '',
                is_active=True
            )
            return division, True
            
        except Exception as e:
            logger.error(f"Error creating division '{division_name}': {str(e)}")
            return None, False
    
    @classmethod
    def _process_member_row(cls, row: pd.Series, header_mapping: Dict, admin_user, row_num: int) -> Dict:
        """Process a single Excel row for member import."""
        warnings = []
        field_errors = {}
        
        # 1. Get Staff # - REQUIRED
        staff_id_raw = cls._get_value(row, header_mapping, 'Staff #')
        if staff_id_raw is None:
            return {
                'status': 'failed',
                'error': 'Staff # is required',
                'field_errors': {'Staff #': 'Required field is empty'}
            }
        
        staff_id = cls._clean_string(str(staff_id_raw))
        if not staff_id:
            return {
                'status': 'failed',
                'error': 'Staff # is empty',
                'field_errors': {'Staff #': 'Field is empty'}
            }
        
        # 2. Find user by staff_id
        try:
            user = User.objects.get(staff_id=staff_id)
        except User.DoesNotExist:
            return {
                'status': 'skipped',
                'reason': f'User with Staff # "{staff_id}" not found in system'
            }
        
        # 3. Check if user is already a member
        if Member.objects.filter(user=user).exists():
            existing_member = Member.objects.get(user=user)
            return {
                'status': 'skipped',
                'reason': f'User {user.full_name} ({staff_id}) is already a member'
            }
        
        # 4. Get or create Station
        station_name = cls._clean_string(str(cls._get_value(row, header_mapping, 'Station', '')))
        station = None
        station_created = False
        if station_name:
            station, station_created = cls._get_or_create_station(station_name)
            if station_created:
                warnings.append(f'Created new station: "{station_name}"')
            if station:
                user.station = station
                warnings.append(f'Updated user station to: "{station_name}"')
        
        # 5. Get or create Division
        division_name = cls._clean_string(str(cls._get_value(row, header_mapping, 'Division', '')))
        division = None
        division_created = False
        if division_name:
            directorate = cls._clean_string(str(cls._get_value(row, header_mapping, 'Directorate', '')))
            division, division_created = cls._get_or_create_division(division_name, directorate)
            if division_created:
                warnings.append(f'Created new division: "{division_name}"')
            if division:
                user.division = division
                user.directorate = division.directorate
                warnings.append(f'Updated user division to: "{division_name}"')
        
        # 6. Update user email if provided
        email = cls._clean_string(str(cls._get_value(row, header_mapping, 'Email', '')))
        if email:
            if '@' in email and '.' in email.split('@')[-1]:
                if User.objects.filter(email=email).exclude(id=user.id).exists():
                    warnings.append(f'Email "{email}" already exists for another user. Skipping email update.')
                else:
                    user.email = email
                    warnings.append(f'Updated user email to: "{email}"')
            else:
                warnings.append(f'Invalid email format: "{email}". Skipping email update.')
        
        # 7. Save user updates
        user.save()
        
        # 8. Create Member
        try:
            # Get member fields
            entrance_fee = cls._get_value(row, header_mapping, 'Entrance Fee', 0)
            if entrance_fee:
                try:
                    entrance_fee = float(entrance_fee)
                except (ValueError, TypeError):
                    warnings.append(f'Invalid entrance fee value: "{entrance_fee}". Using 0.')
                    entrance_fee = 0
            else:
                entrance_fee = 0
            
            norminee = cls._clean_string(str(cls._get_value(row, header_mapping, 'Nominee', '')))
            address = cls._clean_string(str(cls._get_value(row, header_mapping, 'Address', '')))
            witness = cls._clean_string(str(cls._get_value(row, header_mapping, 'Witness', '')))
            relationship = cls._clean_string(str(cls._get_value(row, header_mapping, 'Relationship', '')))
            
            # Parse joined date
            joined_at = cls._parse_date(cls._get_value(row, header_mapping, 'Joined Date'))
            if not joined_at:
                joined_at = timezone.now()
                warnings.append('Joined Date not provided. Using current date.')
            
            
            member = Member.objects.create(
                user=user,
                entrance_fee=entrance_fee,
                norminee=norminee or None,
                address=address or None,
                witness=witness or None,
                relationship=relationship or None,
                joined_at=joined_at,
                is_active=True
            )
            
            # 9. Create Wallet with unique cheche number
            cheche_number = f"CH{user.staff_id}{timezone.now().strftime('%y%m')}"
            wallet = Wallet.objects.create(
                member=member,
                balance=0,
                cheche_number=cheche_number,
                is_active=True
            )
            
            # 10. Create Savings Account
            savings_rate = InterestRate.get_active_rate('SAVINGS')
            savings = SavingsAccount.objects.create(
                member=member,
                balance=0,
                interest_rate=savings_rate,
                last_interest_applied=timezone.now()
            )
            
            return {
                'status': 'success',
                'member_id': member.id,
                'user_id': user.id,
                'staff_id': user.staff_id,
                'full_name': user.full_name,
                'email': user.email or '',
                'wallet_number': wallet.cheche_number,
                'station_name': station_name,
                'station_created': station_created,
                'division_name': division_name,
                'division_created': division_created,
                'warnings': warnings
            }
            
        except Exception as e:
            logger.error(f"Error creating member at row {row_num}: {str(e)}", exc_info=True)
            return {
                'status': 'failed',
                'error': f"Database error: {str(e)}",
                'field_errors': {'database': str(e)}
            }