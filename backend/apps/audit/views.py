from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
import django_filters

from apps.accounts.permissions import IsAdmin
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogFilter(django_filters.FilterSet):
    user = django_filters.NumberFilter(field_name="actor__id")
    action = django_filters.CharFilter(lookup_expr="icontains")
    entity_type = django_filters.CharFilter()
    date_from = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    date_to = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model = AuditLog
        fields = ["user", "action", "entity_type", "date_from", "date_to"]


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related("actor").order_by("-created_at")
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdmin]
    filterset_class = AuditLogFilter
