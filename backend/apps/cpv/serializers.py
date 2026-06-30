from rest_framework import serializers

from .models import CpvCode


class CpvCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CpvCode
        fields = ["id", "group", "name", "code", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
