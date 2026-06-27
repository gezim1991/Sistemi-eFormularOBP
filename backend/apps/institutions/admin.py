from django.contrib import admin
from .models import Institution


@admin.register(Institution)
class InstitutionAdmin(admin.ModelAdmin):
    list_display = ["name", "type", "email", "phone", "is_active"]
    list_filter = ["is_active", "type"]
    search_fields = ["name", "email"]
