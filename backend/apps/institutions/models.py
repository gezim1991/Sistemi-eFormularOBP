from django.db import models


class Institution(models.Model):
    name = models.CharField(max_length=300)
    type = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "institutions_institution"
        ordering = ["name"]

    def __str__(self):
        return self.name
