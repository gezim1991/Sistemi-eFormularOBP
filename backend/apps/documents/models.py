import os
from django.db import models
from django.conf import settings


def document_upload_path(instance, filename):
    return f"forms/{instance.form.public_id}/{instance.file_type}/{filename}"


class DocumentFile(models.Model):
    GENERATED_PDF = "generated_pdf"
    SIGNED_PDF = "signed_pdf"
    ATTACHMENT = "attachment"
    FILE_TYPE_CHOICES = [
        (GENERATED_PDF, "PDF i gjeneruar"),
        (SIGNED_PDF, "PDF i firmosur"),
        (ATTACHMENT, "Shtojcë"),
    ]

    form = models.ForeignKey(
        "forms.Form",
        on_delete=models.CASCADE,
        related_name="document_files",
    )
    file_type = models.CharField(max_length=20, choices=FILE_TYPE_CHOICES)
    file = models.FileField(upload_to=document_upload_path)
    original_name = models.CharField(max_length=255)
    size = models.PositiveIntegerField(default=0)
    content_type = models.CharField(max_length=100, blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        on_delete=models.SET_NULL,
        related_name="uploaded_files",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "documents_documentfile"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.form.public_id} / {self.file_type} / {self.original_name}"

    def delete(self, *args, **kwargs):
        if self.file and os.path.isfile(self.file.path):
            os.remove(self.file.path)
        super().delete(*args, **kwargs)
