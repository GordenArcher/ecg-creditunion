from django.core.cache import cache
from django.conf import settings
from typing import Optional, Dict, Any
import hashlib
import json
from datetime import datetime


class UserCacheManager:
    """Cache manager for user-related operations."""
    
    # Cache durations in seconds
    USER_DETAIL_CACHE_DURATION = 2592000  # 30 days
    USER_LIST_CACHE_DURATION = 300        # 5 minutes
    USER_SEARCH_CACHE_DURATION = 300      # 5 minutes
    
    @staticmethod
    def _generate_cache_key(prefix: str, identifier: str) -> str:
        """Generate cache key with prefix and identifier."""
        return f"user:{prefix}:{identifier}"
    
    @staticmethod
    def get_user(user_id) -> Optional[Dict[str, Any]]:
        """Get user from cache or database."""
        cache_key = UserCacheManager._generate_cache_key("detail", str(user_id))
        
        cached_user = cache.get(cache_key)
        if cached_user:
            return cached_user
        
        from ..models import User
        try:
            user = User.objects.get(id=user_id)
            user_data = {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "staff_id": user.staff_id,
                "role": user.role,
                "is_active": user.is_active,
                "discontinued": user.discontinued,
                "station": str(user.station_id) if user.station else None,
                "division": str(user.division_id) if user.division else None,
                "phone_number": user.phone_number,
                "date_registered": user.date_registered.isoformat(),
                "last_login": user.last_login.isoformat() if user.last_login else None,
            }
            
            cache.set(cache_key, user_data, UserCacheManager.USER_DETAIL_CACHE_DURATION)
            return user_data
        except User.DoesNotExist:
            return None
    
    @staticmethod
    def cache_user(user) -> None:
        """Cache a user object."""

        def safe_iso(value):
            if isinstance(value, datetime):
                return value.isoformat()
            return value

        cache_key = UserCacheManager._generate_cache_key("detail", str(user.id))
        user_data = {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "staff_id": user.staff_id,
            "role": user.role,
            "is_active": user.is_active,
            "discontinued": user.discontinued,
            "station": str(user.station_id) if user.station else None,
            "division": str(user.division_id) if user.division else None,
            "phone_number": user.phone_number,
            "date_registered": safe_iso(user.date_registered),
            "last_login": safe_iso(user.last_login),
        }
        cache.set(cache_key, user_data, UserCacheManager.USER_DETAIL_CACHE_DURATION)
    
    @staticmethod
    def invalidate_user(user_id: str) -> None:
        """Invalidate cache for a specific user."""
        cache_key = UserCacheManager._generate_cache_key("detail", user_id)
        cache.delete(cache_key)
    
    @staticmethod
    def invalidate_all_users() -> None:
        """Invalidate all user-related cache."""
        cache.delete_pattern("user:*")
    
    @staticmethod
    def get_cached_users_list(params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Get cached user list based on parameters."""
        params_hash = hashlib.md5(json.dumps(params, sort_keys=True).encode()).hexdigest()
        cache_key = UserCacheManager._generate_cache_key("list", params_hash)
        return cache.get(cache_key)
    
    @staticmethod
    def cache_users_list(params: Dict[str, Any], data: Dict[str, Any]) -> None:
        """Cache user list data."""
        params_hash = hashlib.md5(json.dumps(params, sort_keys=True).encode()).hexdigest()
        cache_key = UserCacheManager._generate_cache_key("list", params_hash)
        cache.set(cache_key, data, UserCacheManager.USER_LIST_CACHE_DURATION)