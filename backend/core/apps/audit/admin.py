from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = (
        "timestamp",
        "actor",
        "actor_role",
        "action",
        "target_type",
        "target_id",
        "status",
        "severity",
        "ip_address",
    )
    list_filter = (
        "status",
        "severity",
        "action",
        "actor",
        "actor_role",
        "target_type",
    )
    search_fields = (
        "actor__username", 
        "actor_role",
        "action",
        "target_type",
        "target_id",
        "ip_address",
    )
    readonly_fields = (
        "id",
        "actor",
        "actor_role",
        "action",
        "target_type",
        "target_id",
        "status",
        "severity",
        "ip_address",
        "device_info",
        "metadata",
        "before_state",
        "after_state",
        "timestamp",
    )
    ordering = ("-timestamp",)
    date_hierarchy = "timestamp"
    list_select_related = ("actor",)  # optimize queries

    # Optional: collapse large JSON fields
    fieldsets = (
        (None, {
            "fields": (
                "timestamp",
                "actor",
                "actor_role",
                "action",
                "status",
                "severity",
                "ip_address",
                "device_info",
            )
        }),
        ("Target Info", {
            "fields": ("target_type", "target_id")
        }),
        ("Data", {
            "fields": ("metadata", "before_state", "after_state"),
            "classes": ("collapse",),  # collapsible for cleaner view
        }),
    )

    # def has_add_permission(self, request):
    #     return False  # logs are not added manually

    # def has_delete_permission(self, request, obj=None):
    #     return False  # optional: prevent deletion for audit integrity
