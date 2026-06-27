"""
Server-side PDF generation for the procurement planning document.
Uses ReportLab to render the document_data JSON into a structured PDF.
"""
import io
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    PageBreak,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY


PAGE_W, PAGE_H = A4
MARGIN = 2 * cm

NAVY = colors.HexColor("#0f172a")
GOLD = colors.HexColor("#ca8a04")
LIGHT_GRAY = colors.HexColor("#f8fafc")
BORDER_COLOR = colors.HexColor("#e2e8f0")


def _styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "title",
            parent=base["Title"],
            fontSize=14,
            textColor=NAVY,
            spaceAfter=6,
            fontName="Times-Bold",
            alignment=TA_CENTER,
        ),
        "heading": ParagraphStyle(
            "heading",
            parent=base["Heading2"],
            fontSize=12,
            textColor=NAVY,
            spaceBefore=12,
            spaceAfter=4,
            fontName="Helvetica-Bold",
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["Normal"],
            fontSize=10,
            leading=14,
            spaceAfter=4,
            fontName="Times-Roman",
            alignment=TA_JUSTIFY,
        ),
        "label": ParagraphStyle(
            "label",
            parent=base["Normal"],
            fontSize=9,
            textColor=colors.HexColor("#475569"),
            fontName="Helvetica",
        ),
        "value": ParagraphStyle(
            "value",
            parent=base["Normal"],
            fontSize=10,
            fontName="Times-Roman",
        ),
        "footer": ParagraphStyle(
            "footer",
            parent=base["Normal"],
            fontSize=8,
            textColor=colors.HexColor("#94a3b8"),
            alignment=TA_CENTER,
        ),
        "small": ParagraphStyle(
            "small",
            parent=base["Normal"],
            fontSize=9,
            fontName="Helvetica",
        ),
    }


def _header_footer(canvas, doc, form, doc_data):
    canvas.saveState()
    w, h = A4

    # Header bar
    canvas.setFillColor(NAVY)
    canvas.rect(MARGIN, h - 1.5 * cm, w - 2 * MARGIN, 0.6 * cm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawString(MARGIN + 0.2 * cm, h - 1.1 * cm, "SHTOJCA 2 – Modeli i dokumentit për planifikimin e prokurimit")
    canvas.drawRightString(w - MARGIN - 0.2 * cm, h - 1.1 * cm, form.public_id)

    # Footer
    footer_text = doc_data.get("adresaFooter", "") if doc_data else ""
    canvas.setFillColor(colors.HexColor("#64748b"))
    canvas.setFont("Times-Italic", 8)
    canvas.drawCentredString(w / 2, 0.8 * cm, footer_text)
    canvas.setFont("Helvetica", 7)
    canvas.drawRightString(w - MARGIN, 0.8 * cm, f"Faqe {doc.page}")

    canvas.restoreState()


def _info_table(rows, styles):
    """Two-column label/value table for basic form info."""
    data = [[Paragraph(lbl, styles["label"]), Paragraph(str(val or "—"), styles["value"])]
            for lbl, val in rows]
    tbl = Table(data, colWidths=[5 * cm, 11 * cm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_GRAY),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, BORDER_COLOR),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    return tbl


def _generic_table(columns, rows_data, styles):
    """Render a list of dicts as a table."""
    if not rows_data:
        return Paragraph("(Nuk ka të dhëna)", styles["small"])

    headers = [Paragraph(c, styles["label"]) for c in columns]
    body_rows = []
    for row in rows_data:
        if isinstance(row, dict):
            cells = [Paragraph(str(row.get(k, "")), styles["small"]) for k in columns]
        else:
            cells = [Paragraph(str(v), styles["small"]) for v in row]
        body_rows.append(cells)

    tbl = Table([headers] + body_rows)
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, BORDER_COLOR),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
    ]))
    return tbl


def generate_form_pdf(form) -> bytes:
    """
    Generate a PDF for the given Form instance.
    Returns the raw bytes of the PDF.
    """
    buffer = io.BytesIO()
    doc_data = form.document_data or {}
    styles = _styles()

    def on_page(canvas, doc):
        _header_footer(canvas, doc, form, doc_data)

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=2 * cm,
        bottomMargin=1.5 * cm,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
    )

    story = []

    # --- Cover page title ---
    story.append(Spacer(1, 1 * cm))
    title = doc_data.get("titulliProjekti") or form.form_title or "Formular Prokurimi"
    story.append(Paragraph(title, styles["title"]))
    story.append(Spacer(1, 0.5 * cm))
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD))
    story.append(Spacer(1, 0.5 * cm))

    # Basic form info table
    story.append(
        _info_table(
            [
                ("ID Formulari", form.public_id),
                ("Emri", form.first_name),
                ("Mbiemri", form.last_name),
                ("Atësia", form.father_name),
                ("NID", form.nid),
                ("Datëlindja", str(form.birth_date) if form.birth_date else ""),
                ("Email", form.email),
                ("Telefon", form.phone),
                ("Adresa", form.address),
                ("Institucioni", form.institution.name if form.institution else ""),
                ("Objekti", doc_data.get("objektiProkurimit", "")),
                ("Kodi CPV", doc_data.get("kodiCPV", "")),
                ("Statusi", dict(form.STATUS_CHOICES).get(form.status, form.status)),
                ("Data e krijimit", form.created_at.strftime("%d/%m/%Y %H:%M") if form.created_at else ""),
            ],
            styles,
        )
    )
    story.append(Spacer(1, 0.5 * cm))
    story.append(PageBreak())

    # --- HYRJE ---
    story.append(Paragraph("HYRJE", styles["heading"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR))
    story.append(Spacer(1, 0.2 * cm))

    emertimi = doc_data.get("emertimiInst", "")
    objekti = doc_data.get("objektiProkurimit", "")
    cpv = doc_data.get("kodiCPV", "")
    panorama = doc_data.get("panoramaObjektivat", "")

    story.append(
        Paragraph(
            f"Ky relacion mbahet pranë autoritetit / entit kontraktor <b>{emertimi}</b>, "
            f"për procedurën me objekt <b>{objekti}</b>. "
            f"Kodi CPV: <b>{cpv}</b>.",
            styles["body"],
        )
    )
    if panorama:
        story.append(Spacer(1, 0.3 * cm))
        story.append(Paragraph(panorama, styles["body"]))

    # --- BAZA LIGJORE ---
    story.append(Spacer(1, 0.4 * cm))
    story.append(Paragraph("BAZA LIGJORE", styles["heading"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR))
    baza_rows = doc_data.get("bazaRows", [])
    if baza_rows:
        cols = ["Lloji akti", "Numri", "Data", "Titulli", "Konfirmo"]
        keys = ["zgjedhja", "numri", "data", "titulli", "konfirmo"]
        mapped = [{c: r.get(k, "") for c, k in zip(cols, keys)} for r in baza_rows]
        story.append(_generic_table(cols, mapped, styles))

    story.append(PageBreak())

    # --- I. NEVOJAT ---
    story.append(Paragraph("I. IDENTIFIKIMI I NEVOJAVE DHE SASIA", styles["heading"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR))
    story.append(Paragraph("Tabela nr. 1", styles["small"]))
    tab1 = doc_data.get("tab1Rows", [])
    if tab1:
        cols1 = ["Emërtimi", "Njësia", "Sasia", "Kodi CPV"]
        keys1 = ["emertimi", "njesia", "sasia", "cpv"]
        mapped1 = [{c: r.get(k, "") for c, k in zip(cols1, keys1)} for r in tab1]
        story.append(_generic_table(cols1, mapped1, styles))

    # --- II. SPECIFIKIMET ---
    story.append(Spacer(1, 0.4 * cm))
    story.append(Paragraph("II. HARTIMI I SPECIFIKIMEVE TEKNIKE", styles["heading"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR))
    story.append(Paragraph("Tabela nr. 2", styles["small"]))
    tab2 = doc_data.get("tab2Rows", [])
    if tab2:
        cols2 = ["Emërtimi", "Njësia", "Specifikimet", "Metodologjia", "Argumentimi"]
        keys2 = ["emertimi", "njesia", "specifikime", "metodologjia", "argumentimi"]
        mapped2 = [{c: r.get(k, "") for c, k in zip(cols2, keys2)} for r in tab2]
        story.append(_generic_table(cols2, mapped2, styles))

    story.append(PageBreak())

    # --- III. PËRLLOGARITJA ---
    story.append(Paragraph("III. PËRLLOGARITJA E VLERËS SË PARASHIKUAR", styles["heading"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR))

    for section_title, data_key, row_keys in [
        ("Gërma 'a' — Mallra", "mallraRows", ["manuali", "nrRendor", "emertimi", "njesia", "sasia", "cmimi", "vlera"]),
        ("Gërma 'a' — Punë publike", "puneRows", ["manuali", "nrRendor", "emertimi", "njesia", "sasia", "cmimi", "vlera"]),
        ("Gërma 'a' — Shërbime", "sherbimeRows", ["manuali", "nrRendor", "emertimi", "njesia", "sasia", "cmimi", "vlera"]),
        ("Gërma 'b'", "neni76BRows", ["emertimi", "njesia", "sasia", "oferta1", "oferta2", "oferta3", "cmimi", "vlera"]),
        ("Gërma 'c'", "neni76CRows", ["emertimi", "njesia", "sasia", "cmimi", "vlera"]),
        ("Gërma 'ç'", "neni76CcRows", ["burimi", "nrKodi", "emertimi", "njesia", "sasia", "cmimi", "vlera"]),
    ]:
        rows = doc_data.get(data_key, [])
        if rows:
            story.append(Spacer(1, 0.3 * cm))
            story.append(Paragraph(section_title, styles["small"]))
            mapped = [{k: r.get(k, "") for k in row_keys} for r in rows]
            story.append(_generic_table(row_keys, mapped, styles))

    # --- IV. GRAFIKU ---
    story.append(PageBreak())
    story.append(Paragraph("IV. GRAFIKU I LËVRIMIT", styles["heading"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR))
    grafiku = doc_data.get("grafiku", "")
    if grafiku:
        story.append(Paragraph(grafiku, styles["body"]))

    # --- KONTAKTI ---
    story.append(Spacer(1, 0.4 * cm))
    story.append(Paragraph("PERSONI I KONTAKTIT / KOORDINATORI", styles["heading"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR))
    story.append(
        _info_table(
            [
                ("Emër Mbiemër", doc_data.get("kontaktEmer", "")),
                ("E-mail", doc_data.get("kontaktEmail", "")),
                ("Nr. telefoni", doc_data.get("kontaktTel", "")),
            ],
            styles,
        )
    )

    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph("GRUPI I PUNËS / ZYRTARI PËRGJEGJËS", styles["heading"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR))
    grupi = doc_data.get("grupiPunes", "")
    if grupi:
        story.append(Paragraph(grupi, styles["body"]))

    # Build
    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    return buffer.getvalue()
