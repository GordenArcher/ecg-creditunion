from typing import Any, Dict, List, Optional, Union

from rest_framework import status
from rest_framework.response import Response


def success_response(
    message: str = "Request successful",
    data: Optional[Union[List[Any], Dict[str, Any]]] = None,
    status_code: int = status.HTTP_200_OK,
    code: Optional[str] = None,
    request_id: Optional[str] = None,
    meta: Optional[Dict[str, Any]] = None,
) -> Response:
    """
    Standardized success response with optional metadata.
        - The "status" field indicates the success of the request.
        - The "message" field provides a general description of the successful operation.
        - The "http_status" field indicates the HTTP status code of the response.
        - The "data" field contains the actual response data, which can be a list or a dictionary. If no data is provided, it defaults to an empty list.
        - Optional "code" and "meta" fields can provide additional context about the success response.
        - This structure allows for consistent success handling on the client side, regardless of how the data is generated on the server side.
        - Example usage:
            return success_response(
                message="User created successfully",
                data={"id": user.id, "username": user.username},
                status_code=status.HTTP_201_CREATED,
                code="USER_CREATED",
                meta={"user_id": user.id, "email": user.email, "timestamp": "2024-06-01T12:00:00Z"},
                request_id=request_id
            )
    """

    payload = {
        "status": "success",
        "message": message,
        "http_status": status_code,
        "data": data if data is not None else [],
    }

    if meta:
        payload["meta"] = meta

    if code:
        payload["code"] = code

    if request_id:
        payload["request_id"] = request_id

    return Response(payload, status=status_code)


def error_response(
    message: str = "Request failed",
    errors: Optional[Union[Dict[str, Any], List[Any], str]] = None,
    status_code: int = status.HTTP_400_BAD_REQUEST,
    code: Optional[str] = None,
    request_id: Optional[str] = None,
    meta: Optional[Dict[str, Any]] = None,
) -> Response:
    """
    Standardized error response with normalized error formats.
        - If errors is a list, it will be returned as-is.
        - If errors is a dict, it will be wrapped in a list.
        - If errors is a string, it will be converted to a list with one item.
        - If errors is None, it will default to an empty list.
        - This ensures the "errors" field is always a list in the response.
        - The "message" field provides a general description of the error.
        - The "http_status" field indicates the HTTP status code of the response.
        - Optional "code" and "meta" fields can provide additional context about the error.
        - This structure allows for consistent error handling on the client side, regardless of how the errors are generated on the server side.
        - Example usage:
            return error_response(
                message="Validation failed",
                errors={"email": ["This field is required."], "password": ["This field is required."]},
                status_code=status.HTTP_400_BAD_REQUEST,
                code="VALIDATION_ERROR",
                meta={"field": "email", "timestamp": "2024-06-01T12:00:00Z"},
                request_id=request_id
            )
    """

    if errors is None:
        normalized_errors = []
    elif isinstance(errors, list):
        normalized_errors = errors
    elif isinstance(errors, dict):
        normalized_errors = [errors]
    else:
        normalized_errors = [str(errors)]

    payload = {
        "status": "error",
        "message": message,
        "http_status": status_code,
        "errors": normalized_errors,
    }

    if meta:
        payload["meta"] = meta

    if code:
        payload["code"] = code

    if request_id:
        payload["request_id"] = request_id

    return Response(payload, status=status_code)
