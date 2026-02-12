import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.exceptions import (
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied,
)
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    error_data = {
        "status": "error",
        "message": "An unexpected error occurred. Please try again.",
        "errors": [],
        "code": "INTERNAL_SERVER_ERROR",
    }

    if isinstance(exc, NotAuthenticated):
        error_data["message"] = "Authentication credentials were not provided"
        error_data["code"] = "NOT_AUTHENTICATED"
        return Response(error_data, status=status.HTTP_401_UNAUTHORIZED)

    elif isinstance(exc, AuthenticationFailed):
        error_data["message"] = str(exc) or "Invalid authentication credentials"
        error_data["code"] = "AUTHENTICATION_FAILED"
        return Response(error_data, status=status.HTTP_401_UNAUTHORIZED)

    elif isinstance(exc, PermissionDenied):
        error_data["message"] = "You do not have permission to perform this action"
        error_data["code"] = "PERMISSION_DENIED"
        return Response(error_data, status=status.HTTP_403_FORBIDDEN)

    elif isinstance(exc, (DRFValidationError, DjangoValidationError)):
        error_data["message"] = "Validation failed"
        error_data["errors"] = exc.detail if hasattr(exc, "detail") else str(exc)
        error_data["code"] = "VALIDATION_ERROR"
        return Response(error_data, status=status.HTTP_400_BAD_REQUEST)

    elif response is not None:
        error_data["message"] = response.data.get("detail", error_data["message"])
        error_data["code"] = exc.__class__.__name__.upper()
        return Response(error_data, status=response.status_code)

    logger.error("Unhandled Exception", exc_info=exc)
    error_data["code"] = "UNHANDLED_ERROR"

    return Response(error_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
