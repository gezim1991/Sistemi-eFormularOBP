import uuid
from django.db import models
from django.conf import settings


def next_public_id():
    """Generate next APL-YYYY-NNNN identifier."""
    from django.utils import timezone
    year = timezone.now().year
    prefix = f"APL-{year}-"
    last = (
        Form.objects.filter(public_id__startswith=prefix)
        .order_by("-public_id")
        .values_list("public_id", flat=True)
        .first()
    )
    if last:
        try:
            num = int(last.split("-")[-1]) + 1
        except ValueError:
            num = 1
    else:
        num = 1
    return f"{prefix}{str(num).zfill(4)}"


class Form(models.Model):
    DRAFT = "draft"
    PDF_GENERATED = "pdf_generated"
    SIGNED_UPLOADED = "signed_uploaded"
    SUBMITTED_TO_OPB = "submitted_to_opb"
    ARCHIVED = "archived"

    STATUS_CHOICES = [
        (DRAFT, "Draft"),
        (PDF_GENERATED, "PDF i gjeneruar"),
        (SIGNED_UPLOADED, "I firmosur / i ngarkuar"),
        (SUBMITTED_TO_OPB, "Dorëzuar OPB"),
        (ARCHIVED, "Arkivuar"),
    ]

    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    public_id = models.CharField(max_length=20, unique=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_forms",
    )
    institution = models.ForeignKey(
        "institutions.Institution",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="forms",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=DRAFT)

    # Applicant fields (names match frontend field names for clarity)
    first_name = models.CharField(max_length=100, blank=True)   # emri
    last_name = models.CharField(max_length=100, blank=True)    # mbiemri
    father_name = models.CharField(max_length=100, blank=True)  # atesia
    nid = models.CharField(max_length=30, blank=True)
    birth_date = models.DateField(null=True, blank=True)        # datelindja
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)         # telefon
    address = models.TextField(blank=True)                      # adresa
    application_reason = models.TextField(blank=True)           # arsyeja
    form_title = models.CharField(max_length=400, blank=True)   # emerFormulari

    # Procurement document (full JSON blob)
    document_data = models.JSONField(null=True, blank=True)     # document

    # Workflow timestamps
    pdf_generated_at = models.DateTimeField(null=True, blank=True)
    signed_uploaded_at = models.DateTimeField(null=True, blank=True)
    submitted_to_opb_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "forms_form"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.public_id} — {self.form_title or 'Pa titull'}"

    def save(self, *args, **kwargs):
        if not self.public_id:
            self.public_id = next_public_id()
        super().save(*args, **kwargs)

    # ----- Permission helpers -----

    def can_edit(self, user):
        if user.is_admin:
            return True
        if user.is_ak and self.created_by_id == user.pk:
            return self.status in (self.DRAFT, self.PDF_GENERATED, self.SIGNED_UPLOADED)
        return False

    def can_generate_pdf(self, user):
        if user.is_ak and self.created_by_id == user.pk:
            return self.status in (self.DRAFT, self.PDF_GENERATED)
        return user.is_admin

    def can_upload_signed(self, user):
        if user.is_ak and self.created_by_id == user.pk:
            return self.status == self.PDF_GENERATED
        return False

    def can_submit_to_opb(self, user):
        if user.is_ak and self.created_by_id == user.pk:
            return self.status == self.SIGNED_UPLOADED
        return False

    def can_download_pdf(self, user):
        if user.is_admin:
            return True
        if user.is_ak and self.created_by_id == user.pk:
            return self.status != self.DRAFT
        if user.is_opb:
            return self.status == self.SUBMITTED_TO_OPB
        return False


class FormOpbActivity(models.Model):
    form = models.ForeignKey(
        Form,
        on_delete=models.CASCADE,
        related_name="opb_activities",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="opb_activities",
    )
    viewed_at = models.DateTimeField(null=True, blank=True)
    downloaded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "forms_formopbactivity"
        unique_together = [("form", "user")]

    def __str__(self):
        return f"{self.user} → {self.form.public_id}"
