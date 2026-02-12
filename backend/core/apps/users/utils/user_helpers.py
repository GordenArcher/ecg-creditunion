import logging
from typing import Dict, Any, Optional, Tuple, List
from django.db import transaction
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone

from ..models import User, UserAccountMeta, Station, Division
from .user_cache import UserCacheManager
from apps.audit.services.audit_service import AuditService
from apps.audit.services.audit_service import AuditLog
from common.utils.request_utils import get_client_ip
from .validation import UserValidationHelper
from .permissions import PermissionHelper

logger = logging.getLogger(__name__)


class UserUpdateService:
    """Shared service for updating users - used by both profile and admin endpoints."""
    
    @staticmethod
    def update_user(
        user_id: str,
        update_data: Dict[str, Any],
        requesting_user: User,
        context: str,  # 'self_update', 'admin_update_staff', 'admin_update_any'
        request=None
    ) -> Tuple[Optional[User], Optional[Dict]]:
        """
        Universal update function used by:
        - Users updating their own profile (context='self_update')
        - Admins updating staff (context='admin_update_staff')
        - Admins updating any user (context='admin_update_any')
        """
        try:
            with transaction.atomic():
                user_to_update = User.objects.get(id=user_id)
                
                # Check permissions based on context
                if not PermissionHelper.can_update_user(requesting_user, user_to_update, context):
                    return None, {"error": "You don't have permission to update this user"}
                
                allowed_fields = PermissionHelper.get_allowed_update_fields(requesting_user, context)
                
                filtered_data = {k: v for k, v in update_data.items() if k in allowed_fields}
                
                if not filtered_data:
                    return None, {"error": "No valid fields to update"}
                
                validation_rules = UserValidationHelper.get_validation_rules(context, requesting_user.role)
                
                is_valid, errors = UserValidationHelper.validate_update_data(
                    filtered_data, user_to_update, validation_rules
                )
                if not is_valid:
                    return None, errors
                
                before_state = UserUpdateService._get_audit_state(user_to_update)
                
                for field, value in filtered_data.items():
                    if hasattr(user_to_update, field):
                        setattr(user_to_update, field, value)
                
                user_to_update.save()
                
                after_state = UserUpdateService._get_audit_state(user_to_update)
                
                UserCacheManager.cache_user(user_to_update)
                
                if context != 'self_update':
                    UserCacheManager.invalidate_all_users()
                
                UserUpdateService._log_update_action(
                    requesting_user=requesting_user,
                    user_to_update=user_to_update,
                    context=context,
                    before_state=before_state,
                    after_state=after_state,
                    changed_fields=list(filtered_data.keys()),
                    request=request
                )
                
                return user_to_update, None
                
        except User.DoesNotExist:
            return None, {"error": "User not found"}
        except Exception as e:
            logger.error(f"Error updating user {user_id}: {str(e)}", exc_info=True)
            return None, {"error": str(e)}
    
    @staticmethod
    def _get_audit_state(user: User) -> Dict[str, Any]:
        """Get user state for audit logging."""
        return {
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active,
            "discontinued": user.discontinued,
            "station": str(user.station_id) if user.station else None,
            "division": str(user.division_id) if user.division else None,
        }
    
    @staticmethod
    def _log_update_action(
        requesting_user: User,
        user_to_update: User,
        context: str,
        before_state: Dict[str, Any],
        after_state: Dict[str, Any],
        changed_fields: List[str],
        request=None
    ):
        """Log update action with appropriate severity."""
        
        # Determine action and severity based on context
        action_map = {
            'self_update': {
                'action': "PROFILE_UPDATE",
                'severity': AuditLog.Severity.MEDIUM
            },
            'admin_update_staff': {
                'action': "STAFF_UPDATE_BY_ADMIN",
                'severity': AuditLog.Severity.HIGH
            },
            'admin_update_any': {
                'action': "USER_UPDATE_BY_ADMIN",
                'severity': AuditLog.Severity.HIGH
            }
        }
        
        config = action_map.get(context, {'action': 'USER_UPDATE', 'severity': AuditLog.Severity.MEDIUM})
        
        if before_state.get('role') != after_state.get('role') or \
           before_state.get('is_active') != after_state.get('is_active'):
            config['severity'] = AuditLog.Severity.CRITICAL
        
        AuditService.log(
            actor=requesting_user,
            action=config['action'],
            target_type="User",
            target_id=str(user_to_update.id),
            severity=config['severity'],
            status=AuditLog.Status.SUCCESS,
            metadata={
                "context": context,
                "changed_fields": changed_fields,
                "updated_by_role": requesting_user.role,
            },
            ip_address=get_client_ip(request) if request else None,
            before_state=before_state,
            after_state=after_state,
            actor_role=requesting_user.role
        )


class UserCreateService:
    """Shared service for creating users."""
    
    @staticmethod
    def create_user(
        user_data: Dict[str, Any],
        requesting_user: User,
        context: str,  # 'admin_create_staff', 'admin_create_user'
        request=None
    ) -> Tuple[Optional[User], Optional[Dict]]:
        """Create a new user."""
        try:
            with transaction.atomic():
                    
                if not PermissionHelper.can_create_user(requesting_user.role, context):
                    return None, {"error": "You don't have permission to create users"}
                
                # Get allowed fields for this context
                allowed_fields = PermissionHelper.get_allowed_create_fields(requesting_user.role, context)
                
                # Filter user_data to only allowed fields
                filtered_data = {k: v for k, v in user_data.items() if k in allowed_fields}
                
                # Handle station_id - convert to Station object
                station_id = filtered_data.pop('station_id', None)
                if station_id:
                    try:
                        station = Station.objects.get(id=station_id)
                        filtered_data['station'] = station
                    except Station.DoesNotExist:
                        return None, {"station_id": f"Station with id {station_id} does not exist"}
                
                # Handle division_id - convert to Division object
                division_id = filtered_data.pop('division_id', None)
                if division_id:
                    try:
                        division = Division.objects.get(id=division_id)
                        filtered_data['division'] = division
                        
                        # we auto-fill directorate from division if not provided
                        if 'directorate' not in filtered_data or not filtered_data.get('directorate'):
                            filtered_data['directorate'] = division.directorate
                            
                    except Division.DoesNotExist:
                        return None, {"division_id": f"Division with id {division_id} does not exist"}
                
                validation_rules = UserValidationHelper.get_creation_rules(context, requesting_user.role)
                is_valid, errors = UserValidationHelper.validate_creation_data(filtered_data, validation_rules)
                if not is_valid:
                    return None, errors
                
                password = filtered_data.pop('password', None)
                if not password:
                    return None, {"password": "Password is required"}
                
                
                user = User(**filtered_data)
                user.set_password(password)
                user.save()
                
                
                UserAccountMeta.objects.create(user=user)
                
                
                UserCacheManager.cache_user(user)
                UserCacheManager.invalidate_all_users()
                
               
                AuditService.log(
                    actor=requesting_user,
                    action="USER_CREATE_BY_ADMIN",
                    target_type="User",
                    target_id=str(user.id),
                    severity=AuditLog.Severity.HIGH,
                    status=AuditLog.Status.SUCCESS,
                    ip_address=get_client_ip(request) if request else None,
                    metadata={
                        "context": context,
                        "created_by_role": requesting_user.role,
                        "created_by_email": requesting_user.email,
                        "user_role": user.role,
                        "user_email": user.email or 'No email',
                        "station_id": station_id,
                        "division_id": division_id,
                        "station_name": station.name if station_id and 'station' in locals() else None,
                        "division_name": division.name if division_id and 'division' in locals() else None,
                    }
                )
                
                return user, None
                
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}", exc_info=True)
            return None, {"error": str(e)}