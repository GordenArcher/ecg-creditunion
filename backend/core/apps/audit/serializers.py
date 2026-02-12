from rest_framework import serializers

from apps.users.models import User
from .models import AuditLog



class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['employee_id', 'email', 'full_name', 'staff_id', 'role']
        

class AuditLogSerializer(serializers.ModelSerializer):
    """
    Simple serializer for AuditLog model.
    Only includes specified fields - no extra logic here.
    """

    actor = UserBasicSerializer(read_only=True)
    timestamp_formatted = serializers.DateTimeField(source='timestamp', format='%d %b %Y %H:%M:%S')
    class Meta:
        model = AuditLog
        fields = [
            "id",
            'actor',
            "action",
            "target_type",
            "severity",
            "target_id",
            "status",
            "actor_role",
            "ip_address",
            "device_info",
            "metadata",
            "before_state",
            "after_state",
            "timestamp",
            'timestamp_formatted'
        ]
