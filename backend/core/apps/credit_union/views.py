from django.shortcuts import render

import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from common.utils.generate_requestID import generate_request_id
# from common.utils import get_client_ip
from common.utils.request_utils import get_client_ip
from apps.audit.services.audit_service import AuditService
from apps.audit.models import AuditLog
from django.conf import settings
from apps.users.utils.user_cache import UserCacheManager
from common.responses.response import success_response, error_response
from apps.credit_union.services.import_service import MemberExcelImporter
from .serializers import MemberSerializer

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def import_members_excel(request):
    """
    Import members from Excel file using Staff # as identifier.
    
    Excel columns can include:
    - Staff # (required) - used to find existing user
    - Station - will create if not exists, updates user's station
    - Division - will create if not exists, updates user's division
    - Directorate - used for division creation
    - Email - updates user's email if valid and unique
    - Entrance Fee - member entrance fee
    - Nominee - member nominee name
    - Address - member address
    - Witness - witness name
    - Relationship - relationship to nominee
    - Joined Date - member join date (defaults to now)
    
    Returns:
        Summary of imported members
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
        result = MemberExcelImporter.import_members(excel_file, request.user)
        
        UserCacheManager.invalidate_all_users()
        
        AuditService.log(
            actor=request.user,
            action="MEMBER_EXCEL_IMPORT",
            target_type="Member",
            severity=AuditLog.Severity.HIGH,
            status=AuditLog.Status.SUCCESS,
            ip_address=get_client_ip(request),
            metadata={
                "filename": excel_file.name,
                "total_rows": result['summary']['total_rows'],
                "members_created": result['summary']['successful'],
                "rows_failed": result['summary']['failed'],
                "rows_skipped": result['summary']['skipped'],
                "stations_created": len(result['summary']['stations_created']),
                "divisions_created": len(result['summary']['divisions_created']),
                "imported_by": f"{request.user.full_name} ({request.user.staff_id})",
            }
        )
        
        response_data = {
            "import_summary": result['summary'],
            "created_stations": result['summary']['stations_created'],
            "created_divisions": result['summary']['divisions_created'],
            "successful_imports": result['successful'],
            "failed_imports": result['failed'],
            "skipped_imports": result['skipped'],
            "warnings": result['warnings'],
        }
        
        message = f"Import completed. {result['summary']['successful']} members created."
        if result['summary']['failed'] > 0:
            message += f" {result['summary']['failed']} rows failed."
        if result['summary']['skipped'] > 0:
            message += f" {result['summary']['skipped']} rows skipped."
        
        return success_response(
            message=message,
            data=response_data,
            status_code=status.HTTP_201_CREATED,
            code="MEMBERS_IMPORTED",
            request_id=request_id,
            meta={
                "filename": excel_file.name,
                "imported_by": request.user.email,
                "timestamp": timezone.now().isoformat(),
            }
        )
        
    except ValueError as e:
        logger.warning(f"Member import validation error: {str(e)}")
        return error_response(
            message=str(e),
            status_code=status.HTTP_400_BAD_REQUEST,
            code="VALIDATION_ERROR",
            request_id=request_id,
        )
        
    except Exception as e:
        logger.error(f"Error importing members: {str(e)}", exc_info=True)
        
        AuditService.log(
            actor=request.user,
            action="MEMBER_IMPORT_FAILED",
            target_type="System",
            severity=AuditLog.Severity.HIGH,
            status=AuditLog.Status.FAILED,
            ip_address=get_client_ip(request),
            metadata={
                "filename": excel_file.name,
                "error": str(e),
                "imported_by": request.user.email,
            }
        )
        
        return error_response(
            message="An error occurred while importing members.",
            errors=str(e) if settings.DEBUG else None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="IMPORT_ERROR",
            request_id=request_id,
        )