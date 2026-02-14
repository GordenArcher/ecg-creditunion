from django.utils import timezone
import logging
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from apps.users.models import User
from common.responses.response import success_response, error_response
from common.utils.generate_requestID import generate_request_id
from ..serializers import UserSerializer
from ..utils.user_helpers import UserUpdateService

from apps.audit.services.audit_service import AuditService
from apps.audit.models import AuditLog
from common.utils.request_utils import get_client_ip
logger = logging.getLogger(__name__)




@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_own_profile(request):
    """Get current user's own profile."""
    request_id = generate_request_id()
    
    try:
        serializer = UserSerializer(request.user)
        return success_response(
            message="Profile retrieved successfully.",
            data=serializer.data,
            status_code=status.HTTP_200_OK,
            code="PROFILE_RETRIEVED",
            request_id=request_id,
        )
    except Exception as e:
        logger.error(f"Error retrieving profile: {str(e)}", exc_info=True)
        return error_response(
            message="An error occurred while retrieving profile.",
            errors=str(e) if settings.DEBUG else None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
            request_id=request_id,
        )


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_own_profile(request):
    """Update current user's own profile."""
    request_id = generate_request_id()
    
    # Use the shared update service with 'self_update' context
    user, errors = UserUpdateService.update_user(
        user_id=str(request.user.id),
        update_data=request.data,
        requesting_user=request.user,
        context='self_update',
        request=request
    )
    
    if errors:
        return error_response(
            message="Failed to update profile.",
            errors=errors,
            status_code=status.HTTP_400_BAD_REQUEST,
            code="PROFILE_UPDATE_FAILED",
            request_id=request_id,
        )
    
    serializer = UserSerializer(user)
    return success_response(
        message="Profile updated successfully.",
        data=serializer.data,
        status_code=status.HTTP_200_OK,
        code="PROFILE_UPDATED",
        request_id=request_id,
    )



@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change current user's password."""
    request_id = generate_request_id()

    old_password = request.data.get("current_password")
    new_password = request.data.get("new_password")
    confirm_password = request.data.get("confirm_password")

    if not all([old_password, new_password, confirm_password]):
        return error_response(
            message="All password fields are required.",
            status_code=status.HTTP_400_BAD_REQUEST,
            code="MISSING_FIELDS",
            request_id=request_id,
        )

    if new_password != confirm_password:
        return error_response(
            message="New passwords do not match.",
            status_code=status.HTTP_400_BAD_REQUEST,
            code="PASSWORDS_MISMATCH",
            request_id=request_id,
        )

    if not request.user.check_password(old_password):
        return error_response(
            message="Old password is incorrect.",
            status_code=status.HTTP_400_BAD_REQUEST,
            code="INVALID_OLD_PASSWORD",
            request_id=request_id,
        )

    
    if request.user.check_password(new_password):
        return error_response(
            message="New password must be different from the old password.",
            status_code=status.HTTP_400_BAD_REQUEST,
            code="NEW_PASSWORD_SAME_AS_OLD",
            request_id=request_id,
        )

    try:
        validate_password(new_password, request.user)
    except ValidationError as e:
        return error_response(
            message=" ".join(e.messages),
            status_code=status.HTTP_400_BAD_REQUEST,
            code="WEAK_PASSWORD",
            request_id=request_id,
        )

    try:
        before_state = {
            "password_set": bool(request.user.password),
            "password_last_changed": getattr(request.user, "password_last_changed", None).isoformat() if getattr(request.user, "password_last_changed", None) else None,
        }

        request.user.set_password(new_password)
        request.user.password_last_changed = timezone.now()
        request.user.save()

        after_state = {
            "password_set": True,
            "password_last_changed": request.user.password_last_changed.isoformat(),
        }

        AuditService.log(
            actor=request.user,
            action="PASSWORD_CHANGE",
            target_type="User",
            target_id=str(request.user.id),
            severity=AuditLog.Severity.HIGH,
            status=AuditLog.Status.SUCCESS,
            ip_address=get_client_ip(request),
            metadata={
                "changed_by": f"{request.user.full_name} ({request.user.email or request.user.staff_id})",
                "method": "self_service",
            },
            before_state=before_state,
            after_state=after_state,
        )

        return success_response(
            message="Password changed successfully.",
            status_code=status.HTTP_200_OK,
            code="PASSWORD_CHANGED",
            request_id=request_id,
        )

    except Exception as e:
        logger.error(f"Error changing password: {str(e)}", exc_info=True)

        return error_response(
            message="An internal error occurred.",
            errors=str(e) if settings.DEBUG else None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
            request_id=request_id,
        )
    

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def first_time_password_change(request):
    """
    Endpoint for first-time password change. This is used when an admin creates a user with a temporary password and the user needs to set their own password on first login.
    evry staff user accessing account from the app for the first time will be required to change their password using this endpoint before they can access any other functionality. This ensures that temporary passwords are not used beyond the initial login.
    Expected Request Body:
        {
            "new_password": "new_password123",
            "confirm_password": "new_password123"
        }
    
    Returns:
        Success: Password changed message
        Error: Appropriate error message
    """
    request_id = generate_request_id()

    new_password = request.data.get("new_password")
    confirm_password = request.data.get("confirm_password")

    if not all([new_password, confirm_password]):
        return error_response(
            message="New password and confirm password are required.",
            status_code=status.HTTP_400_BAD_REQUEST,
            code="MISSING_FIELDS",
            request_id=request_id,
        )

    if new_password != confirm_password:
        return error_response(
            message="New passwords do not match.",
            status_code=status.HTTP_400_BAD_REQUEST,
            code="PASSWORDS_MISMATCH",
            request_id=request_id,
        )

    if request.user.account_meta and not request.user.account_meta.is_first_login:
        return error_response(
            message="Password change not allowed. This endpoint is only for first-time password changes.",
            status_code=status.HTTP_403_FORBIDDEN,
            code="NOT_FIRST_LOGIN",
            request_id=request_id,
        )

    try:
        validate_password(new_password, request.user)
    except ValidationError as e:
        return error_response(
            message=" ".join(e.messages),
            status_code=status.HTTP_400_BAD_REQUEST,
            code="WEAK_PASSWORD",
            request_id=request_id,
        )

    try:
        before_state = {
            "password_set": bool(request.user.password),
            "password_last_changed": getattr(request.user, "password_last_changed", None).isoformat() if getattr(request.user, "password_last_changed", None) else None,
        }

        request.user.set_password(new_password)
        request.user.password_last_changed = timezone.now()
        if hasattr(request.user, 'account_meta'):
            request.user.account_meta.is_first_login = False
            request.user.account_meta.save()
        request.user.save()

        after_state = {
            "password_set": True,
            "password_last_changed": request.user.password_last_changed.isoformat(),
        }

        AuditService.log(
            actor=request.user,
            action="FIRST_TIME_PASSWORD_CHANGE",
            target_type="User",
            target_id=str(request.user.id),
            severity=AuditLog.Severity.HIGH,
            status=AuditLog.Status.SUCCESS,
            ip_address=get_client_ip(request),
            metadata={
                "changed_by": f"{request.user.full_name} ({request.user.email or request.user.staff_id})",
                "method": "first_time_password_change_endpoint",
            },
            before_state=before_state,
            after_state=after_state,
        )

        return success_response(
            message="Password changed successfully.",
            status_code=status.HTTP_200_OK,
            code="PASSWORD_CHANGED",
            request_id=request_id,
        )
    
    except Exception as e:
        logger.error(f"Error during first-time password change: {str(e)}", exc_info=True)

        return error_response(
            message="An internal error occurred.",
            errors=str(e) if settings.DEBUG else None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
            request_id=request_id,
        )
    

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_profile_picture(request):
    """Upload or update profile picture."""
    request_id = generate_request_id()

    profile_picture = request.FILES.get("profile_picture")

    if not profile_picture:
        return error_response(
            message="No profile picture uploaded.",
            status_code=status.HTTP_400_BAD_REQUEST,
            code="NO_FILE_UPLOADED",
            request_id=request_id,
        )

    try:
        before_state = {
            "profile_picture": str(request.user.profile_picture) if request.user.profile_picture else None,
        }

        request.user.profile_picture = profile_picture
        request.user.save()

        after_state = {
            "profile_picture": str(request.user.profile_picture),
        }

        AuditService.log(
            actor=request.user,
            action="PROFILE_PICTURE_UPDATE",
            target_type="User",
            target_id=str(request.user.id),
            severity=AuditLog.Severity.MEDIUM,
            status=AuditLog.Status.SUCCESS,
            ip_address=get_client_ip(request),
            metadata={
                "updated_by": f"{request.user.full_name} ({request.user.email or request.user.staff_id})",
                "method": "upload_profile_picture_endpoint",
            },
            before_state=before_state,
            after_state=after_state,
        )

        serializer = UserSerializer(request.user)
        return success_response(
            message="Profile picture updated successfully.",
            data=serializer.data,
            status_code=status.HTTP_200_OK,
            code="PROFILE_PICTURE_UPDATED",
            request_id=request_id,
        )

    except Exception as e:
        logger.error(f"Error uploading profile picture: {str(e)}", exc_info=True)

        return error_response(
            message="An internal error occurred.",
            errors=str(e) if settings.DEBUG else None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
            request_id=request_id,
        )
    

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_profile_picture(request):
    """Delete profile picture."""
    request_id = generate_request_id()

    if not request.user.profile_picture:
        return error_response(
            message="No profile picture to delete.",
            status_code=status.HTTP_400_BAD_REQUEST,
            code="NO_PROFILE_PICTURE",
            request_id=request_id,
        )

    try:
        before_state = {
            "profile_picture": str(request.user.profile_picture),
        }

        request.user.profile_picture.delete(save=True)

        after_state = {
            "profile_picture": None,
        }

        AuditService.log(
            actor=request.user,
            action="PROFILE_PICTURE_DELETION",
            target_type="User",
            target_id=str(request.user.id),
            severity=AuditLog.Severity.MEDIUM,
            status=AuditLog.Status.SUCCESS,
            ip_address=get_client_ip(request),
            metadata={
                "deleted_by": f"{request.user.full_name} ({request.user.email or request.user.staff_id})",
                "method": "delete_profile_picture_endpoint",
            },
            before_state=before_state,
            after_state=after_state,
        )

        serializer = UserSerializer(request.user)
        return success_response(
            message="Profile picture deleted successfully.",
            data=serializer.data,
            status_code=status.HTTP_200_OK,
            code="PROFILE_PICTURE_DELETED",
            request_id=request_id,
        )

    except Exception as e:
        logger.error(f"Error deleting profile picture: {str(e)}", exc_info=True)

        return error_response(
            message="An internal error occurred.",
            errors=str(e) if settings.DEBUG else None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
            request_id=request_id,
        )
    


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_2fa(request):
    """Enable or disable two-factor authentication."""
    request_id = generate_request_id()

    enable_2fa = request.data.get("enable_2fa")

    if enable_2fa is None:
        return error_response(
            message="enable_2fa field is required.",
            status_code=status.HTTP_400_BAD_REQUEST,
            code="MISSING_FIELD",
            request_id=request_id,
        )

    try:
        before_state = {
            "two_factor_enabled": getattr(request.user.account_meta, 'two_factor_enabled', False),
        }

        request.user.account_meta.two_factor_enabled = enable_2fa
        request.user.save()

        after_state = {
            "two_factor_enabled": request.user.account_meta.two_factor_enabled,
        }

        AuditService.log(
            actor=request.user,
            action="TOGGLE_2FA",
            target_type="User",
            target_id=str(request.user.staff_id or request.user.id),
            severity=AuditLog.Severity.MEDIUM,
            status=AuditLog.Status.SUCCESS,
            ip_address=get_client_ip(request),
            metadata={
                "updated_by": f"{request.user.full_name} ({request.user.email or request.user.staff_id})",
                "method": "toggle_2fa_endpoint",
                "enabled": enable_2fa,
            },
            before_state=before_state,
            after_state=after_state,
        )

        return success_response(
            message=f"Two-factor authentication {'enabled' if enable_2fa else 'disabled'} successfully.",
            data={
                "two_factor_enabled": request.user.account_meta.two_factor_enabled,
            },
            status_code=status.HTTP_200_OK,
            code="TOGGLE_2FA_SUCCESS",
            request_id=request_id,
        )

    except Exception as e:
        logger.error(f"Error toggling 2FA: {str(e)}", exc_info=True)

        return error_response(
            message="An internal error occurred.",
            errors=str(e) if settings.DEBUG else None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
            request_id=request_id,
        )
    

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def set_2fa_method(request):
    """Set two-factor authentication method."""
    request_id = generate_request_id()

    two_factor_method = request.data.get("two_factor_method")

    if not two_factor_method:
        return error_response(
            message="two_factor_method field is required.",
            status_code=status.HTTP_400_BAD_REQUEST,
            code="MISSING_FIELD",
            request_id=request_id,
        )

    if two_factor_method not in ['SMS', 'EMAIL']:
        return error_response(
            message="Invalid two factor method. Must be 'SMS' or 'EMAIL'.",
            status_code=status.HTTP_400_BAD_REQUEST,
            code="INVALID_FIELD_VALUE",
            request_id=request_id,
        )

    try:
        before_state = {
            "two_factor_method": getattr(request.user.account_meta, 'two_factor_method', None),
        }

        request.user.account_meta.two_factor_method = two_factor_method
        request.user.save()

        after_state = {
            "two_factor_method": request.user.account_meta.two_factor_method,
        }

        AuditService.log(
            actor=request.user,
            action="SET_2FA_METHOD",
            target_type="User",
            target_id=str(request.user.staff_id or request.user.id),
            severity=AuditLog.Severity.MEDIUM,
            status=AuditLog.Status.SUCCESS,
            ip_address=get_client_ip(request),
            metadata={
                "updated_by": f"{request.user.full_name} ({request.user.email or request.user.staff_id})",
                "method": "set_2fa_method_endpoint",
                "two factor method": two_factor_method,
            },
            before_state=before_state,
            after_state=after_state,
        )

        return success_response(
            message=f"Two-factor authentication method set to {two_factor_method} successfully.",
            data={
                "two_factor_method": request.user.account_meta.two_factor_method,
            },
            status_code=status.HTTP_200_OK,
            code="SET_2FA_METHOD_SUCCESS",
            request_id=request_id,
        )

    except Exception as e:
        logger.error(f"Error setting 2FA method: {str(e)}", exc_info=True)

        return error_response(
            message="An internal error occurred.",
            errors=str(e) if settings.DEBUG else None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
            request_id=request_id,
        )
    
