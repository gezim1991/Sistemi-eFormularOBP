import io
import os
from django.conf import settings
from django.core.files.base import ContentFile
from django.http import FileResponse, Http404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from apps.audit.utils import log_action
from apps.documents.models import DocumentFile
from apps.notifications.utils import notify_opb_users, notify_ak_form_viewed, notify_ak_form_downloaded
from .models import Form, FormOpbActivity
from .pdf_generator import generate_form_pdf
from .serializers import FormSerializer, FormWriteSerializer


class FormViewSet(ViewSet):
    """
    Handles all form operations with role-based access.
    URL prefix: /api/forms/
    """

    permission_classes = [IsAuthenticated]

    def _get_queryset(self, user):
        qs = Form.objects.select_related("institution", "created_by").prefetch_related(
            "document_files", "opb_activities"
        )
        if user.is_admin:
            return qs
        if user.is_opb:
            return qs.filter(status=Form.SUBMITTED_TO_OPB)
        if user.is_ak:
            return qs.filter(created_by=user)
        return qs.none()

    def _get_form(self, user, public_id):
        qs = self._get_queryset(user)
        try:
            return qs.get(public_id=public_id)
        except Form.DoesNotExist:
            raise Http404

    # ---- LIST ----
    def list(self, request):
        scope = request.query_params.get("scope")
        user = request.user
        qs = self._get_queryset(user)

        if scope == "opb" and user.is_opb:
            # Unread on top, then by date
            from django.db.models import Exists, OuterRef, Q
            viewed = FormOpbActivity.objects.filter(
                form=OuterRef("pk"), user=user
            ).exclude(viewed_at__isnull=True).exclude(downloaded_at__isnull=True)
            qs = qs.annotate(has_activity=Exists(viewed)).order_by("has_activity", "-created_at")

        serializer = FormSerializer(qs, many=True, context={"request": request})
        return Response({"count": qs.count(), "results": serializer.data})

    # ---- CREATE ----
    def create(self, request):
        user = request.user
        if not user.is_ak and not user.is_admin:
            return Response(
                {"detail": "Vetëm AK mund të krijojë formularë."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = FormWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        form = serializer.save(
            created_by=user,
            institution=user.institution,
        )
        log_action(request, "create_form", "form", form.public_id)
        out = FormSerializer(form, context={"request": request})
        return Response(out.data, status=status.HTTP_201_CREATED)

    # ---- RETRIEVE ----
    def retrieve(self, request, pk=None):
        form = self._get_form(request.user, pk)
        # Auto-mark as viewed by OPB
        if request.user.is_opb:
            _mark_opb_viewed(form, request.user)
            log_action(request, "opb_viewed_form", "form", form.public_id)
        serializer = FormSerializer(form, context={"request": request})
        return Response(serializer.data)

    # ---- PARTIAL UPDATE ----
    def partial_update(self, request, pk=None):
        form = self._get_form(request.user, pk)
        if not form.can_edit(request.user):
            return Response(
                {"detail": "Nuk keni leje për të edituar këtë formular."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = FormWriteSerializer(form, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log_action(request, "update_form", "form", form.public_id)
        out = FormSerializer(form, context={"request": request})
        return Response(out.data)

    # ---- UPDATE (full) ----
    def update(self, request, pk=None):
        return self.partial_update(request, pk=pk)

    # ---- DELETE ----
    def destroy(self, request, pk=None):
        form = self._get_form(request.user, pk)
        if not (request.user.is_admin or (request.user.is_ak and form.created_by == request.user)):
            return Response(
                {"detail": "Nuk keni leje."},
                status=status.HTTP_403_FORBIDDEN,
            )
        public_id = form.public_id
        form.delete()
        log_action(request, "delete_form", "form", public_id)
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ---- GENERATE PDF ----
    @action(detail=True, methods=["post"], url_path="generate-pdf")
    def generate_pdf(self, request, pk=None):
        form = self._get_form(request.user, pk)
        if not form.can_generate_pdf(request.user):
            return Response(
                {"detail": "Nuk keni leje për të gjeneruar PDF."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            pdf_bytes = generate_form_pdf(form)
        except Exception as exc:
            return Response(
                {"detail": f"Gabim gjatë gjenerimit të PDF: {exc}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        filename = f"{form.public_id}-generated.pdf"

        # Remove old generated PDF if any
        form.document_files.filter(file_type=DocumentFile.GENERATED_PDF).delete()

        doc_file = DocumentFile(
            form=form,
            file_type=DocumentFile.GENERATED_PDF,
            original_name=filename,
            size=len(pdf_bytes),
            content_type="application/pdf",
            uploaded_by=request.user,
        )
        doc_file.file.save(filename, ContentFile(pdf_bytes), save=True)

        form.status = Form.PDF_GENERATED
        form.pdf_generated_at = timezone.now()
        form.save(update_fields=["status", "pdf_generated_at", "updated_at"])

        log_action(request, "generate_pdf", "form", form.public_id)
        out = FormSerializer(form, context={"request": request})
        return Response(out.data)

    # ---- DOWNLOAD PDF ----
    @action(detail=True, methods=["get"], url_path="download-pdf")
    def download_pdf(self, request, pk=None):
        form = self._get_form(request.user, pk)
        if not form.can_download_pdf(request.user):
            return Response(
                {"detail": "Nuk keni leje për të shkarkuar PDF."},
                status=status.HTTP_403_FORBIDDEN,
            )

        doc = form.document_files.filter(file_type=DocumentFile.GENERATED_PDF).order_by("-created_at").first()
        if not doc:
            return Response(
                {"detail": "PDF nuk është gjeneruar ende."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Track OPB download
        if request.user.is_opb:
            activity, _ = FormOpbActivity.objects.get_or_create(form=form, user=request.user)
            if not activity.downloaded_at:
                activity.downloaded_at = timezone.now()
                if not activity.viewed_at:
                    activity.viewed_at = timezone.now()
                activity.save()
                notify_ak_form_downloaded(form, request.user)
            log_action(request, "opb_downloaded_pdf", "form", form.public_id)
        else:
            log_action(request, "download_pdf", "form", form.public_id)

        try:
            file_handle = doc.file.open("rb")
            response = FileResponse(
                file_handle,
                content_type="application/pdf",
                as_attachment=True,
                filename=doc.original_name,
            )
            return response
        except FileNotFoundError:
            return Response(
                {"detail": "Skedari nuk u gjet."},
                status=status.HTTP_404_NOT_FOUND,
            )

    # ---- UPLOAD SIGNED ----
    @action(detail=True, methods=["post"], url_path="upload-signed")
    def upload_signed(self, request, pk=None):
        form = self._get_form(request.user, pk)
        if not form.can_upload_signed(request.user):
            return Response(
                {"detail": "Nuk keni leje për të ngarkuar dokumentin e firmosur."},
                status=status.HTTP_403_FORBIDDEN,
            )

        uploaded = request.FILES.get("file")
        if not uploaded:
            return Response({"detail": "Nuk u ngarkua asnjë skedar."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate: only PDF
        content_type = uploaded.content_type or ""
        name_lower = uploaded.name.lower()
        if not (content_type == "application/pdf" or name_lower.endswith(".pdf")):
            return Response(
                {"detail": "Vetëm skedarë PDF pranohen."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate size
        max_bytes = getattr(settings, "MAX_UPLOAD_SIZE_BYTES", 10 * 1024 * 1024)
        if uploaded.size > max_bytes:
            mb = max_bytes // (1024 * 1024)
            return Response(
                {"detail": f"Madhësia maksimale e lejuar është {mb} MB."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Remove previous signed doc
        form.document_files.filter(file_type=DocumentFile.SIGNED_PDF).delete()

        doc_file = DocumentFile(
            form=form,
            file_type=DocumentFile.SIGNED_PDF,
            original_name=uploaded.name,
            size=uploaded.size,
            content_type=content_type or "application/pdf",
            uploaded_by=request.user,
        )
        doc_file.file.save(uploaded.name, uploaded, save=True)

        form.status = Form.SIGNED_UPLOADED
        form.signed_uploaded_at = timezone.now()
        form.save(update_fields=["status", "signed_uploaded_at", "updated_at"])

        log_action(
            request,
            "upload_signed",
            "form",
            form.public_id,
            {"filename": uploaded.name, "size": uploaded.size},
        )
        out = FormSerializer(form, context={"request": request})
        return Response(out.data)

    # ---- UPLOAD ATTACHMENT ----
    @action(detail=True, methods=["post"], url_path="upload-attachment")
    def upload_attachment(self, request, pk=None):
        form = self._get_form(request.user, pk)
        if not form.can_upload_attachment(request.user):
            return Response(
                {"detail": "Nuk keni leje per te ngarkuar bashkelidhes."},
                status=status.HTTP_403_FORBIDDEN,
            )
        uploaded = request.FILES.get("file")
        if not uploaded:
            return Response({"detail": "Nuk u ngarkua asnje skedar."}, status=status.HTTP_400_BAD_REQUEST)
        max_bytes = getattr(settings, "MAX_UPLOAD_SIZE_BYTES", 10 * 1024 * 1024)
        if uploaded.size > max_bytes:
            mb = max_bytes // (1024 * 1024)
            return Response({"detail": f"Madhesia maksimale e lejuar eshte {mb} MB."}, status=status.HTTP_400_BAD_REQUEST)
        doc_file = DocumentFile(
            form=form,
            file_type=DocumentFile.ATTACHMENT,
            original_name=uploaded.name,
            size=uploaded.size,
            content_type=uploaded.content_type or "application/octet-stream",
            uploaded_by=request.user,
        )
        doc_file.file.save(uploaded.name, uploaded, save=True)
        log_action(request, "upload_attachment", "form", form.public_id, {"filename": uploaded.name, "size": uploaded.size})
        out = FormSerializer(form, context={"request": request})
        return Response(out.data, status=status.HTTP_201_CREATED)

    # ---- DELETE ATTACHMENT ----
    @action(detail=True, methods=["delete"], url_path=r"attachments/(?P<attachment_id>[0-9]+)")
    def delete_attachment(self, request, pk=None, attachment_id=None):
        form = self._get_form(request.user, pk)
        if not form.can_delete_attachment(request.user):
            return Response({"detail": "Nuk keni leje."}, status=status.HTTP_403_FORBIDDEN)
        try:
            doc = form.document_files.get(pk=attachment_id, file_type=DocumentFile.ATTACHMENT)
        except DocumentFile.DoesNotExist:
            return Response({"detail": "Bashkelidhesi nuk u gjet."}, status=status.HTTP_404_NOT_FOUND)
        doc.delete()
        log_action(request, "delete_attachment", "form", form.public_id)
        out = FormSerializer(form, context={"request": request})
        return Response(out.data)

    # ---- DOWNLOAD ATTACHMENT ----
    @action(detail=True, methods=["get"], url_path=r"attachments/(?P<attachment_id>[0-9]+)/download")
    def download_attachment(self, request, pk=None, attachment_id=None):
        form = self._get_form(request.user, pk)
        if not form.can_view_attachments(request.user):
            return Response({"detail": "Nuk keni leje."}, status=status.HTTP_403_FORBIDDEN)
        try:
            doc = form.document_files.get(pk=attachment_id, file_type=DocumentFile.ATTACHMENT)
        except DocumentFile.DoesNotExist:
            return Response({"detail": "Bashkelidhesi nuk u gjet."}, status=status.HTTP_404_NOT_FOUND)
        try:
            file_handle = doc.file.open("rb")
            return FileResponse(
                file_handle,
                content_type=doc.content_type or "application/octet-stream",
                as_attachment=True,
                filename=doc.original_name,
            )
        except FileNotFoundError:
            return Response({"detail": "Skedari nuk u gjet."}, status=status.HTTP_404_NOT_FOUND)

    # ---- SUBMIT TO OPB ----
    @action(detail=True, methods=["post"], url_path="submit-to-opb")
    def submit_to_opb(self, request, pk=None):
        form = self._get_form(request.user, pk)
        if not form.can_submit_to_opb(request.user):
            return Response(
                {"detail": "Formulari nuk mund të dorëzohet në OPB në gjendjen aktuale."},
                status=status.HTTP_403_FORBIDDEN,
            )

        form.status = Form.SUBMITTED_TO_OPB
        form.submitted_to_opb_at = timezone.now()
        form.save(update_fields=["status", "submitted_to_opb_at", "updated_at"])

        notify_opb_users(form, request)
        log_action(request, "submit_to_opb", "form", form.public_id)
        out = FormSerializer(form, context={"request": request})
        return Response(out.data)

    # ---- MARK VIEWED (OPB) ----
    @action(detail=True, methods=["post"], url_path="mark-viewed")
    def mark_viewed(self, request, pk=None):
        if not request.user.is_opb:
            return Response(
                {"detail": "Vetëm OPB mund të shënojë formularin si të parë."},
                status=status.HTTP_403_FORBIDDEN,
            )
        form = self._get_form(request.user, pk)
        _mark_opb_viewed(form, request.user)
        notify_ak_form_viewed(form, request.user)
        log_action(request, "opb_mark_viewed", "form", form.public_id)
        return Response({"detail": "Formulari u shënua si i parë."})

    # ---- OPB SUMMARY ----
    @action(detail=False, methods=["get"], url_path="opb-summary")
    def opb_summary(self, request):
        if not request.user.is_opb and not request.user.is_admin:
            return Response({"detail": "Akses i ndaluar."}, status=status.HTTP_403_FORBIDDEN)

        user = request.user
        qs = Form.objects.filter(status=Form.SUBMITTED_TO_OPB)
        total = qs.count()

        viewed_ids = set(
            FormOpbActivity.objects.filter(user=user, viewed_at__isnull=False)
            .values_list("form_id", flat=True)
        )
        downloaded_ids = set(
            FormOpbActivity.objects.filter(user=user, downloaded_at__isnull=False)
            .values_list("form_id", flat=True)
        )

        all_ids = set(qs.values_list("uuid", flat=True))
        new_count = len(all_ids - viewed_ids - downloaded_ids)

        return Response(
            {
                "total": total,
                "new_count": new_count,
                "viewed_count": len(viewed_ids & all_ids),
                "downloaded_count": len(downloaded_ids & all_ids),
            }
        )


def _mark_opb_viewed(form, user):
    activity, _ = FormOpbActivity.objects.get_or_create(form=form, user=user)
    if not activity.viewed_at:
        activity.viewed_at = timezone.now()
        activity.save(update_fields=["viewed_at", "updated_at"])
