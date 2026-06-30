from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.permissions import IsAdmin

from .models import CpvCode
from .serializers import CpvCodeSerializer


class CpvCodeViewSet(viewsets.ModelViewSet):
    queryset = CpvCode.objects.all()
    serializer_class = CpvCodeSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "code", "group"]

    def get_permissions(self):
        if self.action in ("list", "retrieve", "all"):
            return [IsAuthenticated()]
        return [IsAdmin()]

    @action(detail=False, methods=["get"])
    def all(self, request):
        codes = CpvCode.objects.order_by("name").values("code", "name", "group")
        return Response(list(codes))
