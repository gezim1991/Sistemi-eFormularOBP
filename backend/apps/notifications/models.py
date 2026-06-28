from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPE_FORM_SUBMITTED = "form_submitted"
    TYPE_FORM_VIEWED = "form_viewed"
    TYPE_FORM_DOWNLOADED = "form_downloaded"
    TYPE_GENERIC = "generic"

    TYPE_CHOICES = [
        (TYPE_FORM_SUBMITTED, "Formular i dorëzuar tek OPB"),
        (TYPE_FORM_VIEWED, "Formular i parë nga OPB"),
        (TYPE_FORM_DOWNLOADED, "Formular i shkarkuar nga OPB"),
        (TYPE_GENERIC, "Njoftim i përgjithshëm"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    form = models.ForeignKey(
        "forms.Form",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="notifications",
    )
    message = models.TextField()
    type = models.CharField(
        max_length=30,
        choices=TYPE_CHOICES,
        default=TYPE_GENERIC,
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications_notification"
        ordering = ["-created_at"]

    def __str__(self):
        return f"→ {self.user.email}: {self.message[:60]}"
