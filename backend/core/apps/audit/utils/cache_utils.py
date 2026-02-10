from django.core.cache import cache
from typing import Any
import hashlib
import json


class CacheManager:
    """
    Utility class for managing cache operations with consistent key patterns.
    """
    
    # Cache durations in seconds
    AUDIT_LOGS_CACHE_DURATION = 300  # 5 minutes
    AUDIT_DETAIL_CACHE_DURATION = 300  # 5 minutes
    
    @staticmethod
    def generate_cache_key(prefix: str, params: dict) -> str:
        """
        Generate a consistent cache key from parameters.
        
        Args:
            prefix: Cache key prefix (e.g., 'audit_logs')
            params: Dictionary of parameters to include in key
        
        Returns:
            MD5 hash string as cache key
        """
        # Sort params to ensure consistent key generation
        sorted_params = json.dumps(params, sort_keys=True)
        
        # Create MD5 hash of the sorted params
        param_hash = hashlib.md5(sorted_params.encode()).hexdigest()
        
        return f"{prefix}:{param_hash}"
    
    @staticmethod
    def get_or_set(key: str, func, duration: int) -> Any:
        """
        Get cached value or compute and cache if not exists.
        
        Args:
            key: Cache key
            func: Function to call if cache miss
            duration: Cache duration in seconds
        
        Returns:
            Cached or computed value
        """
        
        cached_value = cache.get(key)
        
        if cached_value is not None:
            return cached_value
        
        # Cache miss - compute value
        value = func()
        
        cache.set(key, value, duration)
        
        return value
    
    @staticmethod
    def invalidate_pattern(pattern: str) -> None:
        """
        Invalidate all cache keys matching a pattern.
        
        Args:
            pattern: Pattern to match (e.g., 'audit_logs:*')
        """
        cache.delete_pattern(pattern)
    
    @staticmethod
    def invalidate_audit_logs_cache() -> None:
        """
        Invalidate all audit logs related cache entries.
        """
        
        CacheManager.invalidate_pattern("audit_logs:*")
        
        CacheManager.invalidate_pattern("audit_log_detail:*")