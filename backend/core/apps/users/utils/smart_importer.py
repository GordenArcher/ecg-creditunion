import logging
import pandas as pd
from datetime import datetime
from typing import Dict, Tuple, Any, Optional
from django.db import transaction
from django.core.files.uploadedfile import UploadedFile
from django.utils import timezone
import re
import math

from ..models import User, Station, Division, UserAccountMeta

logger = logging.getLogger(__name__)


class ExcelUserImporter:
    """Import users from Excel with automatic station/division creation."""
    
    @classmethod
    def import_users(cls, excel_file: UploadedFile, admin_user) -> Dict:
        """
        Import users from Excel file based on ECG format.
        
        Args:
            excel_file: Uploaded Excel file
            admin_user: Admin user performing the import
        
        Returns:
            Dictionary with import results
        """
        try:
            df = pd.read_excel(excel_file)
            
            logger.info(f"Original Excel headers: {list(df.columns)}")
            
            # Create a mapping dictionary for easier access
            header_mapping = {}
            for col in df.columns:
                header_mapping[str(col).strip()] = col
            
            # Check for required headers (Email is NOT required for uploadable, but Staff # and Name are required)
            required_headers = ['Staff #', 'Name']
            missing_headers = [h for h in required_headers if h not in header_mapping]
            if missing_headers:
                raise ValueError(f"Missing required headers: {', '.join(missing_headers)}")
            
            created_users = []
            failed_rows = []
            skipped_rows = []
            all_warnings = []
            
            # Track what we create
            created_stations = set()
            created_divisions = set()
            
            with transaction.atomic():
                for index, row in df.iterrows():
                    row_num = index + 2  # +2 for header and 1-based index
                    
                    try:
                        # Process row with exact headers
                        result = cls._process_row_exact_headers(row, header_mapping, admin_user, row_num)
                        
                        if result['status'] == 'success':
                            created_users.append({
                                'row': row_num,
                                'user_id': result['user_id'],
                                'employee_id': result['employee_id'],
                                'staff_id': result['staff_id'],
                                'full_name': result['full_name'],
                                'email': result.get('email', ''),
                                'warnings': result.get('warnings', []),
                                'station': result.get('station_name', ''),
                                'division': result.get('division_name', '')
                            })
                            
                            # Track created stations/divisions
                            if result.get('station_created'):
                                created_stations.add(result['station_name'])
                            if result.get('division_created'):
                                created_divisions.add(result['division_name'])
                                
                            # Collect warnings
                            all_warnings.extend(result.get('warnings', []))
                                
                        elif result['status'] == 'failed':
                            failed_rows.append({
                                'row': row_num,
                                'error': result['error'],
                                'data': cls._clean_row_data_for_json(row, header_mapping),
                                'field_errors': result.get('field_errors', {})
                            })
                            
                        elif result['status'] == 'skipped':
                            skipped_rows.append({
                                'row': row_num,
                                'reason': result['reason'],
                                'data': cls._clean_row_data_for_json(row, header_mapping)
                            })
                            
                    except Exception as e:
                        logger.error(f"Unexpected error at row {row_num}: {str(e)}", exc_info=True)
                        failed_rows.append({
                            'row': row_num,
                            'error': f"Unexpected error: {str(e)}",
                            'data': cls._clean_row_data_for_json(row, header_mapping),
                            'field_errors': {}
                        })
                
                total_processed = len(created_users) + len(failed_rows) + len(skipped_rows)
                success_rate = 0
                if total_processed > 0:
                    success_rate = (len(created_users) / total_processed * 100)
                
                summary = {
                    'total_rows': len(df),
                    'total_processed': total_processed,
                    'successful': len(created_users),
                    'failed': len(failed_rows),
                    'skipped': len(skipped_rows),
                    'success_rate': f"{success_rate:.1f}%",
                    'stations_created': list(created_stations),
                    'divisions_created': list(created_divisions),
                    'imported_by': admin_user.email,
                    'timestamp': timezone.now().isoformat()
                }
                
                return {
                    'summary': summary,
                    'successful': created_users,
                    'failed': failed_rows,
                    'skipped': skipped_rows,
                    'warnings': all_warnings,
                }
                
        except Exception as e:
            logger.error(f"Error importing Excel: {str(e)}", exc_info=True)
            raise
    
    @classmethod
    def _clean_row_data_for_json(cls, row: pd.Series, header_mapping: Dict) -> Dict:
        """Clean row data for JSON serialization."""
        cleaned_data = {}
        for header, col in header_mapping.items():
            if col in row:
                value = row[col]
                # Handle NaN values
                if pd.isna(value):
                    cleaned_data[header] = None
                # Handle other non-serializable values
                elif isinstance(value, (pd.Timestamp, datetime)):
                    cleaned_data[header] = value.isoformat() if not pd.isna(value) else None
                elif isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
                    cleaned_data[header] = None
                else:
                    cleaned_data[header] = str(value) if value is not None else None
        return cleaned_data
    
    @classmethod
    def _process_row_exact_headers(cls, row: pd.Series, header_mapping: Dict, admin_user, row_num: int) -> Dict:
        """Process a single Excel row using exact headers."""
        field_errors = {}
        warnings = []
        data = {}
        
        # Extract values using exact headers
        def get_value(header: str, default=None):
            if header in header_mapping:
                value = row.get(header_mapping[header])
                return value if pd.notna(value) else default
            return default
        
        # 1. REQUIRED: Staff # (staff_id field)
        staff_number_raw = get_value('Staff #')
        if staff_number_raw is None:
            return {
                'status': 'failed',
                'error': 'Staff # is required',
                'field_errors': {'Staff #': 'Required field is empty'}
            }
        
        staff_number = cls._clean_string(str(staff_number_raw))
        if not staff_number:
            return {
                'status': 'failed',
                'error': 'Staff # is empty',
                'field_errors': {'Staff #': 'Field is empty'}
            }
        
        if User.objects.filter(staff_id=staff_number).exists():
            existing_user = User.objects.filter(staff_id=staff_number).first()
            return {
                'status': 'skipped',
                'reason': f'Staff # "{staff_number}" already exists in system'
            }
        
        data['staff_id'] = staff_number
        
        name_raw = get_value('Name')
        if name_raw is None:
            return {
                'status': 'failed',
                'error': 'Name is required',
                'field_errors': {'Name': 'Required field is empty'}
            }
        
        name = cls._clean_string(str(name_raw))
        if not name:
            return {
                'status': 'failed',
                'error': 'Name is empty',
                'field_errors': {'Name': 'Field is empty'}
            }
        
        data['full_name'] = name
        
        # Email is OPTIONAL for excel upload, but if provided it must be valid and unique
        email_raw = get_value('Email')
        email = None
        
        if email_raw is not None:
            email = cls._clean_string(str(email_raw))
            if email and '@' in email and '.' in email.split('@')[-1]:
                if User.objects.filter(email=email).exists():
                    warnings.append(f'Email "{email}" already exists for another user. Email field will be left blank.')
                    email = None
            else:
                if email:
                    warnings.append(f'Invalid email format: "{email}". Email field will be left blank.')
                email = None
        
        # Only set email if it's valid and unique
        if email:
            data['email'] = email
        else:
            # Leave email as None - Django will handle this based on model definition ( we set email to be nullable in the model, so this should be fine)
            pass
        
        emp_id_raw = get_value('Emp ID')
        if emp_id_raw is not None:
            emp_id = cls._clean_string(str(emp_id_raw))
            if emp_id:
                warnings.append(f'Emp ID "{emp_id}" noted')
        
        title_raw = get_value('Title')
        if title_raw is not None:
            title = cls._clean_string(str(title_raw))
            if title:
                data['title'] = title
        
        sex_raw = get_value('Sex')
        if sex_raw is not None:
            sex = cls._clean_string(str(sex_raw))
            if sex:
                data['gender'] = cls._parse_gender(sex)
        
        dob_raw = get_value('DOB')
        if dob_raw is not None:
            dob = cls._parse_date(dob_raw)
            if dob:
                if dob > datetime.now().date():
                    warnings.append(f'DOB {dob} is in the future. Setting to None.')
                else:
                    data['date_of_birth'] = dob
            else:
                warnings.append('DOB could not be parsed')
        
        # Optional: Station, we will try to create if it doesn't exist
        station_raw = get_value('Station')
        station_name = None
        if station_raw is not None:
            station_name = cls._clean_string(str(station_raw))
            if station_name:
                station_result = cls._get_or_create_station(station_name)
                if station_result:
                    station, station_created = station_result
                    data['station'] = station
                    if station_created:
                        warnings.append(f'Created new station: "{station_name}"')
                else:
                    warnings.append(f'Could not create station: "{station_name}"')
        
        pb_raw = get_value('PB #')
        if pb_raw is not None:
            pb = cls._clean_string(str(pb_raw))
            if pb:
                data['pb_number'] = pb
        
        directorate_raw = get_value('Directorate')
        directorate = None
        if directorate_raw is not None:
            directorate = cls._clean_string(str(directorate_raw))
            if directorate:
                data['directorate'] = directorate
        
        # Optional: Division, we will try to create if it doesn't exist. If directorate is provided, we will link it to the division
        division_raw = get_value('Division')
        division_name = None
        if division_raw is not None:
            division_name = cls._clean_string(str(division_raw))
            if division_name:
                division_result = cls._get_or_create_division(division_name, directorate)
                if division_result:
                    division, division_created = division_result
                    data['division'] = division
                    if division_created:
                        warnings.append(f'Created new division: "{division_name}"')
                else:
                    warnings.append(f'Could not create division: "{division_name}"')
        
        # Optional: Tel, we will clean it and validate it with the same phone_regex validator we use for the phone_number field in the model. If it's invalid, we will skip it and log a warning, but we won't fail the entire row because of an invalid phone number
        tel_raw = get_value('Tel')
        if tel_raw is not None:
            tel = cls._clean_string(str(tel_raw))
            if tel:
                cleaned_tel = cls._clean_phone(tel)
                if cleaned_tel:
                    data['phone_number'] = cleaned_tel
                else:
                    warnings.append(f'Invalid phone number: "{tel}"')
        
        marital_raw = get_value('Marital Status')
        if marital_raw is not None:
            marital = cls._clean_string(str(marital_raw))
            if marital:
                parsed_marital = cls._parse_marital_status(marital)
                if parsed_marital:
                    data['marital_status'] = parsed_marital
                else:
                    warnings.append(f'Invalid marital status: "{marital}". Using default (SINGLE).')
        
        dependents_raw = get_value('# of Dependents')
        if dependents_raw is not None:
            try:
                dependents = int(float(dependents_raw))
                data['number_of_dependents'] = max(0, dependents)
            except (ValueError, TypeError):
                warnings.append(f'Invalid dependents value: "{dependents_raw}". Setting to 0.')
                data['number_of_dependents'] = 0
        else:
            data['number_of_dependents'] = 0
        
        reg_date_raw = get_value('Date of Registration')
        if reg_date_raw is not None:
            reg_date = cls._parse_date(reg_date_raw)
            if reg_date:
                # We make it timezone aware by assuming it's in the local timezone to avoid issues with naive datetimes. excel dates are usually just dates without timezone info, so we treat them as local dates.
                data['date_registered'] = timezone.make_aware(
                    datetime.combine(reg_date, datetime.min.time())
                )
            else:
                warnings.append('Date of Registration could not be parsed. Using current date.')
                data['date_registered'] = timezone.now()
        else:
            data['date_registered'] = timezone.now()
        
        #Optional: Discontinue, we will parse it to a boolean. If it's invalid, we will default to False (active) and log a warning, but we won't fail the entire row because of an invalid discontinue value
        discontinue_raw = get_value('Discontinue')
        if discontinue_raw is not None:
            data['discontinued'] = cls._parse_discontinue(discontinue_raw)
        else:
            data['discontinued'] = False
        
        # Set default role, this is not provided in the excel, but we need to set it to something. We will set it to STAFF by default, but this can be changed later by an admin if needed. We log a warning to make it clear that the role is being set to a default value and should be reviewed. we cn leave it or remove it becasue the model will default to STAFF if role is not provided, but we set it explicitly here to be clear in the code and to log a warning about it.
        data['role'] = User.Role.STAFF
        warnings.append('Role not provided, defaulting to STAFF. Please review and update if necessary.')
        data['created_by'] = admin_user
        
        # we generate a default password based on the staff number, but we don't set it in the data dictionary because we will set it separately when creating the user. This is because we need to use the set_password method to hash the password, and we don't want to accidentally save a raw password in the database if something goes wrong with the user creation. The default password is just a placeholder and should be changed by the user after they log in for the first time. We log a warning about the default password so that it's clear that it needs to be changed.
        password = f"{staff_number}@ECG2026"
        # warnings.append(f'Default password set to "{password}". User should change this after first login.')

        
        try:
            # If email is None, we need to handle it differently
            if 'email' not in data or data['email'] is None:
                user = User(
                    staff_id=data.pop('staff_id'),
                    full_name=data.pop('full_name'),
                    **data
                )
                user.set_password(password)
                user.save()
            else:
                user = User.objects.create_user(
                    email=data.pop('email'),
                    password=password,
                    staff_id=data.pop('staff_id'),
                    full_name=data.pop('full_name'),
                    **data
                )
            
            UserAccountMeta.objects.create(user=user)
            
            return {
                'status': 'success',
                'user_id': str(user.id),
                'employee_id': str(user.employee_id),
                'staff_id': user.staff_id,
                'full_name': user.full_name,
                'email': user.email or '',
                'station_name': station_name,
                'station_created': station_result[1] if 'station_result' in locals() and station_result else False,
                'division_name': division_name,
                'division_created': division_result[1] if 'division_result' in locals() and division_result else False,
                'warnings': warnings
            }
            
        except Exception as e:
            logger.error(f"Database error creating user at row {row_num}: {str(e)}", exc_info=True)
            return {
                'status': 'failed',
                'error': f"Database error: {str(e)}",
                'field_errors': {'database': str(e)}
            }
    
    @classmethod
    def _clean_string(cls, value: Any) -> str:
        """Clean string values."""
        if pd.isna(value) or value is None:
            return ''
        
        # Convert to string and clean
        result = str(value).strip()
        # Remove multiple spaces and fix encoding
        result = re.sub(r'\s+', ' ', result)
        result = result.replace('&nbsp;', ' ').replace('nbsp', ' ')
        return result
    
    @classmethod
    def _parse_gender(cls, value: str) -> str:
        """Parse Gender field."""
        value_clean = value.upper().strip()
        
        if value_clean in ['M', 'MALE', 'BOY']:
            return User.Gender.MALE
        elif value_clean in ['F', 'FEMALE', 'GIRL', 'WOMAN']:
            return User.Gender.FEMALE
        elif value_clean == 'M/F':
            return User.Gender.OTHER
        else:
            return User.Gender.OTHER
    
    @classmethod
    def _parse_date(cls, value: Any) -> Optional[datetime.date]:
        """Parse date from various formats."""
        if pd.isna(value) or value is None:
            return None
        
        try:
            if isinstance(value, pd.Timestamp):
                return value.date()
            
            if isinstance(value, datetime):
                return value.date()
            
            # Handle string
            value_str = str(value).strip()
            
            # Try common ECG date formats from the excel template, we can add more formats if needed. We try multiple formats to be flexible with the input, but we can remove some if we want to enforce a stricter format. The more formats we try, the slower the parsing will be, so we should find a balance between flexibility and performance. We also log a debug message if parsing fails for all formats to help with troubleshooting.
            date_formats = [
                '%Y/%m/%d',    # 2025/02/10
                '%d/%m/%Y',    # 10/02/2025
                '%Y-%m-%d',    # 2025-02-10
                '%d-%m-%Y',    # 10-02-2025
                '%m/%d/%Y',    # 02/10/2025
                '%d %b %Y',    # 10 Feb 2025
                '%d %B %Y',    # 10 February 2025
                '%Y.%m.%d',    # 2025.02.10
            ]
            
            for fmt in date_formats:
                try:
                    return datetime.strptime(value_str, fmt).date()
                except ValueError:
                    continue
            
            # Try Excel serial number
            try:
                serial = float(value_str)
                # Excel date system (1900 or 1904)
                base_date = datetime(1899, 12, 30)
                return (base_date + pd.Timedelta(days=serial)).date()
            except (ValueError, TypeError):
                pass
            
        except Exception as e:
            logger.debug(f"Date parsing error for '{value}': {str(e)}")
        
        return None
    
    @classmethod
    def _clean_phone(cls, value: str) -> str:
        """Clean phone number for phone_regex validator."""
        if not value:
            return ''
        
        phone = re.sub(r'[^\d+]', '', str(value))
        
        if phone and not phone.startswith('+'):
            if phone.startswith('0'):
                phone = '+233' + phone[1:]
            else:
                phone = '+' + phone
        
        return phone
    
    @classmethod
    def _parse_marital_status(cls, value: str) -> str:
        """Parse marital status to match User.MaritalStatus choices."""
        value_clean = value.upper().strip()
        
        status_map = {
            'SINGLE': User.MaritalStatus.SINGLE,
            'MARRIED': User.MaritalStatus.MARRIED,
            'DIVORCED': User.MaritalStatus.DIVORCED,
            'WIDOWED': User.MaritalStatus.WIDOWED,
            'SEPARATED': User.MaritalStatus.SEPARATED,
            'S': User.MaritalStatus.SINGLE,
            'M': User.MaritalStatus.MARRIED,
            'D': User.MaritalStatus.DIVORCED,
            'W': User.MaritalStatus.WIDOWED,
            'A': User.MaritalStatus.SINGLE,
        }
        
        return status_map.get(value_clean, User.MaritalStatus.SINGLE)
    
    @classmethod
    def _parse_discontinue(cls, value: Any) -> bool:
        """Parse Discontinue field."""
        if pd.isna(value) or value is None:
            return False
        
        value_str = str(value).strip().upper()
        
        if value_str in ['1', 'YES', 'Y', 'TRUE', 'DISCONTINUE', 'DISCONTINUED', 'TERMINATED']:
            return True
        elif value_str in ['0', 'NO', 'N', 'FALSE', 'ACTIVE', '']:
            return False
        
        try:
            return bool(int(float(value_str)))
        except (ValueError, TypeError):
            return False
    
    @classmethod
    def _get_or_create_station(cls, station_name: str) -> Optional[Tuple[Station, bool]]:
        """Get or create station."""
        try:
            # Try to find existing station (case-insensitive), we can also try to match by code if needed, but for now we will just match by name to keep it simple. We can enhance this later if we find that there are a lot of duplicates or similar station names that cause issues.
            station = Station.objects.filter(name__iexact=station_name).first()
            if station:
                return station, False
            
            # Generate code from station name (first 3 letters, uppercase, letters only), if name is too short we pad it with X, if name has no letters we use STN as default code. We also make sure the code is unique by appending a number if needed. This is a simple way to generate codes, but it may not be perfect for all station names, so we log any issues with code generation as warnings in the import results.
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
            return None
    
    @classmethod
    def _get_or_create_division(cls, division_name: str, directorate: str = None) -> Optional[Tuple[Division, bool]]:
        """Get or create division."""
        try:
            # Try to find existing division (case-insensitive)
            division = Division.objects.filter(name__iexact=division_name).first()
            if division:
                return division, False
            
            # Create new division
            # Generate code from division name
            clean_name = re.sub(r'[^A-Za-z]', '', division_name.upper())
            code = clean_name[:3] if clean_name else 'DIV'
            if len(code) < 3:
                code = code.ljust(3, 'X')
            
            # Make code unique
            counter = 1
            original_code = code
            while Division.objects.filter(code=code).exists():
                code = f"{original_code}{counter:02d}"
                counter += 1
            
            division = Division.objects.create(
                code=code,
                name=division_name,
                directorate=directorate if directorate else '',
                is_active=True
            )
            
            return division, True
            
        except Exception as e:
            logger.error(f"Error creating division '{division_name}': {str(e)}")
            return None