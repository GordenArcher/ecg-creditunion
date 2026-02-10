import logging

from django.utils import timezone
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import AuditLog
from common.responses.response import error_response, success_response
from common.utils.generate_requestID import generate_request_id
from common.utils.request_utils import get_client_ip
from .serializers import AuditLogSerializer
from .utils.audit_helpers import AuditQueryHelper
from .utils.cache_utils import CacheManager

logger = logging.getLogger(__name__)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_audit_logs(request):
    """
    Get paginated audit logs with filtering capabilities.
    
    This endpoint is cached for 5 minutes. Cache is automatically invalidated
    when new audit logs are created or existing ones are modified/deleted.
    
    Query Parameters:
        - page: Page number (default: 1)
        - page_size: Items per page (default: 20, max: 100)
        - actor_id: Filter by user ID who performed the action
        - actor_role: Filter by actor's role
        - action: Filter by action type (partial match)
        - target_type: Filter by target type (partial match)
        - target_id: Filter by target ID (partial match)
        - status: Filter by status (SUCCESS/FAILED)
        - start_date: Filter logs after this date (YYYY-MM-DD)
        - end_date: Filter logs before this date (YYYY-MM-DD)
        - search: Search across action, target_type, target_id, actor_role
        - ordering: Sort order (-timestamp for descending, timestamp for ascending)
    
    Example Requests:
        GET /api/v1/audit/logs/?page=1&page_size=20
        GET /api/v1/audit/logs?action=USER_LOGIN&status=FAILED
        GET /api/v1/audit/logs?target_type=User&target_id=123
        GET /api/v1/audit/logs/?start_date=2024-01-01&end_date=2024-01-31
        GET /api/v1/audit/logs/?search=login&ordering=-timestamp
    
    Permissions:
        - User must be authenticated
        - User must be admin (is_staff=True)
    
    Returns:
        Success response with paginated audit logs and metadata
        Error response if unauthorized or invalid parameters
    """
    request_id = generate_request_id()
    
    if not request.user.is_staff and not getattr(request.user, 'is_admin', False):
        return error_response(
            message="Access denied. Admin privileges required.",
            status_code=status.HTTP_403_FORBIDDEN,
            code="INSUFFICIENT_PRIVILEGES",
            request_id=request_id,
            meta={
                "user_id": request.user.id,
                "is_staff": request.user.is_staff,
                "has_admin_attr": hasattr(request.user, 'is_admin'),
                "is_admin": getattr(request.user, 'is_admin', False)
            }
        )
    
    try:
        # Get query parameters
        params = request.query_params.dict()
        
        cache_params = params.copy()
        cache_key = CacheManager.generate_cache_key("audit_logs", cache_params)
        
        # Function to get audit data (called on cache miss)
        def get_audit_data():
            page = int(params.get('page', 1))
            page_size = int(params.get('page_size', 20))
            
            if page_size > 100:
                page_size = 100
            if page_size < 1:
                page_size = 20
            
            queryset = AuditLog.objects.all().select_related('actor')
            
            filters = AuditQueryHelper.build_filters(params)
            queryset = queryset.filter(filters)
            
            
            ordering = params.get('ordering', '-timestamp')
            if ordering.lstrip('-') in ['timestamp', 'action', 'target_type', 'status']:
                queryset = queryset.order_by(ordering)
            else:
                queryset = queryset.order_by('-timestamp')
            
            
            items, pagination_meta = AuditQueryHelper.get_paginated_results(
                queryset=queryset,
                page=page,
                page_size=page_size
            )
            
            
            serializer = AuditLogSerializer(items, many=True)
            
            return {
                "items": serializer.data,
                "pagination": pagination_meta
            }
        
        # Try to get from cache or compute
        cached_data = CacheManager.get_or_set(
            key=cache_key,
            func=get_audit_data,
            duration=CacheManager.AUDIT_LOGS_CACHE_DURATION
        )
        
        response_data = {
            "items": cached_data["items"],
            "pagination": cached_data["pagination"],
            "filters": {
                "applied": params,
                "available": {
                    "actor_id": "Filter by user ID",
                    "actor_role": "Filter by actor role",
                    "action": "Filter by action type",
                    "target_type": "Filter by target type",
                    "target_id": "Filter by target ID",
                    "status": "Filter by status (SUCCESS/FAILED)",
                    "start_date": "Filter logs after date (YYYY-MM-DD)",
                    "end_date": "Filter logs before date (YYYY-MM-DD)",
                    "search": "Search across multiple fields",
                    "ordering": "Sort order (-field for desc, field for asc)",
                    "page": "Page number",
                    "page_size": "Items per page (max 100)"
                }
            },
            "cache": {
                "cached": True,
                "cache_key": cache_key,
                "cache_duration_seconds": CacheManager.AUDIT_LOGS_CACHE_DURATION
            }
        }
        
        
        from .services.audit_service import AuditService
        AuditService.log(
            actor=request.user,
            action="AUDIT_LOG_ACCESS",
            target_type="AuditLog",
            status=AuditLog.Status.SUCCESS,
            ip_address=get_client_ip(request),
            device_info=request.META.get('HTTP_USER_AGENT', ''),
            metadata={
                "page": params.get('page', 1),
                "page_size": params.get('page_size', 20),
                "filters_applied": list(params.keys()),
                "total_results": cached_data["pagination"]["total_items"],
                "cache_key": cache_key
            }
        )
        
        return success_response(
            message="Audit logs retrieved successfully.",
            data=response_data,
            status_code=status.HTTP_200_OK,
            code="AUDIT_LOGS_RETRIEVED",
            request_id=request_id,
            meta={
                "items_count": len(cached_data["items"]),
                "total_items": cached_data["pagination"]["total_items"],
                "executed_by": request.user.email,
                "executed_at": timezone.now().isoformat(),
            }
        )
        
    except ValueError as e:
        logger.warning(f"Invalid parameter value in audit log request: {str(e)}")
        return error_response(
            message="Invalid parameter value.",
            errors={"detail": str(e)},
            status_code=status.HTTP_400_BAD_REQUEST,
            code="INVALID_PARAMETER",
            request_id=request_id,
            meta={"error_type": "ValueError", "parameters": dict(request.query_params)}
        )
        
    except Exception as e:
        logger.error(f"Error retrieving audit logs: {str(e)}", exc_info=True)
        return error_response(
            message="An error occurred while retrieving audit logs.",
            errors=str(e) if settings.DEBUG else None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
            request_id=request_id,
            meta={
                "error_type": type(e).__name__,
                "user_id": request.user.id if request.user.is_authenticated else None
            }
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_audit_log_detail(request, log_id):
    """
    Get detailed information about a specific audit log entry.
    
    This endpoint is cached for 5 minutes. Cache is automatically invalidated
    when this specific audit log is modified or deleted.
    
    Args:
        request: HTTP request
        log_id: ID of the audit log to retrieve
    
    Returns:
        Single audit log entry with all details
    """
    request_id = generate_request_id()
    
    # Check admin permissions
    if not request.user.is_staff and not getattr(request.user, 'is_admin', False):
        return error_response(
            message="Access denied. Admin privileges required.",
            status_code=status.HTTP_403_FORBIDDEN,
            code="INSUFFICIENT_PRIVILEGES",
            request_id=request_id
        )
    
    try:
        
        cache_key = f"audit_log_detail:{log_id}"
        
        # Function to get audit log detail (called on cache miss)
        def get_audit_log_data():
            audit_log = AuditLog.objects.select_related('actor').get(id=log_id)
            serializer = AuditLogSerializer(audit_log)
            return serializer.data
        
        # Try to get from cache or compute
        cached_data = CacheManager.get_or_set(
            key=cache_key,
            func=get_audit_log_data,
            duration=CacheManager.AUDIT_DETAIL_CACHE_DURATION
        )
        
        from .services.audit_service import AuditService
        AuditService.log(
            actor=request.user,
            action="AUDIT_LOG_DETAIL_ACCESS",
            target_type="AuditLog",
            target_id=str(log_id),
            status=AuditLog.Status.SUCCESS,
            ip_address=get_client_ip(request),
            metadata={
                "log_id": log_id,
                "cache_key": cache_key
            }
        )
        
        return success_response(
            message="Audit log detail retrieved successfully.",
            data={
                **cached_data,
            },
            status_code=status.HTTP_200_OK,
            code="AUDIT_LOG_DETAIL_RETRIEVED",
            request_id=request_id,
            meta={
                "log_id": log_id,
                "cache_key": cache_key
            }
        )
        
    except AuditLog.DoesNotExist:
        return error_response(
            message="Audit log not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            code="AUDIT_LOG_NOT_FOUND",
            request_id=request_id,
            meta={"log_id": log_id}
        )
        
    except Exception as e:
        logger.error(f"Error retrieving audit log detail {log_id}: {str(e)}")
        return error_response(
            message="An error occurred while retrieving audit log detail.",
            errors=str(e) if settings.DEBUG else None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
            request_id=request_id
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def invalidate_audit_cache(request):
    """
    Manually invalidate audit logs cache.
    
    Useful for:
    - Testing cache invalidation
    - Forcing refresh of cache after data imports
    - Debugging cache issues
    
    Note: Cache is automatically invalidated when audit logs are
    created/updated/deleted via signals.
    
    Returns:
        Success response confirming cache invalidation
    """
    request_id = generate_request_id()
    
    # Check admin permissions
    if not request.user.is_staff:
        return error_response(
            message="Access denied. Admin privileges required.",
            status_code=status.HTTP_403_FORBIDDEN,
            code="INSUFFICIENT_PRIVILEGES",
            request_id=request_id
        )
    
    try:
        CacheManager.invalidate_audit_logs_cache()
        
        from .services.audit_service import AuditService
        AuditService.log(
            actor=request.user,
            action="AUDIT_CACHE_INVALIDATED",
            target_type="System",
            status=AuditLog.Status.SUCCESS,
            ip_address=get_client_ip(request),
            metadata={
                "manual_invalidation": True,
                "requested_by": request.user.email
            }
        )
        
        return success_response(
            message="Audit logs cache invalidated successfully.",
            status_code=status.HTTP_200_OK,
            code="CACHE_INVALIDATED",
            request_id=request_id,
            meta={
                "invalidated_at": timezone.now().isoformat(),
                "invalidated_by": request.user.email
            }
        )
        
    except Exception as e:
        logger.error(f"Error invalidating audit cache: {str(e)}")
        return error_response(
            message="An error occurred while invalidating cache.",
            errors=str(e) if settings.DEBUG else None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
            request_id=request_id
        )