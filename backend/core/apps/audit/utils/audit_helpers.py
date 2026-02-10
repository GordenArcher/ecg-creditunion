from typing import Dict, Any, Tuple
from django.db.models import Q
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from ..models import AuditLog


class AuditQueryHelper:
    """
    Helper class for building audit log queries with filters and pagination.
    """
    
    @staticmethod
    def build_filters(params: Dict[str, Any]) -> Q:
        """
        Build Django Q objects for filtering audit logs.
        """
        filters = Q()
        
        if actor_id := params.get('actor_id'):
            filters &= Q(actor_id=actor_id)
        
        if actor_role := params.get('actor_role'):
            filters &= Q(actor_role__icontains=actor_role)
        
        if action := params.get('action'):
            filters &= Q(action__icontains=action)
        
        if target_type := params.get('target_type'):
            filters &= Q(target_type__icontains=target_type)
        
        if target_id := params.get('target_id'):
            filters &= Q(target_id__icontains=target_id)
        
        if status := params.get('status'):
            filters &= Q(status=status)
        
        if start_date := params.get('start_date'):
            try:
                filters &= Q(timestamp__gte=start_date)
            except (ValueError, TypeError):
                pass
        
        if end_date := params.get('end_date'):
            try:
                filters &= Q(timestamp__lte=end_date)
            except (ValueError, TypeError):
                pass
        
        if search := params.get('search'):
            search_filter = Q(action__icontains=search) | \
                          Q(target_type__icontains=search) | \
                          Q(target_id__icontains=search) | \
                          Q(actor_role__icontains=search)
            filters &= search_filter
        
        return filters
    
    @staticmethod
    def get_paginated_results(
        queryset,
        page: int = 1,
        page_size: int = 20,
        max_page_size: int = 100
    ) -> Tuple[list, Dict[str, Any]]:
        """
        Paginate a queryset and return results with pagination metadata.
        """
        page_size = min(max(1, int(page_size)), max_page_size)
        page = max(1, int(page))
        
        paginator = Paginator(queryset, page_size)
        
        try:
            paginated_items = paginator.page(page)
        except PageNotAnInteger:
            paginated_items = paginator.page(1)
            page = 1
        except EmptyPage:
            paginated_items = paginator.page(paginator.num_pages)
            page = paginator.num_pages
        
        meta = {
            "total_items": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": page,
            "page_size": page_size,
            "has_next": paginated_items.has_next(),
            "has_previous": paginated_items.has_previous(),
            "next_page_number": paginated_items.next_page_number() if paginated_items.has_next() else None,
            "previous_page_number": paginated_items.previous_page_number() if paginated_items.has_previous() else None,
        }
        
        return list(paginated_items), meta
    
    @staticmethod
    def get_audit_logs_data(params: Dict[str, Any], user_id: int = None) -> Dict[str, Any]:
        """
        Get audit logs data for caching.
        
        Args:
            params: Filter parameters
            user_id: Optional user ID for user-specific caching
        
        Returns:
            Dictionary containing serialized audit logs data
        """
        queryset = AuditLog.objects.all().select_related('actor')
        
        filters = AuditQueryHelper.build_filters(params)
        queryset = queryset.filter(filters)
        
        ordering = params.get('ordering', '-timestamp')
        if ordering.lstrip('-') in ['timestamp', 'action', 'target_type', 'status']:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by('-timestamp')
        
        page = int(params.get('page', 1))
        page_size = min(100, max(1, int(params.get('page_size', 20))))
        
        items, pagination_meta = AuditQueryHelper.get_paginated_results(
            queryset=queryset,
            page=page,
            page_size=page_size
        )
        
        from ..serializers import AuditLogSerializer
        serializer = AuditLogSerializer(items, many=True)
        
        return {
            "items": serializer.data,
            "pagination": pagination_meta,
            "params": params
        }