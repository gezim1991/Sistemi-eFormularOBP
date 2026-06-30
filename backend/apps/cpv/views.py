import csv
import io

from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.permissions import IsAdmin

from .models import CpvCode
from .serializers import CpvCodeSerializer

MAX_IMPORT_SIZE = 10 * 1024 * 1024  # 10 MB


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

    @action(detail=False, methods=["post"], parser_classes=[MultiPartParser, FormParser])
    def import_csv(self, request):
        upload = request.FILES.get("file")
        if not upload:
            return Response({"detail": "Nuk u dërgua asnjë file CSV"}, status=400)
        if upload.size > MAX_IMPORT_SIZE:
            return Response({"detail": "File shumë i madh (maksimumi 10MB)"}, status=400)

        raw = upload.read()
        try:
            decoded = raw.decode("utf-8-sig")
        except UnicodeDecodeError:
            try:
                decoded = raw.decode("windows-1252")
            except UnicodeDecodeError:
                return Response({"detail": "Nuk u njoh formati i karaktereve të file-it"}, status=400)

        reader = csv.DictReader(io.StringIO(decoded))
        if not reader.fieldnames:
            return Response({"detail": "File CSV bosh ose i pavlefshëm"}, status=400)

        fields = {name.strip().lower(): name for name in reader.fieldnames}
        group_key = fields.get("group")
        name_key = fields.get("name")
        code_key = fields.get("code")
        if not name_key or not code_key:
            return Response(
                {"detail": "CSV duhet të ketë kolonat 'name' dhe 'code' (dhe opsionalisht 'group')"},
                status=400,
            )

        created = updated = skipped = 0
        for row in reader:
            code = (row.get(code_key) or "").strip()
            name = (row.get(name_key) or "").strip()
            group = (row.get(group_key) or "").strip() if group_key else ""
            if not code or not name:
                skipped += 1
                continue
            _, was_created = CpvCode.objects.update_or_create(
                code=code,
                defaults={"name": name, "group": group},
            )
            if was_created:
                created += 1
            else:
                updated += 1

        return Response({"created": created, "updated": updated, "skipped": skipped})
