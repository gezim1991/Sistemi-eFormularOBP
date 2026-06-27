from django.contrib import admin
from .models import Form, FormOpbActivity


@admin.register(Form)
class FormAdmin(admin.ModelAdmin):
    list_display = ["public_id", "form_title", "created_by", "institution", "status", "created_at"]
    list_filter = ["status"]
    search_fields = ["public_id", "first_name", "last_name", "nid", "form_title"]
    readonly_fields = ["uuid", "public_id", "created_at", "updated_at"]
    ordering = ["-created_at"]


@admin.register(FormOpbActivity)
class FormOpbActivityAdmin(admin.ModelAdmin):
    list_display = ["form", "user", "viewed_at", "downloaded_at"]
    readonly_fields = ["created_at", "updated_at"]
