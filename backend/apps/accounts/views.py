from django.contrib.auth import login, logout
from django.middleware.csrf import get_token
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.viewsets import ModelViewSet

from apps.audit.utils import log_action
from .models import User
from .permissions import IsAdmin
from .serializers import LoginSerializer, UserAdminSerializer, UserCreateSerializer, UserProfileSerializer


class LoginRateThrottle(AnonRateThrottle):
    rate = "10/min"


@api_view(["GET"])
@permission_classes([AllowAny])
def csrf_token(request):
    """Return CSRF token so the SPA can include it in subsequent requests."""
    return Response({"csrfToken": get_token(request)})


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([LoginRateThrottle])
def login_view(request):
    serializer = LoginSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data["user"]
    login(request, user)
    log_action(request, "login", "user", str(user.pk))
    return Response({"user": UserProfileSerializer(user).data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    log_action(request, "logout", "user", str(request.user.pk))
    logout(request)
    return Response({"detail": "Logged out successfully."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response({"user": UserProfileSerializer(request.user).data})


class UserViewSet(ModelViewSet):
    queryset = User.objects.select_related("institution").order_by("-created_at")
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        return UserAdminSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        log_action(self.request, "create_user", "user", str(user.pk), {"email": user.email})

    def perform_update(self, serializer):
        user = serializer.save()
        log_action(self.request, "update_user", "user", str(user.pk), {"email": user.email})

    def perform_destroy(self, instance):
        log_action(
            self.request,
            "delete_user",
            "user",
            str(instance.pk),
            {"email": instance.email},
        )
        instance.delete()
