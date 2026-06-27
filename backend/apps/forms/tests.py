"""
Permission and workflow tests for the forms API.
Run with: python manage.py test apps.forms
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.institutions.models import Institution
from .models import Form


def make_institution():
    return Institution.objects.create(name="Test Institution")


def make_user(email, role, institution=None):
    u = User.objects.create_user(email=email, password="Pass1234!", full_name="Test User")
    u.role = role
    u.institution = institution
    u.save()
    return u


def make_form(user, institution=None):
    form = Form(
        created_by=user,
        institution=institution or user.institution,
        first_name="Test",
        last_name="Form",
        email="test@test.al",
        form_title="Test Form",
    )
    form.save()
    return form


class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.ak = make_user("ak@test.al", User.AK)

    def test_login_success(self):
        resp = self.client.post("/api/auth/login/", {"email": "ak@test.al", "password": "Pass1234!"})
        self.assertEqual(resp.status_code, 200)
        self.assertIn("user", resp.data)

    def test_login_wrong_password(self):
        resp = self.client.post("/api/auth/login/", {"email": "ak@test.al", "password": "wrong"})
        self.assertEqual(resp.status_code, 400)

    def test_me_unauthenticated(self):
        resp = self.client.get("/api/auth/me/")
        self.assertEqual(resp.status_code, 403)

    def test_me_authenticated(self):
        self.client.force_authenticate(user=self.ak)
        resp = self.client.get("/api/auth/me/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["user"]["role"], "aplikues")


class AKFormTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.inst = make_institution()
        self.ak = make_user("ak@test.al", User.AK, self.inst)
        self.ak2 = make_user("ak2@test.al", User.AK, self.inst)
        self.client.force_authenticate(user=self.ak)

    def test_ak_can_create_form(self):
        resp = self.client.post("/api/forms/", {
            "emri": "Arjana",
            "mbiemri": "Hoxha",
            "email": "a@test.al",
            "emerFormulari": "Formular Test",
        })
        self.assertEqual(resp.status_code, 201)
        self.assertIn("id", resp.data)

    def test_ak_cannot_see_other_ak_forms(self):
        # Form created by ak2
        form2 = make_form(self.ak2, self.inst)
        resp = self.client.get("/api/forms/")
        ids = [f["id"] for f in resp.data["results"]]
        self.assertNotIn(form2.public_id, ids)

    def test_ak_can_see_own_forms(self):
        form = make_form(self.ak, self.inst)
        resp = self.client.get("/api/forms/")
        ids = [f["id"] for f in resp.data["results"]]
        self.assertIn(form.public_id, ids)


class OPBTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.inst = make_institution()
        self.ak = make_user("ak@test.al", User.AK, self.inst)
        self.opb = make_user("opb@test.al", User.OPB)
        self.client.force_authenticate(user=self.opb)

    def test_opb_cannot_create_form(self):
        resp = self.client.post("/api/forms/", {"emri": "Test"})
        self.assertEqual(resp.status_code, 403)

    def test_opb_cannot_see_draft_forms(self):
        form = make_form(self.ak, self.inst)  # status = draft
        resp = self.client.get("/api/forms/")
        ids = [f["id"] for f in resp.data["results"]]
        self.assertNotIn(form.public_id, ids)

    def test_opb_sees_submitted_forms(self):
        form = make_form(self.ak, self.inst)
        form.status = Form.SUBMITTED_TO_OPB
        form.save()
        resp = self.client.get("/api/forms/")
        ids = [f["id"] for f in resp.data["results"]]
        self.assertIn(form.public_id, ids)

    def test_opb_cannot_generate_pdf(self):
        form = make_form(self.ak, self.inst)
        form.status = Form.SUBMITTED_TO_OPB
        form.save()
        resp = self.client.post(f"/api/forms/{form.public_id}/generate-pdf/")
        self.assertEqual(resp.status_code, 403)

    def test_opb_cannot_upload_signed(self):
        from io import BytesIO
        from django.core.files.uploadedfile import SimpleUploadedFile
        form = make_form(self.ak, self.inst)
        form.status = Form.SUBMITTED_TO_OPB
        form.save()
        fake_pdf = SimpleUploadedFile("test.pdf", b"%PDF-1.4", content_type="application/pdf")
        resp = self.client.post(
            f"/api/forms/{form.public_id}/upload-signed/",
            {"file": fake_pdf},
            format="multipart",
        )
        self.assertEqual(resp.status_code, 403)

    def test_opb_can_mark_viewed(self):
        form = make_form(self.ak, self.inst)
        form.status = Form.SUBMITTED_TO_OPB
        form.save()
        resp = self.client.post(f"/api/forms/{form.public_id}/mark-viewed/")
        self.assertEqual(resp.status_code, 200)

    def test_opb_is_new_flag(self):
        form = make_form(self.ak, self.inst)
        form.status = Form.SUBMITTED_TO_OPB
        form.save()
        resp = self.client.get(f"/api/forms/{form.public_id}/")
        self.assertEqual(resp.status_code, 200)
        # Form is new since OPB hasn't marked it viewed yet
        self.assertTrue(resp.data["isNewForMe"])


class AdminTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = make_user("admin@test.al", User.ADMIN)
        self.client.force_authenticate(user=self.admin)

    def test_admin_can_see_all_forms(self):
        inst = make_institution()
        ak = make_user("ak@test.al", User.AK, inst)
        make_form(ak, inst)
        resp = self.client.get("/api/forms/")
        self.assertEqual(resp.status_code, 200)
        self.assertGreater(resp.data["count"], 0)

    def test_admin_can_see_audit_logs(self):
        resp = self.client.get("/api/audit/")
        self.assertEqual(resp.status_code, 200)

    def test_non_admin_cannot_see_audit(self):
        ak = make_user("ak2@test.al", User.AK)
        self.client.force_authenticate(user=ak)
        resp = self.client.get("/api/audit/")
        self.assertEqual(resp.status_code, 403)

    def test_admin_can_create_user(self):
        resp = self.client.post("/api/users/", {
            "email": "new@test.al",
            "full_name": "New User",
            "role": "AK",
            "password": "Pass1234!",
        })
        self.assertEqual(resp.status_code, 201)


class DownloadPDFPermissionTests(TestCase):
    def setUp(self):
        self.inst = make_institution()
        self.ak = make_user("ak@test.al", User.AK, self.inst)
        self.opb = make_user("opb@test.al", User.OPB)

    def test_opb_cannot_download_pdf_of_draft(self):
        client = APIClient()
        client.force_authenticate(user=self.opb)
        form = make_form(self.ak, self.inst)  # draft
        resp = client.get(f"/api/forms/{form.public_id}/download-pdf/")
        # OPB cannot even see draft form → 404
        self.assertEqual(resp.status_code, 404)

    def test_ak_cannot_download_pdf_before_generation(self):
        client = APIClient()
        client.force_authenticate(user=self.ak)
        form = make_form(self.ak, self.inst)
        resp = client.get(f"/api/forms/{form.public_id}/download-pdf/")
        # PDF not generated → 404 (form exists but no PDF file)
        self.assertEqual(resp.status_code, 404)


class UploadSignedValidationTests(TestCase):
    def setUp(self):
        self.inst = make_institution()
        self.ak = make_user("ak@test.al", User.AK, self.inst)
        self.form = make_form(self.ak, self.inst)
        self.form.status = Form.PDF_GENERATED
        self.form.save()
        self.client = APIClient()
        self.client.force_authenticate(user=self.ak)

    def test_upload_rejects_non_pdf(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        txt = SimpleUploadedFile("doc.txt", b"not a pdf", content_type="text/plain")
        resp = self.client.post(
            f"/api/forms/{self.form.public_id}/upload-signed/",
            {"file": txt},
            format="multipart",
        )
        self.assertEqual(resp.status_code, 400)

    def test_upload_rejects_too_large(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        big = SimpleUploadedFile("big.pdf", b"%PDF-1.4" + b"x" * (11 * 1024 * 1024), content_type="application/pdf")
        resp = self.client.post(
            f"/api/forms/{self.form.public_id}/upload-signed/",
            {"file": big},
            format="multipart",
        )
        self.assertEqual(resp.status_code, 400)

    def test_upload_accepts_valid_pdf(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        pdf = SimpleUploadedFile("signed.pdf", b"%PDF-1.4 valid content", content_type="application/pdf")
        resp = self.client.post(
            f"/api/forms/{self.form.public_id}/upload-signed/",
            {"file": pdf},
            format="multipart",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["status"], "signed_uploaded")
