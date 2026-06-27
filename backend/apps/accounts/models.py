from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", User.ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("full_name", "Super Admin")
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    AK = "AK"
    OPB = "OPB"
    ADMIN = "ADMIN"
    ROLE_CHOICES = [
        (AK, "Autoritet Kontraktor"),
        (OPB, "Operator i Blerjeve të Përqendruara"),
        (ADMIN, "Administrator"),
    ]

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=200)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=AK)
    institution = models.ForeignKey(
        "institutions.Institution",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="users",
    )
    initials = models.CharField(max_length=5, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "accounts_user"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.full_name} <{self.email}>"

    @property
    def is_ak(self):
        return self.role == self.AK

    @property
    def is_opb(self):
        return self.role == self.OPB

    @property
    def is_admin(self):
        return self.role == self.ADMIN

    def save(self, *args, **kwargs):
        if not self.initials and self.full_name:
            parts = self.full_name.split()
            self.initials = "".join(p[0].upper() for p in parts[:2])
        super().save(*args, **kwargs)
