from typing import List, Set


class PermissionHelper:
    """Permission checking utilities."""
    
    # Field permissions by context and role
    FIELD_PERMISSIONS = {
        'self_update': {
            'SUPER_ADMIN': {'full_name', 'phone_number', 'avatar', 'date_of_birth'},
            'ADMIN': {'full_name', 'phone_number', 'avatar', 'date_of_birth'},
            'STAFF': {'full_name', 'phone_number', 'avatar', 'date_of_birth'},
        },
        'admin_update_staff': {
            'SUPER_ADMIN': {'full_name', 'phone_number', 'role', 'station', 'division', 'is_active'},
            'ADMIN': {'full_name', 'phone_number', 'station', 'division'},
        },
        'admin_update_any': {
            'SUPER_ADMIN': {'full_name', 'phone_number', 'role', 'station', 'division', 'is_active', 'discontinued'},
            'ADMIN': {'full_name', 'phone_number', 'station', 'division', 'is_active'},
        }
    }
    
    CREATION_PERMISSIONS = {
        "admin_create_staff": {
            "SUPER_ADMIN": {
                "email",
                "password",
                "full_name",
                "staff_id",
                "phone_number",
                "role",
                "station_id",
                "division_id",
                "date_registered",
                "title",
                "gender",
                "date_of_birth",
                "marital_status",
                "number_of_dependents",
                "directorate",
                "is_active",
                "discontinued",
                "discontinued_date",
                "avatar",
            },

            "ADMIN": {
                "email",
                "password",
                "full_name",
                "staff_id",
                "phone_number",
                "role",
                "station",
                "division",
                "date_registered",
                "title",
                "gender",
                "date_of_birth",
                "marital_status",
                "number_of_dependents",
                "directorate",
                "is_active",
                "discontinued",
                "discontinued_date",
                "avatar",
            },
        }
    }

    
    # Allowed roles that can be assigned
    ALLOWED_ROLES_BY_CONTEXT = {
        'admin_create_staff': {
            'SUPER_ADMIN': ['STAFF', 'ADMIN'],
            'ADMIN': ['STAFF'],
        },
        'admin_update_staff': {
            'SUPER_ADMIN': ['STAFF', 'ADMIN'],
            'ADMIN': ['STAFF'],
        }
    }
    
    @staticmethod
    def can_update_user(requesting_user, user_to_update, context: str) -> bool:
        """Check if user can update another user in given context."""
        if context == 'self_update':
            # User can only update themselves
            return requesting_user.id == user_to_update.id
        
        elif context == 'admin_update_staff':
            # Admin can update staff
            if requesting_user.role not in ['SUPER_ADMIN', 'ADMIN']:
                return False
            # Staff can only be updated by admins
            return user_to_update.role == 'STAFF'
        
        elif context == 'admin_update_any':
            # Only SUPER_ADMIN can update anyone (including other admins)
            return requesting_user.role == 'SUPER_ADMIN'
        
        return False
    
    @staticmethod
    def can_create_user(requesting_user, context: str) -> bool:
        """Check if user can create users in given context."""
        if context == 'admin_create_staff':
            return requesting_user in ['SUPER_ADMIN', 'ADMIN']
        return False
    
    @staticmethod
    def can_delete_user(requesting_user, user_to_delete):
        """Check if user can delete another user."""
        # SUPER_ADMIN can delete anyone except themselves
        if requesting_user.role == 'SUPER_ADMIN':
            return requesting_user.id != user_to_delete.id
        
        # ADMIN can only delete STAFF
        if requesting_user.role == 'ADMIN':
            return user_to_delete.role == 'STAFF'
        
        # STAFF cannot delete anyone
        return False

    @staticmethod
    def can_view_user(requesting_user, user_to_view):
        """Check if user can view another user's details."""
        # Users can always view themselves
        if requesting_user.id == user_to_view.id:
            return True
        
        # SUPER_ADMIN and ADMIN can view anyone
        if requesting_user.role in ['SUPER_ADMIN', 'ADMIN']:
            return True
        
        # STAFF can only view other STAFF members
        if requesting_user.role == 'STAFF':
            return user_to_view.role == 'STAFF'
        
        return False
    
    @staticmethod
    def get_allowed_update_fields(requesting_user, context: str) -> Set[str]:
        """Get allowed fields for update based on context and role."""
        return PermissionHelper.FIELD_PERMISSIONS.get(context, {}).get(requesting_user.role, set())
    
    @staticmethod
    def get_allowed_create_fields(requesting_user, context: str) -> Set[str]:
        """Get allowed fields for creation based on context and role."""
        return PermissionHelper.CREATION_PERMISSIONS.get(context, {}).get(requesting_user, set())
    
    @staticmethod
    def get_allowed_roles(requesting_user, context: str) -> List[str]:
        """Get allowed roles that can be assigned."""
        return PermissionHelper.ALLOWED_ROLES_BY_CONTEXT.get(context, {}).get(requesting_user, [])