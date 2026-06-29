from rest_framework import serializers
from .models import Form, FormOpbActivity


class FormSerializer(serializers.ModelSerializer):
    """
    Output shape matches the FormRecord TypeScript interface in the frontend.
    Field names are deliberately in Albanian / camelCase to avoid frontend changes.
    """

    # Map internal English names → frontend Albanian/camelCase names
    id = serializers.CharField(source="public_id", read_only=True)
    emri = serializers.CharField(source="first_name", default="")
    mbiemri = serializers.CharField(source="last_name", default="")
    atesia = serializers.CharField(source="father_name", default="")
    datelindja = serializers.DateField(source="birth_date", allow_null=True, required=False)
    telefon = serializers.CharField(source="phone", default="")
    adresa = serializers.CharField(source="address", default="")
    arsyeja = serializers.CharField(source="application_reason", default="")
    institucioni = serializers.SerializerMethodField()
    emerFormulari = serializers.CharField(source="form_title", allow_blank=True, default="")
    document = serializers.JSONField(source="document_data", allow_null=True, required=False)

    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
    pdfGeneratedAt = serializers.DateTimeField(source="pdf_generated_at", read_only=True, allow_null=True)
    signedUploadedAt = serializers.DateTimeField(source="signed_uploaded_at", read_only=True, allow_null=True)
    submittedToOpbAt = serializers.DateTimeField(source="submitted_to_opb_at", read_only=True, allow_null=True)

    # Signed document info (from related DocumentFile)
    signedFileName = serializers.SerializerMethodField()
    signedFileSize = serializers.SerializerMethodField()

    # OPB activity for the requesting user
    opbViewedAt = serializers.SerializerMethodField()
    opbDownloadedAt = serializers.SerializerMethodField()
    isNewForMe = serializers.SerializerMethodField()

    # Permission flags
    attachments = serializers.SerializerMethodField()
    canEdit = serializers.SerializerMethodField()
    canGeneratePdf = serializers.SerializerMethodField()
    canUploadSigned = serializers.SerializerMethodField()
    canSubmitToOpb = serializers.SerializerMethodField()
    canDownloadPdf = serializers.SerializerMethodField()
    canUploadAttachment = serializers.SerializerMethodField()

    class Meta:
        model = Form
        fields = [
            "id",
            "emri", "mbiemri", "atesia",
            "nid", "datelindja",
            "email", "telefon", "adresa",
            "institucioni", "arsyeja",
            "status",
            "emerFormulari", "document",
            "createdAt", "updatedAt",
            "pdfGeneratedAt", "signedUploadedAt", "submittedToOpbAt",
            "signedFileName", "signedFileSize",
            "attachments",
            "opbViewedAt", "opbDownloadedAt", "isNewForMe",
            "canEdit", "canGeneratePdf", "canUploadSigned",
            "canSubmitToOpb", "canDownloadPdf", "canUploadAttachment",
        ]

    # ---- institutions ----
    def get_institucioni(self, obj):
        if obj.institution:
            return obj.institution.name
        return ""

    # ---- signed document info ----
    def _get_signed_doc(self, obj):
        if not hasattr(obj, "_signed_doc"):
            doc = obj.document_files.filter(file_type="signed_pdf").order_by("-created_at").first()
            object.__setattr__(obj, "_signed_doc", doc)
        return obj._signed_doc

    def get_signedFileName(self, obj):
        doc = self._get_signed_doc(obj)
        return doc.original_name if doc else None

    def get_signedFileSize(self, obj):
        doc = self._get_signed_doc(obj)
        return doc.size if doc else None

    # ---- OPB activity ----
    def _get_request_user(self):
        request = self.context.get("request")
        return request.user if request and request.user.is_authenticated else None

    def _get_opb_activity(self, obj):
        if not hasattr(obj, "_opb_activity"):
            user = self._get_request_user()
            if user and user.is_opb:
                activity = obj.opb_activities.filter(user=user).first()
            else:
                activity = None
            object.__setattr__(obj, "_opb_activity", activity)
        return obj._opb_activity

    def get_opbViewedAt(self, obj):
        activity = self._get_opb_activity(obj)
        return activity.viewed_at if activity else None

    def get_opbDownloadedAt(self, obj):
        activity = self._get_opb_activity(obj)
        return activity.downloaded_at if activity else None

    def get_isNewForMe(self, obj):
        activity = self._get_opb_activity(obj)
        if activity is None:
            user = self._get_request_user()
            return bool(user and user.is_opb)
        return activity.viewed_at is None and activity.downloaded_at is None

    # ---- permission flags ----
    def _user(self):
        return self._get_request_user()

    def get_canEdit(self, obj):
        user = self._user()
        return bool(user and obj.can_edit(user))

    def get_canGeneratePdf(self, obj):
        user = self._user()
        return bool(user and obj.can_generate_pdf(user))

    def get_canUploadSigned(self, obj):
        user = self._user()
        return bool(user and obj.can_upload_signed(user))

    def get_canSubmitToOpb(self, obj):
        user = self._user()
        return bool(user and obj.can_submit_to_opb(user))

    def get_canDownloadPdf(self, obj):
        user = self._user()
        return bool(user and obj.can_download_pdf(user))

    def get_canUploadAttachment(self, obj):
        user = self._user()
        return bool(user and obj.can_upload_attachment(user))

    # ---- attachments ----
    def get_attachments(self, obj):
        request = self.context.get("request")
        if not request or not obj.can_view_attachments(request.user):
            return []
        docs = obj.document_files.filter(file_type="attachment").order_by("created_at")
        return [
            {
                "id": d.pk,
                "name": d.original_name,
                "size": d.size,
                "contentType": d.content_type,
                "uploadedAt": d.created_at.isoformat(),
                "downloadUrl": f"/api/forms/{obj.public_id}/attachments/{d.pk}/download/",
            }
            for d in docs
        ]


class FormWriteSerializer(serializers.ModelSerializer):
    """Used for create / update — accepts Albanian field names from the frontend."""

    emri = serializers.CharField(source="first_name", required=False, allow_blank=True)
    mbiemri = serializers.CharField(source="last_name", required=False, allow_blank=True)
    atesia = serializers.CharField(source="father_name", required=False, allow_blank=True)
    datelindja = serializers.DateField(source="birth_date", required=False, allow_null=True)
    telefon = serializers.CharField(source="phone", required=False, allow_blank=True)
    adresa = serializers.CharField(source="address", required=False, allow_blank=True)
    arsyeja = serializers.CharField(source="application_reason", required=False, allow_blank=True)
    emerFormulari = serializers.CharField(source="form_title", required=False, allow_blank=True)
    document = serializers.JSONField(source="document_data", required=False, allow_null=True)

    class Meta:
        model = Form
        fields = [
            "emri", "mbiemri", "atesia",
            "nid", "datelindja",
            "email", "telefon", "adresa",
            "arsyeja", "emerFormulari", "document",
        ]
