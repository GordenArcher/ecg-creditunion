import logging
from typing import Optional, Tuple

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken, TokenError

logger = logging.getLogger(__name__)


class CookieOrHeaderJWTAuthentication(JWTAuthentication):
    """
    JWT Authentication that supports both Authorization header and HTTP-only cookies.
    
    Priority:
    1. Authorization header (Bearer token)
    2. Access token from cookie (for web frontend)
    
    This allows:
    - API clients to use Authorization: Bearer <token>
    - Web browsers to use HTTP-only cookies (more secure for web apps)
    """
    
    ACCESS_TOKEN_COOKIE_NAME = "tkn.sid"
    REFRESH_TOKEN_COOKIE_NAME = "tkn.sidcc"
    
    def authenticate(self, request) -> Optional[Tuple]:
        """
        Authenticate the request and return a user/token pair.
        
        Args:
            request: HTTP request object
            
        Returns:
            Tuple of (user, validated_token) or None if authentication fails
        """
        # First we try standard header authentication
        header_auth = self._authenticate_from_header(request)
        if header_auth:
            logger.debug("Authentication successful from Authorization header")
            return header_auth
        
        # then we Fallback to cookie authentication (This will be our main authentication method for web clients)

        cookie_auth = self._authenticate_from_cookie(request)
        if cookie_auth:
            logger.debug("Authentication successful from cookie")
            return cookie_auth
        
        return None
    
    def _authenticate_from_header(self, request) -> Optional[Tuple]:
        """
        Attempt authentication using Authorization header.
        
        Returns:
            Tuple of (user, token) if successful, None otherwise
        """
        try:
            # we use parent class's header authentication
            return super().authenticate(request)
        except (AuthenticationFailed, InvalidToken, TokenError) as e:
            # Log debug info but don't raise - we'll try cookie next
            logger.debug(f"Header authentication failed: {type(e).__name__}: {str(e)}")
            return None
        except Exception as e:
            # Log unexpected errors but continue to cookie auth
            logger.warning(f"Unexpected error in header authentication: {str(e)}")
            return None
    
    def _authenticate_from_cookie(self, request) -> Optional[Tuple]:
        """
        Attempt authentication using HTTP-only cookie.
        
        Returns:
            Tuple of (user, token) if successful, None otherwise
        """
        access_token = self._get_access_token_from_cookie(request)
        
        if not access_token:
            logger.debug("No access token found in cookies")
            return None
        
        try:
            validated_token = self.get_validated_token(access_token)
            
            user = self.get_user(validated_token)
            
            if not user.is_active:
                logger.warning(f"Authentication failed: User {user.id} is inactive")
                raise AuthenticationFailed("User is inactive", code="user_inactive")
            
            return (user, validated_token)
            
        except InvalidToken as e:
            logger.warning(f"Invalid token in cookie: {str(e)}")
            return None
        except AuthenticationFailed as e:
            logger.warning(f"Authentication failed from cookie: {str(e)}")
            return None
        except TokenError as e:
            logger.warning(f"Token error in cookie authentication: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error in cookie authentication: {str(e)}")
            return None
    
    def _get_access_token_from_cookie(self, request) -> Optional[str]:
        """
        Extract access token from cookie.
        
        Returns:
            Access token string or None if not found
        """
        # Check primary cookie name
        token = request.COOKIES.get(self.ACCESS_TOKEN_COOKIE_NAME)
        
        
        
        return token
    
    def authenticate_header(self, request):
        """
        Return a string to be used as the value of the `WWW-Authenticate`
        header in a `401 Unauthenticated` response, or `None` if the
        authentication scheme should return `403 Permission Denied` responses.
        """
        return f'Bearer realm="api", Cookie realm="api"'
    