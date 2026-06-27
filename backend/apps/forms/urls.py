from django.urls import path
from .views import FormViewSet

form_list = FormViewSet.as_view({"get": "list", "post": "create"})
form_detail = FormViewSet.as_view({
    "get": "retrieve",
    "patch": "partial_update",
    "put": "update",
    "delete": "destroy",
})
generate_pdf = FormViewSet.as_view({"post": "generate_pdf"})
download_pdf = FormViewSet.as_view({"get": "download_pdf"})
upload_signed = FormViewSet.as_view({"post": "upload_signed"})
submit_to_opb = FormViewSet.as_view({"post": "submit_to_opb"})
mark_viewed = FormViewSet.as_view({"post": "mark_viewed"})
opb_summary = FormViewSet.as_view({"get": "opb_summary"})

urlpatterns = [
    path("", form_list, name="form-list"),
    path("opb-summary/", opb_summary, name="form-opb-summary"),
    path("<str:pk>/", form_detail, name="form-detail"),
    path("<str:pk>/generate-pdf/", generate_pdf, name="form-generate-pdf"),
    path("<str:pk>/download-pdf/", download_pdf, name="form-download-pdf"),
    path("<str:pk>/upload-signed/", upload_signed, name="form-upload-signed"),
    path("<str:pk>/submit-to-opb/", submit_to_opb, name="form-submit-to-opb"),
    path("<str:pk>/mark-viewed/", mark_viewed, name="form-mark-viewed"),
]
