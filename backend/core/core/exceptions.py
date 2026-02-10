from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError, AuthenticationFailed, NotAuthenticated, PermissionDenied
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    error_data = {
        "status": "error",
        "message": "An unexpected error occurred. Please try again.",
        "errors": [],
    }

    if isinstance(exc, (DRFValidationError, DjangoValidationError)):
        error_data["message"] = "Validation failed"
        error_data["errors"] = exc.detail if hasattr(exc, "detail") else str(exc)
        return Response(error_data, status=status.HTTP_400_BAD_REQUEST)

    elif isinstance(exc, (AuthenticationFailed, NotAuthenticated)):
        error_data["message"] = "Authentication error"
        return Response(error_data, status=status.HTTP_401_UNAUTHORIZED)

    elif isinstance(exc, PermissionDenied):
        error_data["message"] = "Permission denied"
        return Response(error_data, status=status.HTTP_403_FORBIDDEN)

    elif response is not None:
        error_data["message"] = response.data.get("detail", error_data["message"])
        return Response(error_data, status=response.status_code)

    logger.error("Unhandled Exception", exc_info=exc)

    return Response(error_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
