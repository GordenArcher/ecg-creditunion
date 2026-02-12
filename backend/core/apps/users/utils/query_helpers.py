from typing import Dict, Any, Tuple
from django.db.models import Q
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from ..models import User


class UserQueryHelper:
    """Helper class for building user queries with filters and pagination."""
    
    @staticmethod
    def build_filters(params: Dict[str, Any]) -> Q:
        """
        Build Django Q objects for filtering users.
        
        Args:
            params: Dictionary of filter parameters from request
        
        Returns:
            Q object with all applied filters
        """
        filters = Q()
        
        if role := params.get('role'):
            filters &= Q(role=role)
        
        if station_id := params.get('station_id'):
            filters &= Q(station_id=station_id)
        
        if division_id := params.get('division_id'):
            filters &= Q(division_id=division_id)
        
        if is_active := params.get('is_active'):
            filters &= Q(is_active=is_active.lower() == 'true')
        
        discontinued = params.get("discontinued")
        
        if date_registered_after := params.get('date_registered_after'):
            filters &= Q(date_registered__gte=date_registered_after)
        
        if date_registered_before := params.get('date_registered_before'):
            filters &= Q(date_registered__lte=date_registered_before)
        
        if last_login_after := params.get('last_login_after'):
            filters &= Q(last_login__gte=last_login_after)
        
        if last_login_before := params.get('last_login_before'):
            filters &= Q(last_login__lte=last_login_before)
        
        if gender := params.get('gender'):
            filters &= Q(gender=gender)
        
        if marital_status := params.get('marital_status'):
            filters &= Q(marital_status=marital_status)
        
        if search := params.get('search'):
            search_filter = Q(email__icontains=search) | \
                          Q(full_name__icontains=search) | \
                          Q(staff_id__icontains=search) | \
                          Q(phone_number__icontains=search)
            filters &= search_filter
        
        if discontinued is not None:
            # if query param exists, filter based on its value
            discontinued_bool = discontinued.lower() == "true"
            filters &= Q(discontinued=discontinued_bool)
        
        # else if query param doesn't exist, we don't filter on discontinued status at all (include both) 
        
        return filters
    
    @staticmethod
    def get_paginated_users(
        queryset,
        page: int = 1,
        page_size: int = 20,
        max_page_size: int = 100
    ) -> Tuple[list, Dict[str, Any]]:
        """
        Paginate a user queryset and return results with pagination metadata.
        
        Args:
            queryset: Django queryset to paginate
            page: Page number (1-indexed)
            page_size: Number of items per page
            max_page_size: Maximum allowed page size
        
        Returns:
            Tuple of (paginated_items, pagination_metadata)
        """
        page_size = min(max(1, int(page_size)), max_page_size)
        page = max(1, int(page))
        
        paginator = Paginator(queryset, page_size)
        
        try:
            paginated_items = paginator.page(page)
        except PageNotAnInteger:
            # If page is not an integer, deliver first page
            paginated_items = paginator.page(1)
            page = 1
        except EmptyPage:
            # If page is out of range, deliver last page
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
    def get_filtered_users(
        params: Dict[str, Any],
        requesting_user=None,
        include_discontinued: bool = False
    ) -> Tuple[list, Dict[str, Any]]:
        """
        Get filtered and paginated users based on parameters.
        
        Args:
            params: Filter parameters from request
            requesting_user: The user making the request (for role-based filtering)
            include_discontinued: Whether to include discontinued users
        
        Returns:
            Tuple of (users_list, pagination_metadata)
        """
        queryset = User.objects.all().select_related('station', 'division')
        
        if requesting_user:
            if requesting_user.role == 'STAFF':
                # Staff can only see themselves
                queryset = queryset.filter(id=requesting_user.id)
            elif requesting_user.role == 'ADMIN':
                # Admin can see all except SUPER_ADMIN
                queryset = queryset.exclude(role='SUPER_ADMIN')
            # SUPER_ADMIN can see everyone (no restriction)
        
        filters = UserQueryHelper.build_filters(params)
        queryset = queryset.filter(filters)
        
        if not include_discontinued and params.get('discontinued') != 'true':
            queryset = queryset.filter(discontinued=False)
        
        ordering = params.get('ordering', '-date_joined')
        if ordering.lstrip('-') in ['email', 'full_name', 'staff_id', 'date_joined', 'last_login', 'role', 'date_registered']:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by('-date_joined') 
        
        page = int(params.get('page', 1))
        page_size = min(100, max(1, int(params.get('page_size', 20))))
        
        return UserQueryHelper.get_paginated_users(
            queryset=queryset,
            page=page,
            page_size=page_size
        )
    
    @staticmethod
    def get_admin_user_stats() -> Dict[str, Any]:
        """
        Get statistics about users for admin dashboard.
        
        Returns:
            Dictionary with user statistics
        """
        from django.db.models import Count, Q
        from django.utils import timezone
        
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        discontinued_users = User.objects.filter(discontinued=True).count()
        
        role_counts = User.objects.values('role').annotate(count=Count('id'))
        role_stats = {item['role']: item['count'] for item in role_counts}
        
        thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
        recent_registrations = User.objects.filter(
            date_registered__gte=thirty_days_ago
        ).count()
        
        seven_days_ago = timezone.now() - timezone.timedelta(days=7)
        recent_logins = User.objects.filter(
            last_login__gte=seven_days_ago,
            is_active=True
        ).count()
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "discontinued_users": discontinued_users,
            "role_distribution": role_stats,
            "recent_registrations_30d": recent_registrations,
            "recent_logins_7d": recent_logins,
            "inactive_users": total_users - active_users - discontinued_users,
        }


class StationQueryHelper:
    """Helper for station-related queries."""
    
    @staticmethod
    def get_station_users(station_id: str, active_only: bool = True) -> list:
        """
        Get all users in a specific station.
        
        Args:
            station_id: ID of the station
            active_only: Whether to include only active users
        
        Returns:
            List of users in the station
        """
        queryset = User.objects.filter(station_id=station_id)
        
        if active_only:
            queryset = queryset.filter(is_active=True, discontinued=False)
        
        return list(queryset.select_related('division'))


class DivisionQueryHelper:
    """Helper for division-related queries."""
    
    @staticmethod
    def get_division_users(division_id: str, active_only: bool = True) -> list:
        """
        Get all users in a specific division.
        
        Args:
            division_id: ID of the division
            active_only: Whether to include only active users
        
        Returns:
            List of users in the division
        """
        queryset = User.objects.filter(division_id=division_id)
        
        if active_only:
            queryset = queryset.filter(is_active=True, discontinued=False)
        
        return list(queryset.select_related('station'))