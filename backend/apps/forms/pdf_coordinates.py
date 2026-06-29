"""
Coordinate maps for overlaying data on PDF templates with PyMuPDF.

Units : PDF points (72 pt = 1 inch).
Origin: top-left corner of each page.
A4    : width = 595 pt, height = 842 pt.

To calibrate:
  1. Open the template in a PDF viewer with coordinates shown, or run
     the calibrate helper (see pdf_generator.py --calibrate).
  2. Find the top-left corner of each field's text area.
  3. Update the x / y values below.

Field config keys:
  page      – 1-indexed page number in the template
  x, y      – baseline position of the text (pt from top-left)
  font      – PyMuPDF built-in: "helv" | "hebo" | "tiro" | "tibo" | "cour"
  size      – font size in points
  max_width – max allowed width; text wraps if exceeded
  wrap      – force textbox (multi-line) mode
  align     – "left" | "center" | "right"
  color     – RGB tuple 0–1, default (0, 0, 0)
"""

# Built-in font aliases
F_REG  = "helv"   # Helvetica regular
F_BOLD = "hebo"   # Helvetica bold
F_TR   = "tiro"   # Times Roman
F_TB   = "tibo"   # Times Bold


# ─── Punë Publike ─────────────────────────────────────────────────────────────
# Template: pdf_templates/pune_template.pdf
# ──────────────────────────────────────────────────────────────────────────────

PUNE_FIELDS: dict[str, dict] = {
    # ── Faqja 1 – kopertina ──────────────────────────────────────────────────
    "titulli": {
        "page": 1, "x": 125, "y": 390,
        "font": F_TB, "size": 13,
        "align": "center", "max_width": 345, "wrap": True,
    },
    "institucioni_cover": {
        "page": 1, "x": 125, "y": 430,
        "font": F_TR, "size": 11,
        "align": "center", "max_width": 345, "wrap": True,
    },

    # ── Faqja 2 – HYRJE ──────────────────────────────────────────────────────
    "llojiDokumentit": {
        "page": 2, "x": 188, "y": 155,
        "font": F_REG, "size": 10,
    },
    "bazaDokumentit": {
        "page": 2, "x": 88, "y": 200,
        "font": F_REG, "size": 10, "max_width": 420, "wrap": True,
    },
    "objekti": {
        "page": 2, "x": 88, "y": 260,
        "font": F_REG, "size": 10, "max_width": 420, "wrap": True,
    },
    "detaje": {
        "page": 2, "x": 88, "y": 330,
        "font": F_REG, "size": 10, "max_width": 420, "wrap": True,
    },
    "shenimeTregu": {
        "page": 2, "x": 88, "y": 440,
        "font": F_REG, "size": 10, "max_width": 420, "wrap": True,
    },

    # ── Faqja 4 – DOKUMENTACIONI (kondicionali) ───────────────────────────────
    "dokumentacionNdertim": {
        "page": 4, "x": 88, "y": 175,
        "font": F_REG, "size": 10, "max_width": 420, "wrap": True,
    },
    "dokumentacionSherbim": {
        "page": 4, "x": 88, "y": 295,
        "font": F_REG, "size": 10, "max_width": 420, "wrap": True,
    },

    # ── Faqja 5 – GRUPI I PUNËS (kondicionali) ───────────────────────────────
    "numriKopjeve": {
        "page": 5, "x": 188, "y": 175,
        "font": F_REG, "size": 10,
    },
    "grupiPunes": {
        "page": 5, "x": 88, "y": 215,
        "font": F_REG, "size": 10, "max_width": 420, "wrap": True,
    },
}

# Konfigurimi i tabelës kryesore (faqja 3) për Punë Publike
PUNE_TABLE_CFG: dict = {
    "page": 3,
    "header_y": 148,       # Y i baseline-it të header-it
    "row_start_y": 166,    # Y i baseline-it të rreshtit të parë
    "row_height": 20,      # lartësia e çdo rreshti (pt)
    "font": F_REG,
    "size": 8,
    # (field_key, x_start, col_width)
    "cols": [
        ("nrRendor", 68,   22),
        ("emertimi", 90,  115),
        ("njesia",   205,  30),
        ("sasia",    235,  30),
        ("oferta1",  265,  48),
        ("oferta2",  313,  48),
        ("oferta3",  361,  48),
        ("cmimi",    409,  44),
        ("vlera",    453,  74),
    ],
}


# ─── Mallra / Shërbime ────────────────────────────────────────────────────────
# Template: pdf_templates/mallra_template.pdf
# ──────────────────────────────────────────────────────────────────────────────

MALLRA_FIELDS: dict[str, dict] = {
    # ── Faqja 1 – kopertina ──────────────────────────────────────────────────
    "titulliProjekti": {
        "page": 1, "x": 125, "y": 360,
        "font": F_TB, "size": 13,
        "align": "center", "max_width": 345, "wrap": True,
    },
    "emertimiInst": {
        "page": 1, "x": 125, "y": 400,
        "font": F_TR, "size": 11,
        "align": "center", "max_width": 345, "wrap": True,
    },
    "public_id": {
        "page": 1, "x": 125, "y": 430,
        "font": F_REG, "size": 9,
        "align": "center", "max_width": 345,
    },

    # ── Faqja 2 – HYRJE ──────────────────────────────────────────────────────
    "objektiProkurimit": {
        "page": 2, "x": 188, "y": 190,
        "font": F_REG, "size": 10, "max_width": 280, "wrap": True,
    },
    "kodiCPV": {
        "page": 2, "x": 188, "y": 225,
        "font": F_REG, "size": 10,
    },
    "panoramaObjektivat": {
        "page": 2, "x": 68, "y": 280,
        "font": F_REG, "size": 10, "max_width": 459, "wrap": True,
    },

    # ── Faqja 4 – GRAFIKU & KONTAKTI ─────────────────────────────────────────
    "grafiku": {
        "page": 4, "x": 68, "y": 150,
        "font": F_REG, "size": 10, "max_width": 459, "wrap": True,
    },
    "kontaktEmer": {
        "page": 4, "x": 188, "y": 400,
        "font": F_REG, "size": 10,
    },
    "kontaktEmail": {
        "page": 4, "x": 188, "y": 425,
        "font": F_REG, "size": 10,
    },
    "kontaktTel": {
        "page": 4, "x": 188, "y": 450,
        "font": F_REG, "size": 10,
    },
    "grupiPunes": {
        "page": 4, "x": 68, "y": 510,
        "font": F_REG, "size": 10, "max_width": 459, "wrap": True,
    },
}

# Konfigurimi i tabelave për Mallra/Shërbime
MALLRA_TABLE_CFGS: dict[str, dict] = {
    # Tabela 1 – nevojat (faqja 3)
    "tab1Rows": {
        "page": 3,
        "header_y": 140,
        "row_start_y": 158,
        "row_height": 18,
        "font": F_REG,
        "size": 9,
        "cols": [
            ("emertimi", 68,  140),
            ("njesia",   208,  60),
            ("sasia",    268,  50),
            ("cpv",      318, 209),
        ],
    },
    # Tabela 2 – specifikimet teknike (faqja 3, pas tabelës 1)
    "tab2Rows": {
        "page": 3,
        "header_y": 400,
        "row_start_y": 418,
        "row_height": 18,
        "font": F_REG,
        "size": 9,
        "cols": [
            ("emertimi",     68,  100),
            ("njesia",       168,  50),
            ("specifikime",  218, 110),
            ("metodologjia", 328,  80),
            ("argumentimi",  408, 119),
        ],
    },
    # Tabela Mallra – gërma 'a' (faqja 4 ose 3 zona poshtë)
    "mallraRows": {
        "page": 4,
        "header_y": 148,
        "row_start_y": 166,
        "row_height": 18,
        "font": F_REG,
        "size": 9,
        "cols": [
            ("manuali",   68,  40),
            ("nrRendor",  108, 25),
            ("emertimi",  133, 110),
            ("njesia",    243,  40),
            ("sasia",     283,  40),
            ("cmimi",     323,  60),
            ("vlera",     383, 144),
        ],
    },
    "sherbimeRows": {
        "page": 4,
        "header_y": 148,
        "row_start_y": 166,
        "row_height": 18,
        "font": F_REG,
        "size": 9,
        "cols": [
            ("manuali",   68,  40),
            ("nrRendor",  108, 25),
            ("emertimi",  133, 110),
            ("njesia",    243,  40),
            ("sasia",     283,  40),
            ("cmimi",     323,  60),
            ("vlera",     383, 144),
        ],
    },
}


# Dispatch map
COORDINATES: dict[str, dict] = {
    "pune":             PUNE_FIELDS,
    "mallra-sherbime":  MALLRA_FIELDS,
}
