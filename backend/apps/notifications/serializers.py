from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    form_public_id = serializers.CharField(source="form.public_id", read_only=True, default=None)

    class Meta:
        model = Notification
        fields = ["id", "form", "form_public_id", "message", "type", "is_read", "created_at"]
        read_only_fields = ["id", "created_at"]
