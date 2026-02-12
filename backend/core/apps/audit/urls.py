from django.urls import path
from . import views

urlpatterns = [
    path("logs/", views.audit_log_list),
    path("logs/stats/", views.audit_log_stats),
    path("logs/<uuid:log_id>/", views.get_audit_log_detail),
]