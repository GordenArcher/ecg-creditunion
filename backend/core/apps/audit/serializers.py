from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    """
    Simple serializer for AuditLog model.
    Only includes specified fields - no extra logic here.
    """
    class Meta:
        model = AuditLog
        fields = [
            "id",
            "action",
            "target_type",
            "target_id",
            "status",
            "actor_role",
            "ip_address",
            "device_info",
            "metadata",
            "before_state",
            "after_state",
            "timestamp",
        ]
    
    actor_email = serializers.EmailField(source="actor.email", read_only=True, allow_null=True)
    actor_name = serializers.SerializerMethodField(read_only=True)
    
    def get_actor_name(self, obj):
        """Get formatted actor name if actor exists."""
        if obj.actor:
            name_parts = []
            if obj.actor.first_name:
                name_parts.append(obj.actor.first_name)
            if obj.actor.last_name:
                name_parts.append(obj.actor.last_name)
            return " ".join(name_parts) if name_parts else obj.actor.email
        return ""