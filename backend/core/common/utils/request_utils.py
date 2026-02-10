
from typing import Optional
from django.http import HttpRequest



def get_client_ip(request: HttpRequest) -> Optional[str]:
    """
    Extract client IP address from request, handling proxies.
    
    Args:
        request: Django HTTP request object
    
    Returns:
        Client IP address string or None
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # Handle proxy chain: 'client, proxy1, proxy2'
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip