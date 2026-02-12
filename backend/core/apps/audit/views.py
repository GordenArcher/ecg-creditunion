import logging

from django.utils import timezone
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from .models import AuditLog
from common.responses.response import error_response, success_response
from common.utils.generate_requestID import generate_request_id
from common.utils.request_utils import get_client_ip
from .serializers import AuditLogSerializer
from .utils.audit_helpers import AuditQueryHelper
from .utils.cache_utils import CacheManager
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from django.db import models
import logging

logger = logging.getLogger(__name__)

logger = logging.getLogger(__name__)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminUser])
@permission_classes([AllowAny])

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
    if request.user.role not in ["ADMIN", "SUPER_ADMIN"]:
        return error_response(
            message="Access denied. Admin privileges required.",
            status_code=status.HTTP_403_FORBIDDEN,
            code="INSUFFICIENT_PRIVILEGES",
            request_id=request_id
        )
    
    try:
        
        cache_key = f"audit_log_detail:{str(log_id)}"
        
        # Function to get audit log detail (called on cache miss)
        def get_audit_log_data():
            audit_log = AuditLog.objects.select_related('actor').get(id=log_id)
            serializer = AuditLogSerializer(audit_log)
            return serializer.data
        
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
                "log_id": str(log_id),
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
                "log_id": str(log_id),
                "cache_key": cache_key
            }
        )
        
    except AuditLog.DoesNotExist:
        return error_response(
            message="Audit log not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            code="AUDIT_LOG_NOT_FOUND",
            request_id=request_id,
            meta={"log_id": str(log_id)}
        )
        
    except Exception as e:
        logger.error(f"Error retrieving audit log detail {str(log_id)}: {str(e)}")
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
    




class AuditLogPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def audit_log_list(request):
    """
    Get paginated list of audit logs with filtering.
    
    GET /api/v1/audit/logs/
    
    Query Parameters:
        - page: Page number (default: 1)
        - page_size: Items per page (default: 20, max: 100)
        - search: Search in actor email, action, target, details
        - actor_id: Filter by specific actor
        - action: Filter by action type
        - severity: Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)
        - target_type: Filter by target type (User, Employee, etc.)
        - date_from: Start date (YYYY-MM-DD)
        - date_to: End date (YYYY-MM-DD)
        - ordering: Sort field (prefix - for descending)


    Example Requests:
        GET /api/v1/audit/logs/?page=1&page_size=20
        GET /api/v1/audit/logs?action=USER_LOGIN&status=FAILED
        GET /api/v1/audit/logs?target_type=User&target_id=123
        GET /api/v1/audit/logs/?date_from=2024-01-01&date_to=2024-01-31
        GET /api/v1/audit/logs/?search=login&ordering=-timestamp
    
    Permissions:
        - User must be authenticated
        - User must be admin (is_staff=True)
    
    Returns:
        Success response with paginated audit logs and metadata
        Error response if unauthorized or invalid parameters
    """
    try:
        # Base queryset
        queryset = AuditLog.objects.select_related('actor').all()
        
        # Apply filters
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(actor__email__icontains=search) |
                Q(actor__full_name__icontains=search) |
                Q(action__icontains=search) |
                Q(target_type__icontains=search) |
                Q(metadata__icontains=search)
            )
        
        actor_id = request.query_params.get('actor_id')
        if actor_id:
            queryset = queryset.filter(actor_id=actor_id)
        
        action = request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)
        
        severity = request.query_params.get('severity')
        if severity:
            queryset = queryset.filter(severity=severity)
        
        target_type = request.query_params.get('target_type')
        if target_type:
            queryset = queryset.filter(target_type__icontains=target_type)
        
        # Date range filters
        date_from = request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(timestamp__date__gte=date_from)
        
        date_to = request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(timestamp__date__lte=date_to)
        
        # Ordering
        ordering = request.query_params.get('ordering', '-timestamp')
        allowed_order_fields = ['timestamp', 'action', 'severity', 'actor__email', 'target_type']
        
        # Validate ordering field
        order_field = ordering.lstrip('-')
        if order_field in allowed_order_fields or order_field in ['actor__email', 'actor__full_name']:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by('-timestamp')
        
        # Pagination
        paginator = AuditLogPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = AuditLogSerializer(page, many=True)
        
        # Get distinct filter options for frontend
        distinct_actions = AuditLog.objects.values_list('action', flat=True).distinct()[:50]
        distinct_severities = AuditLog.objects.values_list('severity', flat=True).distinct()
        distinct_target_types = AuditLog.objects.values_list('target_type', flat=True).distinct()[:50]
        
        return success_response(
            data={
                "items": serializer.data,
                "pagination": {
                    "total_items": paginator.page.paginator.count,
                    "total_pages": paginator.page.paginator.num_pages,
                    "current_page": paginator.page.number,
                    "page_size": paginator.page.paginator.per_page,
                    "has_next": paginator.page.has_next(),
                    "has_previous": paginator.page.has_previous(),
                    "next_page_number": paginator.page.next_page_number() if paginator.page.has_next() else None,
                    "previous_page_number": paginator.page.previous_page_number() if paginator.page.has_previous() else None,
                },
                "filters": {
                    "available_actions": list(distinct_actions),
                    "available_severities": list(distinct_severities),
                    "available_target_types": list(distinct_target_types),
                }
            },
            message="Audit logs retrieved successfully",
            code="AUDIT_LOGS_RETRIEVED"
        )
        
    except Exception as e:
        logger.error(f"Error fetching audit logs: {str(e)}", exc_info=True)
        return error_response(
            message="Failed to retrieve audit logs",
            errors=str(e) if settings.DEBUG else None,
            code="AUDIT_LOGS_ERROR",
            status_code=500
        )




@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def audit_log_stats(request):
    """
    Get audit log statistics.
    
    GET /api/v1/audit/stats/
    """
    try:
        from django.utils import timezone
        from datetime import timedelta
        
        today = timezone.now()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        stats = {
            "total_logs": AuditLog.objects.count(),
            "logs_today": AuditLog.objects.filter(timestamp__date=today.date()).count(),
            "logs_this_week": AuditLog.objects.filter(timestamp__gte=week_ago).count(),
            "logs_this_month": AuditLog.objects.filter(timestamp__gte=month_ago).count(),
            "by_severity": {
                severity: AuditLog.objects.filter(severity=severity).count()
                for severity in ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
            },
            "by_action": {
                action: AuditLog.objects.filter(action=action).count()
                for action in AuditLog.objects.values_list('action', flat=True).distinct()[:10]
            },
            "top_actors": list(
                AuditLog.objects
                .values('actor__email', 'actor__full_name')
                .annotate(count=models.Count('id'))
                .order_by('-count')[:5]
            )
        }
        
        return success_response(
            data=stats,
            message="Audit statistics retrieved successfully",
            code="AUDIT_STATS_RETRIEVED"
        )
        
    except Exception as e:
        logger.error(f"Error fetching audit stats: {str(e)}", exc_info=True)
        return error_response(
            message="Failed to retrieve audit statistics",
            errors=str(e) if settings.DEBUG else None,
            code="AUDIT_STATS_ERROR",
            status_code=500
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def audit_log_export(request):
    """
    Export audit logs as CSV.
    
    GET /api/v1/audit/export/
    """
    try:
        import csv
        from django.http import HttpResponse
        
        queryset = AuditLog.objects.select_related('actor').order_by('-timestamp')
        
        # Apply filters (same as list endpoint)
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(actor__email__icontains=search) |
                Q(action__icontains=search) |
                Q(target_type__icontains=search)
            )
        
        date_from = request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(timestamp__date__gte=date_from)
        
        date_to = request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(timestamp__date__lte=date_to)
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="audit_logs_{timezone.now().date()}.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Timestamp', 'Actor', 'Action', 'Target Type', 'Target ID',
            'Severity', 'Status', 'IP Address', 'Metadata'
        ])
        
        for log in queryset[:10000]:  # Limit export to 10,000 rows
            writer.writerow([
                log.timestamp,
                log.actor.email if log.actor else 'System',
                log.action,
                log.target_type,
                log.target_id,
                log.severity,
                log.status,
                log.ip_address or '',
                str(log.metadata)[:200]  # Truncate long metadata
            ])
        
        return response
        
    except Exception as e:
        logger.error(f"Error exporting audit logs: {str(e)}", exc_info=True)
        return error_response(
            message="Failed to export audit logs",
            errors=str(e) if settings.DEBUG else None,
            code="AUDIT_EXPORT_ERROR",
            status_code=500
        )