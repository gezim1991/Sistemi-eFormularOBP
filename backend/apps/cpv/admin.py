from django.contrib import admin

from .models import CpvCode


@admin.register(CpvCode)
class CpvCodeAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "group"]
    search_fields = ["code", "name", "group"]
