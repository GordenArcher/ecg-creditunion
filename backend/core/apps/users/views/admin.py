import logging
from django.utils import timezone
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db import transaction
from apps.users.utils.permissions import PermissionHelper
from common.responses.response import success_response, error_response
from common.utils.generate_requestID import generate_request_id
from ..models import User
from ..serializers import UserSerializer
from ..utils.user_helpers import UserUpdateService, UserCreateService
from ..utils.query_helpers import UserQueryHelper
from ..utils.user_cache import UserCacheManager
from apps.audit.services.audit_service import AuditService
from apps.audit.models import AuditLog
from common.utils.request_utils import get_client_ip

logger = logging.getLogger(__name__)



@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminUser])
def list_all_users(request):
    """List all users (ADMIN and SUPER_ADMIN only)."""
    request_id = generate_request_id()
    
    try:
        params = request.query_params.dict()
        
        cached_data = UserCacheManager.get_cached_users_list(params)
        if cached_data:
            AuditService.log(
                actor=request.user,
                action="USER_LIST_READ_BY_ADMIN",
                severity=AuditLog.Severity.LOW,
                status=AuditLog.Status.SUCCESS,
                ip_address=get_client_ip(request),
                metadata={"filters": params, "cache_hit": True}
            )
            
            return success_response(
                message="Users retrieved successfully (cached).",
                data=cached_data,
                status_code=status.HTTP_200_OK,
                code="USERS_RETRIEVED",
                request_id=request_id,
            )
        
        queryset = User.objects.all().select_related('station', 'division')
        
        filters = UserQueryHelper.build_filters(params)
        queryset = queryset.filter(filters)
        
        ordering = params.get('ordering', '-date_joined')
        if ordering.lstrip('-') in ['email', 'full_name', 'staff_id', 'date_joined', 'role']:
            queryset = queryset.order_by(ordering)
        
        # Get pagination parameters
        page = int(params.get('page', 1))
        page_size = min(100, max(1, int(params.get('page_size', 20))))
        
        # Get paginated results
        items, pagination_meta = UserQueryHelper.get_paginated_users(
            queryset=queryset,
            page=page,
            page_size=page_size
        )
        
        # Serialize data
        serializer = UserSerializer(items, many=True)
        
        # Prepare response data
        response_data = {
            "items": serializer.data,
            "pagination": pagination_meta,
            "filters": {
                "applied": params,
                "available": {
                    "role": "Filter by role",
                    "station_id": "Filter by station",
                    "division_id": "Filter by division",
                    "is_active": "Filter by active status",
                    "discontinued": "Filter by discontinued status",
                    "search": "Search in email, name, staff_id, phone",
                    "ordering": "Sort by field (- for descending)",
                    "page": "Page number",
                    "page_size": "Items per page (max 100)",
                }
            }
        }
        
        UserCacheManager.cache_users_list(params, response_data)
        
        AuditService.log(
            actor=request.user,
            action="USER_LIST_READ_BY_ADMIN",
            severity=AuditLog.Severity.LOW,
            status=AuditLog.Status.SUCCESS,
            ip_address=get_client_ip(request),
            metadata={"filters": params, "total_items": pagination_meta["total_items"]}
        )
        
        return success_response(
            message="Users retrieved successfully.",
            data=response_data,
            status_code=status.HTTP_200_OK,
            code="USERS_RETRIEVED",
            request_id=request_id,
        )
        
    except Exception as e:
        logger.error(f"Error retrieving users list: {str(e)}", exc_info=True)
        return error_response(
            message="An error occurred while retrieving users.",
            errors=str(e) if settings.DEBUG else None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
            request_id=request_id,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def create_staff_user(request):
    """Create a new staff user (ADMIN and SUPER_ADMIN only)."""
    request_id = generate_request_id()
    
    user, errors = UserCreateService.create_user(
        user_data=request.data,
        requesting_user=request.user,
        context='admin_create_staff',
        request=request
    )
    
    if errors:
        return error_response(
            message="Failed to create staff user.",
            errors=errors,
            status_code=status.HTTP_400_BAD_REQUEST,
            code="STAFF_CREATE_FAILED",
            request_id=request_id,
        )
    
    serializer = UserSerializer(user)
    return success_response(
        message="Staff user created successfully.",
        data=serializer.data,
        status_code=status.HTTP_201_CREATED,
        code="STAFF_CREATED",
        request_id=request_id,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_user_details(request, user_id):
    """Get detailed information about any user (ADMIN and SUPER_ADMIN only)."""
    request_id = generate_request_id()
    
    try:
        # Try cache first
        cached_user = UserCacheManager.get_user(user_id)
        if cached_user:
            # Log read access
            AuditService.log(
                actor=request.user,
                action="USER_DETAIL_READ_BY_ADMIN",
                target_type="User",
                target_id=user_id,
                severity=AuditLog.Severity.LOW,
                status=AuditLog.Status.SUCCESS,
                ip_address=get_client_ip(request),
                metadata={"cache_hit": True}
            )
            
            return success_response(
                message="User retrieved successfully (cached).",
                data=cached_user,
                status_code=status.HTTP_200_OK,
                code="USER_RETRIEVED",
                request_id=request_id,
            )
        
        # Get from database
        user = User.objects.select_related('station', 'division').get(id=user_id)
        serializer = UserSerializer(user)
        
        # Cache the user
        UserCacheManager.cache_user(user)
        
        # Log read access
        AuditService.log(
            actor=request.user,
            action="USER_DETAIL_READ_BY_ADMIN",
            target_type="User",
            target_id=user_id,
            severity=AuditLog.Severity.LOW,
            status=AuditLog.Status.SUCCESS,
            ip_address=get_client_ip(request),
            metadata={"cache_hit": False}
        )
        
        return success_response(
            message="User retrieved successfully.",
            data=serializer.data,
            status_code=status.HTTP_200_OK,
            code="USER_RETRIEVED",
            request_id=request_id,
        )
        
    except User.DoesNotExist:
        return error_response(
            message="User not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            code="USER_NOT_FOUND",
            request_id=request_id,
        )
    except Exception as e:
        logger.error(f"Error retrieving user {user_id}: {str(e)}")
        return error_response(
            message="An error occurred while retrieving user.",
            errors=str(e) if settings.DEBUG else None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
            request_id=request_id,
        )


@api_view(["PUT"])
@permission_classes([IsAuthenticated, IsAdminUser])
def update_staff_user(request, user_id):
    """Update a staff user (ADMIN and SUPER_ADMIN only)."""
    request_id = generate_request_id()
    
    # Use shared update service with 'admin_update_staff' context
    user, errors = UserUpdateService.update_user(
        user_id=user_id,
        update_data=request.data,
        requesting_user=request.user,
        context='admin_update_staff',
        request=request
    )
    
    if errors:
        if "User not found" in str(errors.get('error', '')):
            return error_response(
                message="User not found.",
                status_code=status.HTTP_404_NOT_FOUND,
                code="USER_NOT_FOUND",
                request_id=request_id,
            )
        return error_response(
            message="Failed to update staff user.",
            errors=errors,
            status_code=status.HTTP_400_BAD_REQUEST,
            code="STAFF_UPDATE_FAILED",
            request_id=request_id,
        )
    
    serializer = UserSerializer(user)
    return success_response(
        message="Staff user updated successfully.",
        data=serializer.data,
        status_code=status.HTTP_200_OK,
        code="STAFF_UPDATED",
        request_id=request_id,
    )


@api_view(["PUT"])
@permission_classes([IsAuthenticated, IsAdminUser])
def update_any_user(request, user_id):
    """Update any user (SUPER_ADMIN only - can update admins too)."""
    request_id = generate_request_id()
    
    if request.user.role != 'SUPER_ADMIN':
        return error_response(
            message="Only SUPER_ADMIN can update any user.",
            status_code=status.HTTP_403_FORBIDDEN,
            code="INSUFFICIENT_PRIVILEGES",
            request_id=request_id,
        )
    
    # we use shared update service with 'admin_update_any' context
    user, errors = UserUpdateService.update_user(
        user_id=user_id,
        update_data=request.data,
        requesting_user=request.user,
        context='admin_update_any',
        request=request
    )
    
    if errors:
        if "User not found" in str(errors.get('error', '')):
            return error_response(
                message="User not found.",
                status_code=status.HTTP_404_NOT_FOUND,
                code="USER_NOT_FOUND",
                request_id=request_id,
            )
        return error_response(
            message="Failed to update user.",
            errors=errors,
            status_code=status.HTTP_400_BAD_REQUEST,
            code="USER_UPDATE_FAILED",
            request_id=request_id,
        )
    
    serializer = UserSerializer(user)
    return success_response(
        message="User updated successfully.",
        data=serializer.data,
        status_code=status.HTTP_200_OK,
        code="USER_UPDATED",
        request_id=request_id,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def discontinue_user(request, user_id):
    """Discontinue a user account (soft delete)."""
    request_id = generate_request_id()
    
    # Use shared service
    from ..utils.user_helpers import UserUpdateService
    
    try:
        user = User.objects.get(id=user_id)
        
        if user.role == 'SUPER_ADMIN' and request.user.role != 'SUPER_ADMIN':
            return error_response(
                message="Only SUPER_ADMIN can discontinue another SUPER_ADMIN.",
                status_code=status.HTTP_403_FORBIDDEN,
                code="INSUFFICIENT_PRIVILEGES",
                request_id=request_id,
            )
        
        if user.role == 'ADMIN' and request.user.role not in ['SUPER_ADMIN']:
            return error_response(
                message="Only SUPER_ADMIN can discontinue ADMIN users.",
                status_code=status.HTTP_403_FORBIDDEN,
                code="INSUFFICIENT_PRIVILEGES",
                request_id=request_id,
            )
        
        if user.id == request.user.id:
            return error_response(
                message="Cannot discontinue your own account.",
                status_code=status.HTTP_400_BAD_REQUEST,
                code="SELF_DISCONTINUE_NOT_ALLOWED",
                request_id=request_id,
            )
        
        
        update_data = {'discontinued': True, 'is_active': False}
        
        # Determine context based on user role
        context = 'admin_update_staff' if user.role == 'STAFF' else 'admin_update_any'
        
        updated_user, errors = UserUpdateService.update_user(
            user_id=user_id,
            update_data=update_data,
            requesting_user=request.user,
            context=context,
            request=request
        )
        
        if errors:
            return error_response(
                message="Failed to discontinue user.",
                errors=errors,
                status_code=status.HTTP_400_BAD_REQUEST,
                code="USER_DISCONTINUE_FAILED",
                request_id=request_id,
            )
        
        serializer = UserSerializer(updated_user)
        return success_response(
            message="User discontinued successfully.",
            data=serializer.data,
            status_code=status.HTTP_200_OK,
            code="USER_DISCONTINUED",
            request_id=request_id,
        )
        
    except User.DoesNotExist:
        return error_response(
            message="User not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            code="USER_NOT_FOUND",
            request_id=request_id,
        )
    except Exception as e:
        logger.error(f"Error discontinuing user {user_id}: {str(e)}", exc_info=True)
        return error_response(
            message="An error occurred while discontinuing user.",
            errors=str(e) if settings.DEBUG else None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
            request_id=request_id,
        )
    

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def employee_delete(request, employee_id):
    """
    Permanently delete an employee.
    
    DELETE /api/v1/users/admin/users/{employee_id}/
    
    Path Parameters:
        - employee_id: ID of the employee to delete
    
    Returns:
        204 No Content on success
        403 Forbidden if insufficient permissions
        404 Not Found if employee doesn't exist
    """
    try:
        employee = User.objects.get(employee_id=employee_id)
        
        # Check if user has permission to delete this employee
        if not PermissionHelper.can_delete_user(request.user, employee):
            return error_response(
                message="You don't have permission to delete this user",
                status_code=status.HTTP_403_FORBIDDEN,
                code="DELETE_FORBIDDEN"
            )
        
        # we're storing info for audit log before deletion
        employee_data = {
            'id': str(employee.employee_id),
            'staff_id': employee.staff_id,
            'email': employee.email,
            'full_name': employee.full_name,
            'role': employee.role
        }
        
        
        employee.delete()
        
        UserCacheManager.invalidate_user(employee_id)
        UserCacheManager.invalidate_all_users()
        
        AuditService.log(
            actor=request.user,
            action="USER_DELETE",
            target_type="User",
            target_id=str(employee_id),
            severity=AuditLog.Severity.HIGH,
            status=AuditLog.Status.SUCCESS,
            ip_address=get_client_ip(request),
            metadata={
                "deleted_user": employee_data,
                "deleted_by_role": request.user.role
            }
        )
        
        return success_response(
            message="Employee deleted successfully",
            data={"deleted": True},
            status_code=status.HTTP_204_NO_CONTENT,
            code="USER_DELETED"
        )
        
    except User.DoesNotExist:
        return error_response(
            message="Employee not found",
            status_code=status.HTTP_404_NOT_FOUND,
            code="USER_NOT_FOUND"
        )
    except Exception as e:
        logger.error(f"Error deleting employee {employee_id}: {str(e)}", exc_info=True)
        return error_response(
            message="Failed to delete employee",
            errors=str(e) if settings.DEBUG else None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="DELETE_ERROR"
        )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdminUser])
def employee_toggle_discontinue(request, employee_id):
    """
    Toggle discontinued status for an employee.
    Discontinue = remove system access, Activate = restore access.
    
    PATCH /api/v1/users/admin/users/{employee_id}/toggle-discontinue/
    PATCH /api/v1/users/admin/users/{employee_id}/toggle-status/
    
    Path Parameters:
        - employee_id: ID of the employee
    
    Request Body (optional):
        {
            "discontinued": true   # If not provided, toggles current value
        }
    
    Returns:
        Updated employee object with new discontinued status
    """
    try:
        employee = User.objects.get(employee_id=employee_id)
        
        if not PermissionHelper.can_update_user(request.user, employee, 'admin_update_staff'):
            return error_response(
                message="You don't have permission to update this user",
                status_code=status.HTTP_403_FORBIDDEN,
                code="UPDATE_FORBIDDEN"
            )

        before_state = {
            "discontinued": employee.discontinued,
            "discontinued_date": employee.discontinued_date.isoformat() if employee.discontinued_date else None,
        }
        
        # Determine new discontinued status
        if 'discontinued' in request.data:
            # Explicit value provided
            new_status = bool(request.data['discontinued'])
        else:
            # Toggle current status
            new_status = not employee.discontinued
        
        previous_status = employee.discontinued
        
        
        employee.discontinued = new_status
        employee.discontinued_date = timezone.now() if new_status else None
        employee.save()
        
        UserCacheManager.invalidate_user(employee_id)
        UserCacheManager.invalidate_all_users()

        after_state = {
            "discontinued": employee.discontinued,
            "discontinued_date": employee.discontinued_date.isoformat() if employee.discontinued_date else None,
        }
        
        serializer = UserSerializer(employee)
        
        AuditService.log(
            actor=request.user,
            action="USER_DISCONTINUE_TOGGLE" if new_status else "USER_ACTIVATE",
            target_type="User",
            target_id=str(employee.employee_id),
            severity=AuditLog.Severity.MEDIUM,
            status=AuditLog.Status.SUCCESS,
            ip_address=get_client_ip(request),
            metadata={
                "user_id": employee.id,
                "staff_id": employee.staff_id,
                "previous_status": previous_status,
                "new_status": new_status,
                "updated_by_role": request.user.role
            },
            before_state=before_state,
            after_state=after_state
        )
        
        action = "discontinued" if new_status else "activated"
        return success_response(
            message=f"Employee {action} successfully",
            data=serializer.data,
            status_code=status.HTTP_200_OK,
            code="USER_STATUS_UPDATED"
        )
        
    except User.DoesNotExist:
        return error_response(
            message="Employee not found",
            status_code=status.HTTP_404_NOT_FOUND,
            code="USER_NOT_FOUND"
        )
    except Exception as e:
        logger.error(f"Error toggling discontinue status for employee {employee_id}: {str(e)}", exc_info=True)
        return error_response(
            message="Failed to update employee status",
            errors=str(e) if settings.DEBUG else None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="UPDATE_ERROR"
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def employee_bulk_toggle_discontinue(request):
    """
    Bulk discontinue/activate multiple employees.
    
    POST /api/v1/users/admin/users/bulk/toggle-discontinue/
    
    Request Body:
    {
        "employee_ids": [1, 2, 3, 4, 5],
        "discontinued": true   # true = discontinue, false = activate
    }
    
    Returns:
        Summary of updated employees
    """
    try:
        employee_ids = request.data.get('employee_ids', [])
        new_status = request.data.get('discontinued', True)
        
        if not employee_ids:
            return error_response(
                message="No employee IDs provided",
                status_code=status.HTTP_400_BAD_REQUEST,
                code="NO_IDS"
            )
        
        updated_count = 0
        failed_ids = []
        
        with transaction.atomic():
            for emp_id in employee_ids:
                try:
                    employee = User.objects.get(id=emp_id)
                    
                    if PermissionHelper.can_update_user(request.user, employee, 'admin_update_staff'):
                        employee.discontinued = new_status
                        employee.discontinued_date = timezone.now() if new_status else None
                        employee.save()
                        updated_count += 1
                        
                        UserCacheManager.invalidate_user(emp_id)
                    else:
                        failed_ids.append({"id": emp_id, "reason": "Permission denied to update profile"})
                        
                except User.DoesNotExist:
                    failed_ids.append({"id": emp_id, "reason": "User not found"})
                except Exception as e:
                    failed_ids.append({"id": emp_id, "reason": str(e)})
        
        UserCacheManager.invalidate_all_users()
        
        AuditService.log(
            actor=request.user,
            action="USER_BULK_DISCONTINUE" if new_status else "USER_BULK_ACTIVATE",
            target_type="User",
            severity=AuditLog.Severity.HIGH,
            status=AuditLog.Status.SUCCESS,
            ip_address=get_client_ip(request),
            metadata={
                "total_processed": len(employee_ids),
                "updated_count": updated_count,
                "failed_count": len(failed_ids),
                "new_status": new_status,
                "updated_by_role": request.user.role
            }
            
        )
        
        action = "discontinued" if new_status else "activated"
        return success_response(
            message=f"{updated_count} employees {action} successfully",
            data={
                "updated_count": updated_count,
                "failed_ids": failed_ids,
                "success": True
            },
            status_code=status.HTTP_200_OK,
            code="BULK_UPDATE_COMPLETED"
        )
        
    except Exception as e:
        logger.error(f"Error bulk updating employees: {str(e)}", exc_info=True)
        return error_response(
            message="Failed to bulk update employees",
            errors=str(e) if settings.DEBUG else None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="BULK_UPDATE_ERROR"
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def employee_bulk_delete(request):
    """
    Bulk delete multiple employees.
    
    POST /api/v1/users/admin/users/bulk/delete/
    
    Request Body:
    {
        "employee_ids": [1, 2, 3, 4, 5]
    }
    
    Returns:
        Summary of deleted employees
    """
    try:
        employee_ids = request.data.get('employee_ids', [])
        
        if not employee_ids:
            return error_response(
                message="No employee IDs provided",
                status_code=status.HTTP_400_BAD_REQUEST,
                code="NO_IDS"
            )
        
        deleted_count = 0
        failed_ids = []
        deleted_users_info = []
        
        with transaction.atomic():
            for emp_id in employee_ids:
                try:
                    employee = User.objects.get(id=emp_id)
                    
                    
                    if PermissionHelper.can_delete_user(request.user, employee):
                        user_info = {
                            'id': employee.id,
                            'staff_id': employee.staff_id,
                            'email': employee.email,
                            'full_name': employee.full_name,
                            'role': employee.role
                        }
                        
                        employee.delete()
                        deleted_count += 1
                        deleted_users_info.append(user_info)
                        
                        
                        UserCacheManager.invalidate_user(emp_id)
                    else:
                        failed_ids.append({"id": emp_id, "reason": "Permission denied"})
                        
                except User.DoesNotExist:
                    failed_ids.append({"id": emp_id, "reason": "User not found"})
                except Exception as e:
                    failed_ids.append({"id": emp_id, "reason": str(e)})
        
        UserCacheManager.invalidate_all_users()
        
        AuditService.log(
            actor=request.user,
            action="USER_BULK_DELETE",
            target_type="User",
            severity=AuditLog.Severity.HIGH,
            status=AuditLog.Status.SUCCESS,
            ip_address=get_client_ip(request),
            metadata={
                "total_requested": len(employee_ids),
                "deleted_count": deleted_count,
                "failed_count": len(failed_ids),
                "deleted_users": deleted_users_info,
                "deleted_by_role": request.user.role
            }
        )
        
        return success_response(
            message=f"{deleted_count} employees deleted successfully",
            data={
                "deleted_count": deleted_count,
                "failed_ids": failed_ids,
                "success": True
            },
            status_code=status.HTTP_200_OK,
            code="BULK_DELETE_COMPLETED"
        )
        
    except Exception as e:
        logger.error(f"Error bulk deleting employees: {str(e)}", exc_info=True)
        return error_response(
            message="Failed to bulk delete employees",
            errors=str(e) if settings.DEBUG else None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="BULK_DELETE_ERROR"
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def employee_detail(request, employee_id):
    """
    Get detailed information for a single employee.
    
    GET /api/v1/users/admin/users/{employee_id}/
    
    Path Parameters:
        - employee_id: ID of the employee
    
    Returns:
        Detailed employee object
    """
    try:
        employee = User.objects.get(id=employee_id)
        
        if not PermissionHelper.can_view_user(request.user, employee):
            return error_response(
                message="You don't have permission to view this user",
                status_code=status.HTTP_403_FORBIDDEN,
                code="VIEW_FORBIDDEN"
            )
        
        serializer = UserSerializer(employee)
        
        return success_response(
            message="Employee details retrieved successfully",
            data=serializer.data,
            status_code=status.HTTP_200_OK,
            code="USER_RETRIEVED"
        )
        
    except User.DoesNotExist:
        return error_response(
            message="Employee not found",
            status_code=status.HTTP_404_NOT_FOUND,
            code="USER_NOT_FOUND"
        )