from apps.accounts.models import User
from .models import Notification


def notify_opb_users(form, request=None):
    """Create a notification for all active OPB users when a form is submitted."""
    opb_users = User.objects.filter(role=User.OPB, is_active=True)
    for user in opb_users:
        Notification.objects.create(
            user=user,
            form=form,
            message=(
                f"Formulari i ri {form.public_id} — "
                f"{form.form_title or form.first_name + ' ' + form.last_name} "
                f"u dorëzua nga {form.created_by.full_name}."
            ),
        )
