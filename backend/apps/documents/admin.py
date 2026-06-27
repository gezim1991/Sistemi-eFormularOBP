from django.contrib import admin
from .models import DocumentFile


@admin.register(DocumentFile)
class DocumentFileAdmin(admin.ModelAdmin):
    list_display = ["form", "file_type", "original_name", "size", "uploaded_by", "created_at"]
    list_filter = ["file_type"]
    search_fields = ["form__public_id", "original_name"]
    readonly_fields = ["created_at"]
