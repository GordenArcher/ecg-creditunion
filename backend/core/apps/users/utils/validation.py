from typing import Dict, Any, Tuple
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from .permissions import PermissionHelper
from ..models import User
from datetime import datetime

class UserValidationHelper:
    """Validation utilities."""
    
    @staticmethod
    def get_validation_rules(context: str, requesting_role: str) -> Dict[str, Any]:
        """Get validation rules for update context."""
        rules = {
            'self_update': {
                'email': {'required': False, 'editable': True},
                'role': {'required': False, 'editable': False},
                'staff_id': {'required': False, 'editable': False},
                'is_active': {'required': False, 'editable': False},
                'discontinued': {'required': False, 'editable': False},
            },
            'admin_update_staff': {
                'email': {'required': False, 'editable': True},
                'role': {'required': False, 'editable': True, 'allowed_values': PermissionHelper.get_allowed_roles(requesting_role, 'admin_update_staff')},
                'staff_id': {'required': False, 'editable': False},
            },
            'admin_update_any': {
                'email': {'required': False, 'editable': True},
                'role': {'required': False, 'editable': True, 'allowed_values': PermissionHelper.get_allowed_roles(requesting_role, 'admin_update_any')},
                'staff_id': {'required': False, 'editable': False},
            }
        }
        return rules.get(context, {})
    
    @staticmethod
    def get_creation_rules(context: str, requesting_role: str) -> Dict[str, Any]:
        """Get validation rules for creation context."""
        rules = {
            'admin_create_staff': {
                'email': {'required': True, 'unique': True},
                'password': {'required': True, 'min_length': 8},
                'full_name': {'required': True},
                'staff_id': {'required': True, 'unique': True},
                'role': {'required': True, 'allowed_values': PermissionHelper.get_allowed_roles(requesting_role, 'admin_create_staff')},
            }
        }
        return rules.get(context, {})
    
    @staticmethod
    def validate_update_data(data: Dict[str, Any], user: User, rules: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
        """Validate update data against rules."""
        errors = {}
        
        for field, value in data.items():
            rule = rules.get(field, {})
            
            # Check if field is editable
            if not rule.get('editable', True):
                errors[field] = f"Cannot update {field}"
                continue
            
            if 'allowed_values' in rule and value not in rule['allowed_values']:
                errors[field] = f"{field} must be one of: {', '.join(rule['allowed_values'])}"

            if field == "date_of_birth":
                if value in ["", None]:
                    data[field] = None
                else:
                    try:
                        datetime.strptime(value, "%Y-%m-%d")
                    except ValueError:
                        errors[field] = "Date must be in YYYY-MM-DD format"
            
            if field == 'email' and value:
                try:
                    validate_email(value)
                    if User.objects.filter(email=value).exclude(id=user.id).exists():
                        errors[field] = "A user with this email already exists"
                except ValidationError:
                    errors[field] = "Invalid email format"
            
            if field == 'phone_number' and value:
                if User.objects.filter(phone_number=value).exclude(id=user.id).exists():
                    errors[field] = "A user with this phone number already exists"
        
        return len(errors) == 0, errors
    
    @staticmethod
    def validate_creation_data(data: Dict[str, Any], rules: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
        """Validate creation data against rules."""
        errors = {}
        
        for field, rule in rules.items():
            value = data.get(field)
            
            if rule.get('required', False) and not value:
                errors[field] = f"{field} is required"
                continue
            
            if rule.get('unique', False) and value:
                if User.objects.filter(**{field: value}).exists():
                    errors[field] = f"A user with this {field} already exists"
            
            if 'allowed_values' in rule and value not in rule['allowed_values']:
                errors[field] = f"{field} must be one of: {', '.join(rule['allowed_values'])}"
            
            if field == 'email' and value:
                try:
                    validate_email(value)
                except ValidationError:
                    errors[field] = "Invalid email format"
            
            if field == 'password' and value:
                if len(value) < rule.get('min_length', 8):
                    errors[field] = f"Password must be at least {rule.get('min_length', 8)} characters"
                else:
                    try:
                        validate_password(value)
                    except ValidationError as e:
                        errors[field] = list(e.messages)
        
        return len(errors) == 0, errors