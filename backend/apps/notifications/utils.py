from apps.accounts.models import User
from .models import Notification


def notify_opb_users(form, request=None):
    """Notify all active OBP users when an AK submits a form."""
    title = form.form_title or f"{form.first_name} {form.last_name}".strip() or form.public_id
    opb_users = User.objects.filter(role=User.OPB, is_active=True)
    for user in opb_users:
        Notification.objects.create(
            user=user,
            form=form,
            type=Notification.TYPE_FORM_SUBMITTED,
            message=f"Formulari i ri {form.public_id} — «{title}» u dorëzua nga {form.created_by.full_name}.",
        )


def notify_ak_form_viewed(form, viewed_by):
    """Notify the AK creator that an OBP operator viewed their form (once per form)."""
    creator = form.created_by
    if not creator or not creator.is_active:
        return
    already = Notification.objects.filter(
        user=creator, form=form, type=Notification.TYPE_FORM_VIEWED
    ).exists()
    if already:
        return
    Notification.objects.create(
        user=creator,
        form=form,
        type=Notification.TYPE_FORM_VIEWED,
        message=f"Formulari juaj {form.public_id} u shikua nga operatori OPB.",
    )


def notify_ak_form_downloaded(form, downloaded_by):
    """Notify the AK creator that an OBP operator downloaded their form PDF (once per form)."""
    creator = form.created_by
    if not creator or not creator.is_active:
        return
    already = Notification.objects.filter(
        user=creator, form=form, type=Notification.TYPE_FORM_DOWNLOADED
    ).exists()
    if already:
        return
    Notification.objects.create(
        user=creator,
        form=form,
        type=Notification.TYPE_FORM_DOWNLOADED,
        message=f"Formulari juaj {form.public_id} u shkarkua nga operatori OBP.",
    )
