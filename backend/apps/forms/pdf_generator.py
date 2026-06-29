"""
PDF generation entry point.

The backend builds one canonical FormDoc JSON and sends it to the PyMuPDF
renderer. There is no template overlay or metadata fallback here, so preview
and download use the same document contract.
"""
from .document_builder import build_document
from .pdf_renderer import render_pdf


def generate_form_pdf(form) -> bytes:
    doc = build_document(form)
    return render_pdf(doc)
