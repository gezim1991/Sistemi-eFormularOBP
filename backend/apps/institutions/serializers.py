from rest_framework import serializers
from .models import Institution


class InstitutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institution
        fields = ["id", "name", "nipt", "type", "address", "email", "phone", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
