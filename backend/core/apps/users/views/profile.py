import logging
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from common.responses.response import success_response, error_response
from common.utils.generate_requestID import generate_request_id
from ..serializers import UserSerializer
from ..utils.user_helpers import UserUpdateService

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
    
    old_password = request.data.get("old_password")
    new_password = request.data.get("new_password")
    confirm_password = request.data.get("confirm_password")
    
    if not all([old_password, new_password, confirm_password]):
        return error_response(
            message="Old password, new password and confirm password are required.",
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
    
    if len(new_password) < 8:
        return error_response(
            message="New password must be at least 8 characters long.",
            status_code=status.HTTP_400_BAD_REQUEST,
            code="PASSWORD_TOO_SHORT",
            request_id=request_id,
        )
    
    if not request.user.check_password(old_password):
        return error_response(
            message="Old password is incorrect.",
            status_code=status.HTTP_400_BAD_REQUEST,
            code="INVALID_OLD_PASSWORD",
            request_id=request_id,
        )
    
    if request.user.check_password(old_password) == new_password:
        return error_response(
            message="New password must be different from the old password.",
            status_code=status.HTTP_400_BAD_REQUEST,
            code="NEW_PASSWORD_SAME_AS_OLD",
            request_id=request_id,
        )
    
    try:
        request.user.set_password(new_password)
        request.user.save()
        
        from apps.audit.services import AuditService
        from apps.audit.models import AuditLog
        from common.utils.request_utils import get_client_ip
        
        AuditService.log(
            actor=request.user,
            action="PASSWORD_CHANGE",
            target_type="User",
            target_id=str(request.user.id),
            severity=AuditLog.Severity.HIGH,
            status=AuditLog.Status.SUCCESS,
            ip_address=get_client_ip(request),
            metadata={"changed_by": "user"}
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
            message="An error occurred while changing password.",
            errors=str(e) if settings.DEBUG else None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
            request_id=request_id,
        )