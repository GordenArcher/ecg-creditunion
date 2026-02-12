import logging
from django.conf import settings
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.settings import api_settings
from ..utils.smart_importer import ExcelUserImporter
from common.responses.response import success_response, error_response
from common.utils.generate_requestID import generate_request_id
from common.utils.request_utils import get_client_ip
from ..serializers import UserSerializer, DivisionSerializer, StationSerializer
from apps.audit.services.audit_service import AuditService
from apps.audit.models import AuditLog
from django.db import transaction
from ..helper.tokens import get_tokens_for_user
from ..helper.cookie.set_cookies import set_auth_cookies
from ..helper.cookie.delete_auth_cookies import delete_auth_cookies
from ..models import User, Station, Division, UserAccountMeta
from ..utils.user_cache import UserCacheManager
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
logger = logging.getLogger(__name__)





@api_view(["POST"])
@permission_classes([AllowAny])
def login_user(request):
    """
    Authenticate and login a user.
    
    Supports both admin and staff users.
    Sets JWT tokens in HTTP-only cookies for web clients.
    
    Expected Request Body:
        {
            "email": "user@example.com",
            "password": "password123"
        }
    
    Returns:
        Success: User data
        Error: Appropriate error message
    """
    request_id = generate_request_id()
    
    email = request.data.get("email")
    password = request.data.get("password")
    
    
    if not email or not password:
        return error_response(
            message="Email and password are required.",
            status_code=status.HTTP_400_BAD_REQUEST,
            code="MISSING_CREDENTIALS",
            request_id=request_id,
        )
    
    try:
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            AuditService.log(
                action="LOGIN_FAILED",
                target_type="User",
                severity=AuditLog.Severity.CRITICAL,
                status=AuditLog.Status.FAILED,
                ip_address=get_client_ip(request),
                device_info=request.META.get('HTTP_USER_AGENT', ''),
                metadata={
                    "email_tried": email,
                    "reason": "user_not_found"
                }
            )
            return error_response(
                message="Invalid email or password.",
                status_code=status.HTTP_401_UNAUTHORIZED,
                code="INVALID_CREDENTIALS",
                request_id=request_id,
            )

        if not user.password:
            return error_response(
                message="This account has no password set. Please reset your password.",
                status_code=status.HTTP_403_FORBIDDEN,
                code="NO_PASSWORD_SET",
                request_id=request_id,
            )

        if not user.check_password(password):
            AuditService.log(
                action="LOGIN_FAILED",
                target_type="User",
                severity=AuditLog.Severity.CRITICAL,
                status=AuditLog.Status.FAILED,
                ip_address=get_client_ip(request),
                device_info=request.META.get('HTTP_USER_AGENT', ''),
                metadata={
                    "email_tried": email,
                    "reason": "invalid_password"
                }
            )
            return error_response(
                message="Invalid email or password.",
                status_code=status.HTTP_401_UNAUTHORIZED,
                code="INVALID_CREDENTIALS",
                request_id=request_id,
            )

        if not user.is_active:
            AuditService.log(
                actor=user,
                action="LOGIN_ATTEMPT_INACTIVE",
                target_type="User",
                target_id=str(user.id),
                severity=AuditLog.Severity.HIGH,
                status=AuditLog.Status.FAILED,
                ip_address=get_client_ip(request),
                metadata={"reason": "account_inactive"}
            )
            
            return error_response(
                message="Account is inactive. Please contact administrator.",
                status_code=status.HTTP_403_FORBIDDEN,
                code="ACCOUNT_INACTIVE",
                request_id=request_id,
            )
        
        if user.discontinued:
            AuditService.log(
                actor=user,
                action="LOGIN_ATTEMPT_DISCONTINUED",
                target_type="User",
                target_id=str(user.id),
                severity=AuditLog.Severity.HIGH,
                status=AuditLog.Status.FAILED,
                ip_address=get_client_ip(request),
                metadata={"reason": "account_discontinued"}
            )
            
            return error_response(
                message="Account has been discontinued. Please contact support for assistance.",
                errors={"next_steps": ["Contact support to reactivate or resolve account issues."]},
                status_code=status.HTTP_403_FORBIDDEN,
                code="ACCOUNT_DISCONTINUED",
                request_id=request_id,
            )
        
        tokens = get_tokens_for_user(user)
        
        response = success_response(
            message="Login successful.",
            data={"is_authenticated": True},
            status_code=status.HTTP_200_OK,
            code="LOGIN_SUCCESSFUL",
            request_id=request_id,
            meta={
                "login_timestamp": timezone.now().isoformat(),
                "user_role": user.role,
                "next_steps": [
                    "Review pending user approvals",
                    "Check system audit logs", 
                    "Monitor credit union performance",
                    "Review loan applications",
                ]
            }
        )
        
        AuditService.log(
            actor=user,
            action="LOGIN_SUCCESS",
            target_type="User",
            target_id=str(user.id),
            severity=AuditLog.Severity.MEDIUM,
            status=AuditLog.Status.SUCCESS,
            ip_address=get_client_ip(request),
            device_info=request.META.get('HTTP_USER_AGENT', ''),
            metadata={
                "login_method": "staff_id_password",
            }
        )
        
        return set_auth_cookies(response, user, tokens, request)
        
    except Exception as e:
        logger.error(f"Login error for email {email}: {str(e)}", exc_info=True)
        return error_response(
            message="An unexpected error occurred during login.",
            errors=str(e) if settings.DEBUG else {"detail": "An unexpected error occurred."},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
            request_id=request_id,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_user(request):
    """
    Logout the current user.
    
    Invalidates the refresh token and clears authentication cookies.
    
    Returns:
        Success message
    """
    request_id = generate_request_id()

    refresh_token = request.COOKIES.get("tkn.sidcc")

    try:

        if refresh_token:
            try:
                
                token = RefreshToken(refresh_token)
                token.blacklist()
            except (TokenError, AttributeError) as e:
                
                logger.debug(f"Token blacklist error: {str(e)}")
        
        
        response = success_response(
            message="Logged out successfully.",
            data={"is_authenticated": False},
            status_code=status.HTTP_200_OK,
            code="LOGOUT_SUCCESSFUL",
            request_id=request_id,
        )
        
        AuditService.log(
            actor=request.user,
            action="LOGOUT",
            target_type="User",
            target_id=str(request.user.id),
            severity=AuditLog.Severity.MEDIUM,
            status=AuditLog.Status.SUCCESS,
            ip_address=get_client_ip(request),
            metadata={"logout_method": "manual"}
        )
        
        return delete_auth_cookies(response)
        
        return 
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}", exc_info=True)
        return error_response(
            message="An error occurred during logout.",
            errors=str(e) if settings.DEBUG else {"detail": "An unexpected error occurred."},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
            request_id=request_id,
        )


@api_view(["POST"])
def refresh_token(request):
    """
    Refresh access token using refresh token.
    
    Accepts refresh token in request body or cookie.
    
    Expected Request Body (optional if using cookies):
        {
            "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
        }
    
    Returns:
        New access token
    """
    request_id = generate_request_id()
    
    try:
        if not refresh_token:
            return error_response(
                message="Refresh token is required.",
                status_code=status.HTTP_400_BAD_REQUEST,
                code="MISSING_REFRESH_TOKEN",
                request_id=request_id,
            )
        
        # Create new access token from refresh token
        refresh = RefreshToken(refresh_token)
        
        # Get user from token
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            user_id = refresh.get('user_id')
            user = User.objects.get(id=user_id)
        except (User.DoesNotExist, KeyError):
            return error_response(
                message="Invalid refresh token.",
                status_code=status.HTTP_401_UNAUTHORIZED,
                code="INVALID_REFRESH_TOKEN",
                request_id=request_id,
            )
        
        # Check if user is active
        if not user.is_active or user.discontinued:
            return error_response(
                message="Account is inactive or discontinued.",
                status_code=status.HTTP_403_FORBIDDEN,
                code="ACCOUNT_INACTIVE",
                request_id=request_id,
            )
        
        # Generate new access token
        new_access_token = str(refresh.access_token)
        
        # Get token expiration
        access_lifetime = api_settings.ACCESS_TOKEN_LIFETIME
        
        # Create response
        response_data = {
            "access": new_access_token,
            "access_expires": (timezone.now() + access_lifetime).isoformat(),
        }
        
        response = success_response(
            message="Token refreshed successfully.",
            data=response_data,
            status_code=status.HTTP_200_OK,
            code="TOKEN_REFRESHED",
            request_id=request_id,
        )
        
        
        # Log token refresh (LOW severity)
        AuditService.log(
            actor=user,
            action="TOKEN_REFRESH",
            target_type="User",
            target_id=str(user.id),
            severity=AuditLog.Severity.LOW,
            status=AuditLog.Status.SUCCESS,
            ip_address=get_client_ip(request),
            metadata={"token_type": "access_token"}
        )
        
        return response
        
    except TokenError as e:
        logger.warning(f"Token refresh error: {str(e)}")
        return error_response(
            message="Invalid or expired refresh token.",
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="INVALID_REFRESH_TOKEN",
            request_id=request_id,
        )
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}", exc_info=True)
        return error_response(
            message="An error occurred while refreshing token.",
            errors=str(e) if settings.DEBUG else {"detail": "An unexpected error occurred."},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
            request_id=request_id,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def check_auth(request):
    """
    Check if user is authenticated and return user info.
    
    Useful for frontend to check authentication status.
    
    Returns:
        Current user data if authenticated
    """
    request_id = generate_request_id()
    
    try:
        
        return success_response(
            message="User is authenticated.",
            data={"is_authenticated": True,},
            status_code=status.HTTP_200_OK,
            code="AUTHENTICATED",
            request_id=request_id,
        )
        
    except Exception as e:
        logger.error(f"Auth check error: {str(e)}", exc_info=True)
        return error_response(
            message="Authentication check failed.",
            errors=str(e) if settings.DEBUG else {"detail": "An unexpected error occurred."},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
            request_id=request_id,
        )



@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
# @permission_classes([AllowAny])  # Temporarily allow any for testing - change to IsAuthenticated, IsAdminUser in production 
def import_users_excel(request):
    """
    Import users from ECG Excel file.
    
    Required Excel headers (exact as shown):
    - Emp ID (optional)
    - Name (required)
    - Title (optional)
    - Sex (optional)
    - Staff # (required) - becomes staff_id
    - DOB (optional)
    - Station (optional)
    - PB # (optional)
    - Directorate (optional)
    - Division (optional)
    - Tel (optional)
    - Email (optional) - but must be unique
    - Marital Status (optional)
    - # of Dependents (optional)
    - Date of Registration (optional)
    - Discontinue (optional)
    
    Notes:
    1. Email is optional and must be unique if provided
    2. Staff # must be provided and must be unique (becomes staff_id)
    3. Name must be provided (becomes full_name)
    4. Password is auto-generated as {Staff #}@ECG2024
    5. All imported users get 'STAFF' role by default
    6. Stations and divisions are created automatically if they don't exist
    7. If duplicate email or staff # found, row is skipped
    
    Returns:
        Summary of import with detailed success/failure information
    """
    request_id = generate_request_id()
    
    if 'excel_file' not in request.FILES:
        return error_response(
            message="Please upload an Excel file.",
            status_code=status.HTTP_400_BAD_REQUEST,
            code="NO_FILE",
            request_id=request_id,
        )
    
    excel_file = request.FILES['excel_file']
    
    if not excel_file.name.endswith(('.xlsx', '.xls')):
        return error_response(
            message="Only Excel files (.xlsx, .xls) are allowed.",
            status_code=status.HTTP_400_BAD_REQUEST,
            code="INVALID_FILE_TYPE",
            request_id=request_id,
        )
    
    if excel_file.size > 5 * 1024 * 1024:
        return error_response(
            message="File size must be less than 5MB.",
            status_code=status.HTTP_400_BAD_REQUEST,
            code="FILE_TOO_LARGE",
            request_id=request_id,
        )
    
    try:
        result = ExcelUserImporter.import_users(excel_file, request.user)
        
        UserCacheManager.invalidate_all_users()
        
        
        total_successful = len(result.get('successful', []))
        total_failed = len(result.get('failed', []))
        total_skipped = len(result.get('skipped', []))
        total_processed = total_successful + total_failed + total_skipped
        
        AuditService.log(
            actor=request.user,
            action="EXCEL_USER_IMPORT",
            target_type="System",
            severity=AuditLog.Severity.HIGH,
            status=AuditLog.Status.SUCCESS,
            ip_address=get_client_ip(request),
            metadata={
                "filename": excel_file.name,
                "total_rows": total_processed,
                "users_created": total_successful,
                "rows_failed": total_failed,
                "rows_skipped": total_skipped,
                "stations_created": len(result.get('summary', {}).get('stations_created', [])),
                "divisions_created": len(result.get('summary', {}).get('divisions_created', [])),
                "imported_by": request.user.staff_id,
                "success_rate": result.get('summary', {}).get('success_rate', '0%'),
            }
        )
        
        response_data = {
            "import_summary": {
                "total_rows": result.get('summary', {}).get('total_rows', 0),
                "total_processed": total_processed,
                "users_created": total_successful,
                "rows_failed": total_failed,
                "rows_skipped": total_skipped,
                "stations_created": len(result.get('summary', {}).get('stations_created', [])),
                "divisions_created": len(result.get('summary', {}).get('divisions_created', [])),
                "success_rate": result.get('summary', {}).get('success_rate', '0%'),
                "imported_by": request.user.email,
                "timestamp": result.get('summary', {}).get('timestamp', timezone.now().isoformat()),
            },
            "created_stations": result.get('summary', {}).get('stations_created', []),
            "created_divisions": result.get('summary', {}).get('divisions_created', []),
            "successful_imports": result.get('successful', []),
            "failed_imports": result.get('failed', []),
            "skipped_imports": result.get('skipped', []),
            "warnings": result.get('warnings', []),
        }
        
        
        if total_successful == 0 and total_failed > 0:
            message = "Import failed. All rows had errors."
        elif total_successful == 0 and total_skipped > 0:
            message = "No new users imported. All rows were skipped (duplicates)."
        elif total_successful > 0:
            message = f"Import completed successfully. {total_successful} user(s) created."
            if total_failed > 0:
                message += f" {total_failed} row(s) failed."
            if total_skipped > 0:
                message += f" {total_skipped} row(s) skipped (duplicates)."
        else:
            message = "No data to import."
        
        return success_response(
            message=message,
            data=response_data,
            status_code=status.HTTP_201_CREATED,
            code="USERS_IMPORTED",
            request_id=request_id,
            meta={
                "filename": excel_file.name,
                "imported_by": request.user.staff_id,
                "timestamp": timezone.now().isoformat(),
                "successful": total_successful,
                "failed": total_failed,
                "skipped": total_skipped,
            }
        )
        
    except ValueError as e:
        logger.warning(f"Excel validation error: {str(e)}")
        return error_response(
            message=str(e),
            status_code=status.HTTP_400_BAD_REQUEST,
            code="VALIDATION_ERROR",
            request_id=request_id,
        )
        
    except Exception as e:
        logger.error(f"Error importing users: {str(e)}", exc_info=True)
        
        AuditService.log(
            actor=request.user,
            action="EXCEL_IMPORT_FAILED",
            target_type="System",
            severity=AuditLog.Severity.HIGH,
            status=AuditLog.Status.FAILED,
            ip_address=get_client_ip(request),
            metadata={
                "filename": excel_file.name,
                "error": str(e),
                "imported_by": request.user.staff_id,
            }
        )
        
        return error_response(
            message="An error occurred while importing users.",
            errors=str(e) if settings.DEBUG else {"detail": "An unexpected error occurred."},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="IMPORT_ERROR",
            request_id=request_id,
        )
    

@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_import_template_info(request):
    """
    Get information about Excel import template.
    
    Returns:
        Information about required columns and format
    """
    request_id = generate_request_id()
    
    template_info = {
        "required_columns": [
            "full_name",
            "staff_id", 
            "email"
        ],
        "optional_columns": [
            "title",
            "sex (or gender)",
            "date_of_birth (or DOB)",
            "station",
            "directorate", 
            "division",
            "tel (or phone_number)",
            "marital_status",
            "number_of_dependents",
            "date_registered (or date registration)",
            "discontinued (or discontinue)"
        ],
        "column_descriptions": {
            "full_name": "Full name of the staff member",
            "staff_id": "Unique staff identification number",
            "email": "Email address (must be unique)",
            "title": "Job title or position",
            "sex": "MALE, FEMALE, or OTHER (can also use M/F)",
            "date_of_birth": "Birth date (YYYY-MM-DD or DD/MM/YYYY)",
            "station": "Station/office name (will be created if new)",
            "directorate": "Directorate name",
            "division": "Division/unit name (will be created if new)",
            "tel": "Phone number (with country code)",
            "marital_status": "SINGLE, MARRIED, DIVORCED, WIDOWED, or SEPARATED",
            "number_of_dependents": "Number of dependents (0 if none)",
            "date_registered": "Registration date (defaults to today if empty)",
            "discontinued": "0 = Active, 1 = Discontinued (or use TRUE/FALSE)",
        },
        "notes": [
            "Column names are case-insensitive",
            "Spaces and underscores are treated the same",
            "All imported users get 'STAFF' role automatically",
            "New stations and divisions are created automatically",
            "Passwords are generated from staff_id (@ECG2024 suffix)",
        ]
    }
    
    return success_response(
        message="Import template information",
        data=template_info,
        status_code=status.HTTP_200_OK,
        code="TEMPLATE_INFO",
        request_id=request_id,
    )



@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def create_staff_manual(request):
    """
    Manually create a STAFF user (admin action only).
    
    All users created through this endpoint get 'STAFF' role.
    Only ADMIN and SUPER_ADMIN can create staff.
    
    Required Fields:
    - email
    - password
    - confirm_password
    - full_name
    - staff_id
    
    Optional Fields:
    - title, gender, date_of_birth, station_id, division_id,
      directorate, phone_number, marital_status, number_of_dependents
    
    Note: Cannot set role - all users default to STAFF.
    
    Returns:
        Created staff user data
    """
    request_id = generate_request_id()
    
    try:
        with transaction.atomic():
           
            data = request.data.copy()
            
            # Required fields
            required_fields = ['email', 'password', 'confirm_password', 'full_name', 'staff_id']
            missing_fields = [field for field in required_fields if not data.get(field)]
            
            if missing_fields:
                return error_response(
                    message=f"Missing required fields: {', '.join(missing_fields)}",
                    status_code=status.HTTP_400_BAD_REQUEST,
                    code="MISSING_REQUIRED_FIELDS",
                    request_id=request_id,
                )
            
            if User.objects.filter(email=data['email']).exists():
                return error_response(
                    message="A user with this email already exists.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                    code="EMAIL_EXISTS",
                    request_id=request_id,
                )
            
            
            if User.objects.filter(staff_id=data['staff_id']).exists():
                return error_response(
                    message="A user with this staff ID already exists.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                    code="STAFF_ID_EXISTS",
                    request_id=request_id,
                )
            
            password = data['password']
            confirm_password = data['confirm_password']
            
            if password != confirm_password:
                return error_response(
                    message="Passwords do not match.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                    code="PASSWORDS_MISMATCH",
                    request_id=request_id,
                )
            
            if len(password) < 8:
                return error_response(
                    message="Password must be at least 8 characters long.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                    code="PASSWORD_TOO_SHORT",
                    request_id=request_id,
                )
            
            user_data = {
                'email': data['email'],
                'full_name': data['full_name'],
                'staff_id': data['staff_id'],
                'role': 'STAFF',  # ALWAYS STAFF for this endpoint, we can decide to remove it and allow themodel to set it as a default
                'title': data.get('title', ''),
                'gender': data.get('gender', 'OTHER'),
                'date_of_birth': data.get('date_of_birth'),
                'phone_number': data.get('phone_number', ''),
                'marital_status': data.get('marital_status', 'SINGLE'),
                'number_of_dependents': int(data.get('number_of_dependents', 0)),
                'directorate': data.get('directorate', ''),
            }
            
            if station_id := data.get('station'):
                try:
                    station = Station.objects.get(id=station_id)
                    user_data['station'] = station
                except Station.DoesNotExist:
                    return error_response(
                        message=f"Station with ID {station_id} not found.",
                        status_code=status.HTTP_400_BAD_REQUEST,
                        code="STATION_NOT_FOUND",
                        request_id=request_id,
                    )
            
            if division_id := data.get('division'):
                try:
                    division = Division.objects.get(id=division_id)
                    user_data['division'] = division
                except Division.DoesNotExist:
                    return error_response(
                        message=f"Division with ID {division_id} not found.",
                        status_code=status.HTTP_400_BAD_REQUEST,
                        code="DIVISION_NOT_FOUND",
                        request_id=request_id,
                    )
            
            user_data = {k: v for k, v in user_data.items() if v is not None}
            
            user = User(**user_data)
            user.set_password(password)
            user.save()
            
            # Create account metadata
            UserAccountMeta.objects.create(user=user)
            
            UserCacheManager.cache_user(user)
            UserCacheManager.invalidate_all_users()
            
            AuditService.log(
                actor=request.user,
                action="STAFF_CREATE_MANUAL",
                target_type="User",
                target_id=str(user.id),
                severity=AuditLog.Severity.HIGH,
                status=AuditLog.Status.SUCCESS,
                ip_address=get_client_ip(request),
                metadata={
                    "created_by": request.user.email,
                    "created_by_role": request.user.role,
                    "staff_email": user.email,
                    "staff_id": user.staff_id,
                    "method": "manual_staff_creation",
                }
            )
            
            serializer = UserSerializer(user)
            
            return success_response(
                message=f"Staff user '{user.full_name}' created successfully.",
                data=serializer.data,
                status_code=status.HTTP_201_CREATED,
                code="STAFF_CREATED",
                request_id=request_id,
                meta={
                    "created_by": request.user.email,
                    "user_role": user.role,
                    "timestamp": user.date_joined.isoformat(),
                    "method": "manual_staff",
                }
            )
            
    except Exception as e:
        logger.error(f"Error creating staff user: {str(e)}", exc_info=True)
        
        # Log failed creation
        AuditService.log(
            actor=request.user,
            action="STAFF_CREATE_FAILED",
            target_type="User",
            severity=AuditLog.Severity.HIGH,
            status=AuditLog.Status.FAILED,
            ip_address=get_client_ip(request),
            metadata={
                "created_by": request.user.email,
                "error": str(e),
                "method": "manual_staff_creation",
                "attempted_data": {
                    "email": request.data.get('email'),
                    "staff_id": request.data.get('staff_id'),
                }
            }
        )
        
        return error_response(
            message="An error occurred while creating staff user.",
            errors=str(e) if settings.DEBUG else {"detail": "An unexpected error occurred."},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
            request_id=request_id,
        )

# @api_view(["POST"])
# @permission_classes([IsAuthenticated])
# def create_admin_user(request):
#     """
#     Create an ADMIN user (super_admin action only).
    
#     Only SUPER_ADMIN can create ADMIN users.
#     This is separate from staff creation.
    
#     Required Fields:
#     - email
#     - password
#     - confirm_password
#     - full_name
#     - staff_id
    
#     Optional Fields:
#     - phone_number
    
#     Admin users have minimal personal information.
#     They get 'ADMIN' role (not SUPER_ADMIN).
    
#     Returns:
#         Created admin user data
#     """
#     request_id = generate_request_id()
    
#     # Only SUPER_ADMIN can create admin users
#     if request.user.role != 'SUPER_ADMIN':
#         AuditService.log(
#             actor=request.user,
#             action="ADMIN_CREATE_UNAUTHORIZED",
#             target_type="User",
#             severity=AuditLog.Severity.CRITICAL,
#             status=AuditLog.Status.FAILED,
#             ip_address=get_client_ip(request),
#             metadata={
#                 "attempted_by": request.user.email,
#                 "attempted_role": request.user.role
#             }
#         )
        
#         return error_response(
#             message="Only SUPER_ADMIN can create admin users.",
#             status_code=status.HTTP_403_FORBIDDEN,
#             code="INSUFFICIENT_PRIVILEGES",
#             request_id=request_id,
#         )
    
#     try:
#         with transaction.atomic():
#             # Extract data
#             data = request.data.copy()
            
#             # Required fields for admin
#             required_fields = ['email', 'password', 'confirm_password', 'full_name', 'staff_id']
#             missing_fields = [field for field in required_fields if not data.get(field)]
            
#             if missing_fields:
#                 return error_response(
#                     message=f"Missing required fields: {', '.join(missing_fields)}",
#                     status_code=status.HTTP_400_BAD_REQUEST,
#                     code="MISSING_REQUIRED_FIELDS",
#                     request_id=request_id,
#                 )
            
#             # Check if email exists
#             if User.objects.filter(email=data['email']).exists():
#                 return error_response(
#                     message="A user with this email already exists.",
#                     status_code=status.HTTP_400_BAD_REQUEST,
#                     code="EMAIL_EXISTS",
#                     request_id=request_id,
#                 )
            
#             # Check if staff_id exists
#             if User.objects.filter(staff_id=data['staff_id']).exists():
#                 return error_response(
#                     message="A user with this staff ID already exists.",
#                     status_code=status.HTTP_400_BAD_REQUEST,
#                     code="STAFF_ID_EXISTS",
#                     request_id=request_id,
#                 )
            
#             # Password validation
#             password = data['password']
#             confirm_password = data['confirm_password']
            
#             if password != confirm_password:
#                 return error_response(
#                     message="Passwords do not match.",
#                     status_code=status.HTTP_400_BAD_REQUEST,
#                     code="PASSWORDS_MISMATCH",
#                     request_id=request_id,
#                 )
            
#             if len(password) < 8:
#                 return error_response(
#                     message="Password must be at least 8 characters long.",
#                     status_code=status.HTTP_400_BAD_REQUEST,
#                     code="PASSWORD_TOO_SHORT",
#                     request_id=request_id,
#                 )
            
#             # Prepare admin user data
#             user_data = {
#                 'email': data['email'],
#                 'full_name': data['full_name'],
#                 'staff_id': data['staff_id'],
#                 'role': 'ADMIN',  # Admin role (not staff)
#                 'phone_number': data.get('phone_number', ''),
#             }
            
#             # Remove None values
#             user_data = {k: v for k, v in user_data.items() if v is not None}
            
#             # Create admin user
#             user = User(**user_data)
#             user.set_password(password)
#             user.save()
            
#             # Create account metadata
#             UserAccountMeta.objects.create(user=user)
            
#             # Cache the new admin user
#             UserCacheManager.cache_user(user)
#             UserCacheManager.invalidate_all_users()
            
#             # Log the creation (CRITICAL severity for admin creation)
#             AuditService.log(
#                 actor=request.user,
#                 action="ADMIN_CREATE",
#                 target_type="User",
#                 target_id=str(user.id),
#                 severity=AuditLog.Severity.CRITICAL,
#                 status=AuditLog.Status.SUCCESS,
#                 ip_address=get_client_ip(request),
#                 metadata={
#                     "created_by": request.user.email,
#                     "admin_email": user.email,
#                     "admin_staff_id": user.staff_id,
#                     "method": "manual_admin_creation",
#                 }
#             )
            
#             # Serialize response
#             serializer = UserSerializer(user)
            
#             return success_response(
#                 message=f"Admin user '{user.full_name}' created successfully.",
#                 data=serializer.data,
#                 status_code=status.HTTP_201_CREATED,
#                 code="ADMIN_CREATED",
#                 request_id=request_id,
#                 meta={
#                     "created_by": request.user.email,
#                     "created_by_role": "SUPER_ADMIN",
#                     "user_role": user.role,
#                     "timestamp": user.date_joined.isoformat(),
#                     "method": "manual_admin",
#                 }
#             )
            
#     except Exception as e:
#         logger.error(f"Error creating admin user: {str(e)}", exc_info=True)
        
#         # Log failed admin creation
#         AuditService.log(
#             actor=request.user,
#             action="ADMIN_CREATE_FAILED",
#             target_type="User",
#             severity=AuditLog.Severity.CRITICAL,
#             status=AuditLog.Status.FAILED,
#             ip_address=get_client_ip(request),
#             metadata={
#                 "created_by": request.user.email,
#                 "error": str(e),
#                 "method": "manual_admin_creation",
#                 "attempted_data": {
#                     "email": request.data.get('email'),
#                     "staff_id": request.data.get('staff_id'),
#                 }
#             }
#         )
        
#         return error_response(
#             message="An error occurred while creating admin user.",
#             errors=str(e) if settings.DEBUG else {"detail": "An unexpected error occurred."},
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             code="INTERNAL_SERVER_ERROR",
#             request_id=request_id,
#         )
    




class CustomPageNumberPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"

    def get_paginated_response(self, data):
        return success_response(
            data={
                "count": self.page.paginator.count,
                "page": self.page.number if self.page else 1,
                "page_size": self.page.paginator.per_page if self.page else len(data),
                "total_pages": self.page.paginator.num_pages if self.page else 1,
                "results": data,
            },
            status_code=200
        )

from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db.models import Q

class DivisionViewSet(ModelViewSet):
    queryset = Division.objects.order_by("code")
    serializer_class = DivisionSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    pagination_class = CustomPageNumberPagination
    lookup_field = "id"

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(code__icontains=search) |
                Q(name__icontains=search) |
                Q(directorate__icontains=search)
            )
        return queryset

    def create(self, request, *args, **kwargs):
        try:
            data = request.data
            required_fields = ["code", "name"]
            for field in required_fields:
                if not data.get(field):
                    return error_response(
                        message=f"{field} is required.",
                        status_code=400,
                        code="MISSING_FIELD"
                    )

            code = data["code"].strip()
            if Division.objects.filter(code__iexact=code, is_active=True).exists():
                return error_response(
                    message=f"A division with code '{code}' already exists.",
                    status_code=400,
                    code="DUPLICATE_CODE"
                )

            division = Division.objects.create(
                code=code,
                name=data["name"].strip(),
                description=data.get("description", "").strip(),
                directorate=data.get("directorate"),
                is_active=data.get("is_active", True),
            )

            UserCacheManager.invalidate_all_users()

            return success_response(
                message="Division created successfully.",
                data=DivisionSerializer(division).data,
                status_code=201,
                code="DIVISION_CREATED"
            )

        except Exception as e:
            logger.error("Error creating division", exc_info=True)
            return error_response(
                message="An error occurred while creating division.",
                errors=str(e) if settings.DEBUG else None,
                status_code=500,
                code="INTERNAL_SERVER_ERROR"
            )

    def update(self, request, *args, **kwargs):
        try:
            division = self.get_object()
            data = request.data
            for field in ["code", "name", "description", "directorate"]:
                if field in data:
                    setattr(division, field, data[field])
            if "is_active" in data:
                division.is_active = bool(data["is_active"])
            division.save()
            UserCacheManager.invalidate_all_users()
            return success_response(
                message="Division updated successfully.",
                data=DivisionSerializer(division).data,
                status_code=200,
                code="DIVISION_UPDATED"
            )
        except Exception as e:
            logger.error("Error updating division", exc_info=True)
            return error_response(
                message="An error occurred while updating division.",
                errors=str(e) if settings.DEBUG else None,
                status_code=500,
                code="INTERNAL_SERVER_ERROR"
            )
        
    def destroy(self, request, *args, **kwargs):
        """Delete a division (admin only)."""
        try:
            division = self.get_object()
            division.delete()
            UserCacheManager.invalidate_all_users()
            return success_response(
                message="Division deleted successfully.",
                status_code=200,
                code="DIVISION_DELETED"
            )
        except Exception as e:
            logger.error("Error deleting division", exc_info=True)
            return error_response(
                message="An error occurred while deleting division.",
                errors=str(e) if settings.DEBUG else None,
                status_code=500,
                code="INTERNAL_SERVER_ERROR"
            )



class StationViewSet(ModelViewSet):
    queryset = Station.objects.order_by("code")
    serializer_class = StationSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    pagination_class = CustomPageNumberPagination
    lookup_field = "id"

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(code__icontains=search) |
                Q(name__icontains=search) |
                Q(location__icontains=search)
            )
        return queryset

    def create(self, request, *args, **kwargs):
        try:
            data = request.data
            required_fields = ["code", "name", "location"]
            for field in required_fields:
                if not data.get(field):
                    return error_response(
                        message=f"{field} is required.",
                        status_code=400,
                        code="MISSING_FIELD"
                    )

            code = data["code"].strip()

            # Check for duplicate station code
            if Station.objects.filter(code__iexact=code, is_active=True).exists():
                return error_response(
                    message=f"A station with code '{code}' already exists.",
                    status_code=400,
                    code="DUPLICATE_CODE"
                )

            # Normalize + validate email if provided
            email = None
            if data.get("email"):
                email = data["email"].strip().lower()
                try:
                    validate_email(email)
                except ValidationError:
                    return error_response(
                        message="Enter a valid email address.",
                        errors={"email": "Invalid email format."},
                        status_code=400,
                        code="INVALID_EMAIL"
                    )

            station = Station.objects.create(
                code=code,
                name=data["name"].strip(),
                location=data["location"].strip(),
                phone=data.get("phone"),
                email=email,
                is_active=data.get("is_active", True),
            )

            UserCacheManager.invalidate_all_users()

            return success_response(
                message="Station created successfully.",
                data=StationSerializer(station).data,
                status_code=201,
                code="STATION_CREATED"
            )

        except Exception as e:
            logger.error("Error creating station", exc_info=True)
            return error_response(
                message="An error occurred while creating station.",
                errors=str(e) if settings.DEBUG else None,
                status_code=500,
                code="INTERNAL_SERVER_ERROR"
            )


    def update(self, request, *args, **kwargs):
        try:
            station = self.get_object()
            data = request.data

            
            if "email" in data and data["email"]:
                email = data["email"].strip().lower()
                try:
                    validate_email(email)
                except ValidationError:
                    return error_response(
                        message="Enter a valid email address.",
                        errors={"email": "Invalid email format."},
                        status_code=400,
                        code="INVALID_EMAIL"
                    )
                data["email"] = email

            for field in ["code", "name", "location", "phone", "email"]:
                if field in data:
                    setattr(station, field, data[field])

            if "is_active" in data:
                value = data["is_active"]
                if isinstance(value, str):
                    station.is_active = value.lower() in ["true", "1", "yes"]
                else:
                    station.is_active = bool(value)

            station.save()
            UserCacheManager.invalidate_all_users()

            return success_response(
                message="Station updated successfully.",
                data=StationSerializer(station).data,
                status_code=200,
                code="STATION_UPDATED"
            )

        except Exception as e:
            logger.error("Error updating station", exc_info=True)
            return error_response(
                message="An error occurred while updating station.",
                errors=str(e) if settings.DEBUG else None,
                status_code=500,
                code="INTERNAL_SERVER_ERROR"
            )

    def destroy(self, request, *args, **kwargs):
        """Delete a station (admin only)."""
        try:
            station = self.get_object()
            station.delete()
            UserCacheManager.invalidate_all_users()
            return success_response(
                message="Station deleted successfully.",
                status_code=200,
                code="STATION_DELETED"
            )
        except Exception as e:
            logger.error("Error deleting station", exc_info=True)
            return error_response(
                message="An error occurred while deleting station.",
                errors=str(e) if settings.DEBUG else None,
                status_code=500,
                code="INTERNAL_SERVER_ERROR"
            )



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_stations(request):
    """Get all active stations for dropdowns (no pagination)."""
    stations = Station.objects.filter(is_active=True).order_by('code')
    serializer = StationSerializer(stations, many=True)
    return success_response(
        data=serializer.data,
        status_code=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_divisions(request):
    """Get all active divisions for dropdowns (no pagination)."""
    divisions = Division.objects.filter(is_active=True).order_by('code')
    serializer = DivisionSerializer(divisions, many=True)
    return success_response(
        data=serializer.data,
        status_code=status.HTTP_200_OK
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_single_division(request, division_id):
    """Get single division details by ID."""
    try:
        division = Division.objects.get(id=division_id)
        serializer = DivisionSerializer(division)
        return success_response(
            message="Division retrieved successfully.",
            data=serializer.data,
            status_code=status.HTTP_200_OK,
            code="DIVISION_RETRIEVED",
        )
    except Division.DoesNotExist:
        return error_response(
            message="Division not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            code="DIVISION_NOT_FOUND",
        )
    except Exception as e:
        logger.error(f"Error retrieving division: {str(e)}", exc_info=True)
        return error_response(
            message="An error occurred while retrieving division.",
            errors=str(e) if settings.DEBUG else {"detail": "An unexpected error occurred."},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
        )
    

@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_single_station(request, station_id):
    """Get single station details by ID."""
    try:
        station = Station.objects.get(id=station_id, is_active=True)
        serializer = StationSerializer(station)
        return success_response(
            message="Station retrieved successfully.",
            data=serializer.data,
            status_code=status.HTTP_200_OK,
            code="STATION_RETRIEVED",
        )
    except Station.DoesNotExist:
        return error_response(
            message="Station not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            code="STATION_NOT_FOUND",
        )
    except Exception as e:
        logger.error(f"Error retrieving station: {str(e)}", exc_info=True)
        return error_response(
            message="An error occurred while retrieving station.",
            errors=str(e) if settings.DEBUG else {"detail": "An unexpected error occurred."},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
        )