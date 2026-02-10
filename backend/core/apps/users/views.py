
from django.conf import settings
from django.shortcuts import render
from common.responses.response import success_response, error_response
from common.utils.generate_requestID import generate_request_id
from rest_framework.decorators import api_view
import logging

from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
logger = logging.getLogger(__name__)

# Create your views here.

@api_view(["POST"])
def login_user(request):
    pass



@api_view(["POST"])
def login_admin_user(request):
    """
    Authenticate and login an admin user using JWT tokens.
    
    This endpoint handles admin authentication by validating credentials,
    generating JWT tokens upon successful authentication, and verifying
    admin privileges using rest_framework_simplejwt.
    
    Args:
        request (HttpRequest): The HTTP request object containing:
            - email (str): User's email address
            - password (str): User's password
            - confirm_password (str): Password confirmation for verification
    
    Returns:
        Response: JSON response containing either:
            - Success: User data and JWT access/refresh tokens
            - Error: Detailed error message with appropriate status code
    
    Expected Request Body:
        {
            "email": "admin@example.com",
            "password": "securepassword123",
            "confirm_password": "securepassword123"
        }
    
    Success Response:
        {
            "success": true,
            "message": "Login successful",
            "data": {
                "user": {...},
                "tokens": {
                    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                    "access_expires": "2023-10-01T13:00:00Z",
                    "refresh_expires": "2023-10-08T12:00:00Z"
                }
            },
            "code": "LOGIN_SUCCESSFUL",
            "request_id": "req_123456",
            "timestamp": "2026-01-01T12:00:00Z"
        }
    
    Status Codes:
        - 200: Login successful
        - 400: Bad request (missing/invalid parameters)
        - 401: Unauthorized (invalid credentials)
        - 403: Forbidden (user is not an admin)
        - 404: Not found (user doesn't exist)
        - 500: Internal server error
    """
    
    request_id = generate_request_id()
    
    email = request.data.get("email")
    password = request.data.get("password")
    confirm_password = request.data.get("confirm_password")
    
    # Validate that all required fields are provided
    if not email or not password or not confirm_password:
        return error_response(
            message="Email, password and confirm password are required.",
            errors={
                "email": "This field is required" if not email else None,
                "password": "This field is required" if not password else None,
                "confirm_password": "This field is required" if not confirm_password else None
            },
            status_code=status.HTTP_400_BAD_REQUEST,
            code="MISSING_REQUIRED_FIELDS",
            request_id=request_id,
            meta={
                "required_fields": ["email", "password", "confirm_password"],
                "provided_fields": {
                    "email": bool(email),
                    "password": bool(password),
                    "confirm_password": bool(confirm_password)
                }
            }
        )
    
    # Validatong email format using Django's built-in email validator
    try:
        validate_email(email)
    except ValidationError:
        return error_response(
            message="Invalid email format.",
            errors={"email": "Please provide a valid email address"},
            status_code=status.HTTP_400_BAD_REQUEST,
            code="INVALID_EMAIL_FORMAT",
            request_id=request_id,
            meta={"email_provided": email}
        )
    
    if password != confirm_password:
        return error_response(
            message="Passwords do not match.",
            errors={"confirm_password": "Password and confirmation password must match"},
            status_code=status.HTTP_400_BAD_REQUEST,
            code="PASSWORD_MISMATCH",
            request_id=request_id,
            meta={
                "password_length": len(password),
                "confirm_password_length": len(confirm_password)
            }
        )
    
    
    if len(password) < 8:
        return error_response(
            message="Password must be at least 8 characters long.",
            errors={"password": "Password must contain at least 8 characters"},
            status_code=status.HTTP_400_BAD_REQUEST,
            code="PASSWORD_TOO_SHORT",
            request_id=request_id,
            meta={"password_length": len(password)}
        )
    try:
        # Attempt to authenticate user with provided credentials
        # Using Django's authenticate method which works with custom user models
        user = authenticate(request, username=email, password=password)
        
        # If authenticate doesn't work with email, try alternative approach
        if user is None and hasattr(settings, 'AUTHENTICATION_BACKENDS'):
            # Try authenticating with email field directly if using custom backend
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            try:
                user = User.objects.get(email=email)
                if user.check_password(password):
                    # Password is correct
                    pass
                else:
                    user = None
            except User.DoesNotExist:
                user = None
        
        if user is None:
            # User authentication failed - either user doesn't exist or password is wrong
            return error_response(
                message="Invalid email or password.",
                status_code=status.HTTP_401_UNAUTHORIZED,
                code="INVALID_CREDENTIALS",
                request_id=request_id,
                meta={"email_provided": email}
            )
        
        # Check if user has admin privileges
        is_admin = False
        if hasattr(user, 'is_admin'):
            is_admin = user.is_admin
        elif hasattr(user, 'is_staff'):
            is_admin = user.is_staff
        elif hasattr(user, 'role'):
            is_admin = user.role == 'admin'
        
        if not is_admin:
            return error_response(
                message="Access denied. Admin privileges required.",
                status_code=status.HTTP_403_FORBIDDEN,
                code="INSUFFICIENT_PRIVILEGES",
                request_id=request_id,
                meta={
                    "user_id": user.id,
                    "email": user.email,
                    "is_staff": getattr(user, 'is_staff', False),
                    "is_superuser": getattr(user, 'is_superuser', False),
                    "has_admin_attr": hasattr(user, 'is_admin'),
                    "is_admin_value": getattr(user, 'is_admin', False)
                }
            )
        
        #We check if user account is active
        if not user.is_active:
            return error_response(
                message="Account is inactive. Please contact administrator.",
                status_code=status.HTTP_403_FORBIDDEN,
                code="ACCOUNT_INACTIVE",
                request_id=request_id,
                meta={
                    "user_id": user.id,
                    "email": user.email
                }
            )
        
        
        try:
            refresh = RefreshToken.for_user(user)
            
            from rest_framework_simplejwt.settings import api_settings
            access_lifetime = api_settings.ACCESS_TOKEN_LIFETIME
            refresh_lifetime = api_settings.REFRESH_TOKEN_LIFETIME
            
            access_expires = timezone.now() + access_lifetime
            refresh_expires = timezone.now() + refresh_lifetime
            
            #Added custom claims to the token 
            refresh['is_admin'] = is_admin
            refresh['email'] = user.email
            
            user_data = {
                "id": user.id,
                "email": user.email,
                "last_login": user.last_login.isoformat() if user.last_login else None,
                "date_joined": user.date_joined.isoformat() if user.date_joined else None
            }
            
            
            if hasattr(user, 'username'):
                user_data["username"] = user.username
            if hasattr(user, 'phone_number'):
                user_data["phone_number"] = user.phone_number
            
            # Return successful login response with JWT tokens
            return success_response(
                message="Login successful. Welcome back, admin!",
                data={
                    "user": user_data,
                    "tokens": {
                        "access": str(refresh.access_token),
                        "refresh": str(refresh),
                        "access_expires": access_expires.isoformat(),
                        "refresh_expires": refresh_expires.isoformat()
                    }
                },
                status_code=status.HTTP_200_OK,
                code="LOGIN_SUCCESSFUL",
                request_id=request_id,
                meta={
                    "login_timestamp": timezone.now().isoformat(),
                    "token_type": "Bearer",
                    "user_role": "admin",
                    "access_token_lifetime_seconds": access_lifetime.total_seconds(),
                    "refresh_token_lifetime_seconds": refresh_lifetime.total_seconds()
                }
            )
            
        except TokenError as e:
            
            logger.error(f"JWT token generation failed for user {user.id}: {str(e)}")
            return error_response(
                message="Token generation failed. Please try again.",
                errors=str(e) if settings.DEBUG else None,
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                code="TOKEN_GENERATION_ERROR",
                request_id=request_id,
                meta={
                    "user_id": user.id,
                    "email": user.email,
                    "error_type": "TokenError"
                }
            )
        
    except Exception as e:
        
        logger.error(f"Login error for email {email}: {str(e)}", exc_info=True)
        
        # Determine appropriate status code based on error type
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        error_code = "INTERNAL_SERVER_ERROR"
        
        if "DoesNotExist" in str(type(e).__name__):
            status_code = status.HTTP_404_NOT_FOUND
            error_code = "USER_NOT_FOUND"
        
        return error_response(
            message="An unexpected error occurred during login.",
            errors=str(e) if settings.DEBUG else None,
            status_code=status_code,
            code=error_code,
            request_id=request_id,
            meta={
                "email_provided": email,
                "error_type": type(e).__name__,
                "debug_info": str(e) if settings.DEBUG else "Disabled in production"
            }
        )
