from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User

ROLE_MAP = {User.AK: "aplikues", User.OPB: "opb", User.ADMIN: "superadmin"}
ROLE_MAP_REVERSE = {v: k for k, v in ROLE_MAP.items()}


class UserProfileSerializer(serializers.ModelSerializer):
    """Output matches the AuthUser interface expected by the frontend."""

    name = serializers.CharField(source="full_name")
    role = serializers.SerializerMethodField()
    institucioni = serializers.SerializerMethodField()
    nipt = serializers.SerializerMethodField()
    adresaInstitucioni = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["email", "name", "role", "institucioni", "nipt", "adresaInstitucioni", "initials"]

    def get_role(self, obj):
        return ROLE_MAP.get(obj.role, "aplikues")

    def get_institucioni(self, obj):
        if obj.institution:
            return obj.institution.name
        return None

    def get_nipt(self, obj):
        if obj.institution:
            return obj.institution.nipt or ""
        return ""

    def get_adresaInstitucioni(self, obj):
        if obj.institution:
            return obj.institution.address or ""
        return ""


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get("request"),
            username=attrs["email"].lower(),
            password=attrs["password"],
        )
        if not user:
            raise serializers.ValidationError(
                {"detail": "Kredencialet janë të pasakta."}
            )
        if not user.is_active:
            raise serializers.ValidationError(
                {"detail": "Llogaria është çaktivizuar."}
            )
        attrs["user"] = user
        return attrs


class UserAdminSerializer(serializers.ModelSerializer):
    """Full user detail for Admin user management."""

    role_display = serializers.CharField(source="get_role_display", read_only=True)
    institution_name = serializers.CharField(source="institution.name", read_only=True)
    frontend_role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "role",
            "role_display",
            "frontend_role",
            "institution",
            "institution_name",
            "initials",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        extra_kwargs = {"password": {"write_only": True}}

    def get_frontend_role(self, obj):
        return ROLE_MAP.get(obj.role, "aplikues")

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class UserCreateSerializer(UserAdminSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=8)

    class Meta(UserAdminSerializer.Meta):
        fields = UserAdminSerializer.Meta.fields + ["password"]
