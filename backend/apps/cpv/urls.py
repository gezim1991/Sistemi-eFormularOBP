from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CpvCodeViewSet

router = DefaultRouter()
router.register("", CpvCodeViewSet, basename="cpv-codes")

urlpatterns = [path("", include(router.urls))]
