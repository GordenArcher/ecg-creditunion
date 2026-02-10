from django.urls import path
from .views import get_audit_logs, get_audit_log_detail

urlpatterns = [
    path("logs/", get_audit_logs),
    path("logs/<uuid:log_id>/", get_audit_log_detail),
]