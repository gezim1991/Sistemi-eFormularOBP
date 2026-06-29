"""
Document Builder — Python paralel me src/lib/document-builder.ts.

Prodhuon të njëjtën strukturë FormDoc si TypeScript builder-i.
Çdo ndryshim i strukturës duhet të reflektohet edhe në dosjen TS.

build_pune_doc(form, d)   → dict   (Punë Publike)
build_mallra_doc(form, d) → dict   (Mallra / Shërbime)
"""
from __future__ import annotations


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _parse_num(v) -> float:
    if not v:
        return 0.0
    try:
        return float(str(v).replace(" ", "").replace(",", "."))
    except (ValueError, TypeError):
        return 0.0


def _money(n: float) -> str:
    """Albanian format: 1.234,56 — trailing zeros removed."""
    if n <= 0:
        return ""
    rounded = round(n, 2)
    # Format with comma as thousands, period as decimal → then swap
    s = f"{rounded:,.2f}"          # "1,234.56"  (Python default)
    s = s.replace(",", "X").replace(".", ",").replace("X", ".")  # "1.234,56"
    s = s.rstrip("0").rstrip(",")  # remove trailing zeros
    return s


def _t(v: str) -> dict:
    return {"k": "t", "v": v}


def _f(v, empty: bool = False) -> dict:
    val = str(v or "").strip()
    return {"k": "f", "v": val, "empty": empty or not val}


def _has_content(row: dict) -> bool:
    skip = {"id", "_sourceId", "vlera", "_vlera"}
    return any(
        k not in skip and str(v or "").strip()
        for k, v in row.items()
    )


PUNE_LEGAL_BULLETS = [
    "Ligjin nr. 162, datë 23.12.2020 “Për prokurimin publik”, i ndryshuar;",
    "Vendimin nr. 285, datë 19.05.2021 të Këshillit të Ministrave, “Për miratimin e Rregullave të Prokurimit Publik”, i ndryshuar;",
    "Vendimin nr. 531, datë 07.09.2023 të Këshillit të Ministrave, për krijimin e shoqërisë aksionare shtetërore “Operatori i Blerjeve të Përqendruara”, sh.a.;",
    "VKM nr. 216, datë 13.4.2023 për krijimin dhe funksionimin e sistemit të integruar për informatizimin e manualit të çmimeve për zërat e punimeve në ndërtim;",
]

MALLRA_LEGAL_BULLETS = [
    "Ligjin nr. 162, datë 23.12.2020 “Për prokurimin publik”, i ndryshuar;",
    "Vendimin nr. 285, datë 19.05.2021 të Këshillit të Ministrave, “Për miratimin e Rregullave të Prokurimit Publik”, i ndryshuar;",
    "Vendimin nr. 531, datë 07.09.2023 të Këshillit të Ministrave, “Për krijimin e shoqërisë aksionare shtetërore “Operatori i Blerjeve të Përqëndruara”, sh.a.”, i ndryshuar",
]


# ─── Punë Publike Builder ─────────────────────────────────────────────────────

def build_document(form) -> dict:
    """Build the canonical FormDoc JSON for preview and PDF rendering."""
    d = form.document_data or {}
    ftype = d.get("formType") or "mallra-sherbime"
    if ftype == "pune":
        return build_pune_doc(form, d)
    return build_mallra_doc(form, d)


def build_pune_doc(form, d: dict) -> dict:
    """
    Prodhon FormDoc (dict) identik me buildPuneDoc() në TypeScript.
    """
    rows = d.get("rows") or []

    # Llogarit avg dhe total për çdo rresht
    computed_rows = []
    total_table = 0.0
    for i, row in enumerate(rows):
        vals = [
            _parse_num(row.get("oferta1")),
            _parse_num(row.get("oferta2")),
            _parse_num(row.get("oferta3")),
        ]
        vals = [v for v in vals if v > 0]
        avg = sum(vals) / len(vals) if vals else 0.0
        tot = avg * _parse_num(row.get("sasia"))
        total_table += tot
        computed_rows.append({
            **row,
            "_nr":    str(i + 1),
            "_avg":   _money(avg),
            "_total": _money(tot),
        })

    has_p4 = bool((d.get("dokumentacionNdertim") or "").strip()) or \
             bool((d.get("dokumentacionSherbim") or "").strip())
    has_p5 = bool((d.get("numriKopjeve") or "").strip()) or \
             bool((d.get("grupiPunes") or "").strip())

    TABLE_COLS = [
        {"key": "_nr",      "header": "Nr.",                  "align": "c", "pct": 4},
        {"key": "emertimi", "header": "Emërtimi i artikullit","align": "l", "pct": 24},
        {"key": "njesia",   "header": "Njësia",               "align": "c", "pct": 7},
        {"key": "sasia",    "header": "Sasia",                "align": "r", "pct": 7},
        {"key": "oferta1",  "header": "Oferta 1",             "align": "r", "pct": 9},
        {"key": "oferta2",  "header": "Oferta 2",             "align": "r", "pct": 9},
        {"key": "oferta3",  "header": "Oferta 3",             "align": "r", "pct": 9},
        {"key": "_avg",     "header": "Çmimi mesatar",        "align": "r", "pct": 10},
        {"key": "_total",   "header": "Vlera totale",         "align": "r", "pct": 11},
    ]

    adresa = (
        (form.address or "").strip()
        or (form.institution.name if form.institution else "")
        or d.get("adresaFooter", "")
    )

    pages = []

    # ── Faqja 1 — Kopertinë ──────────────────────────────────────────────
    pages.append({"nodes": [
        {"type": "shtojca",
         "text": "SHTOJCA 3 – Modeli i dokumentit për planifikimin e prokurimit për punë publike",
         "footnoteRef": "1"},
        {"type": "big_title", "text": d.get("titulli") or form.form_title or ""},
        {"type": "footnote",
         "text": "¹ Ky dokument i bashkëlidhet kërkësës standarde sipas Shtojcës 1"},
    ]})

    # ── Faqja 2 — Hyrje, Baza ligjore, Identifikimi ──────────────────────
    pages.append({"nodes": [
        {"type": "h2", "title": "HYRJE"},
        {"type": "para", "segs": [
            _t("Ky "),
            _f(d.get("llojiDokumentit")),
            _t(" mbahet pranë autoritetit / entit kontraktor, për realizimin e procedurës "
               "prokurimit dhe përllogaritjen e vlerës së prokurimit për procedurën me objekt "),
            _f(d.get("objekti")),
            _t("."),
        ]},
        {"type": "h2", "title": "BAZA LIGJORE"},
        {"type": "para", "segs": [
            _t("Ky "),
            _f(d.get("bazaDokumentit")),
            _t(" u hartua bazuar në:"),
        ]},
        {"type": "bullets", "items": PUNE_LEGAL_BULLETS},
        {"type": "h2",
         "title": "IDENTIFIKIMI I NEVOJAVE PËR NDËRTIM / RIKONSTRUKSION / SHËRBIM"},
        {"type": "text",
         "value": "> DOKUMENTACIONI I NEVOJSHËM PËR PROCEDURË PROKURIMI NDËRTIM / RIKONSTRUKSION",
         "bold": True},
        {"type": "text", "value": d.get("detaje") or ""},
    ]})

    # ── Faqja 3 — Përllogaritja, Tabela ─────────────────────────────────
    p3 = [
        {"type": "h2", "title": "PËRLLOGARITJA E VLERës SË PROKURIMIT"},
        {"type": "text",
         "value": "Në rast se specifikimet teknike hartohen bazuar në një manual standard apo "
                  "katalog, ato duhet të jenë në përputhje të plotë me këta të fundit.",
         "italic": True},
    ]
    if (d.get("shenimeTregu") or "").strip():
        p3.append({"type": "text", "value": d["shenimeTregu"]})
    p3.append({"type": "text",
               "value": "Shembull – Përllogaritja sipas germës “b” të nenit 76",
               "italic": True})
    total_row = (
        ["", "", "", "", "", "", "", "Vlera totale pa TVSH", _money(total_table)]
        if total_table > 0 else None
    )
    p3.append({
        "type": "table",
        "cols": TABLE_COLS,
        "rows": computed_rows,
        "total_row": total_row,
    })
    pages.append({"nodes": p3})

    # ── Faqja 4 — Dokumentacioni (kondicionali) ──────────────────────────
    if has_p4:
        pages.append({"nodes": [
            {"type": "h2",
             "title": "DOKUMENTACIONI I NEVOJSHËM PËR PROCEDURË PROKURIMI NDËRTIM"},
            {"type": "text",
             "value": "- Dokumentacioni teknik, i cili përfshin Projektet, Relacionet teknike, "
                      "Specifikimet teknike përkatëse.",
             "italic": True},
            {"type": "text", "value": d.get("dokumentacionNdertim") or "", "pre": True},
            {"type": "h2",
             "title": "DOKUMENTACIONI I NEVOJSHËM PËR PROCEDURË PROKURIMI SHËRBIM"},
            {"type": "text",
             "value": "- Dokumentacioni teknik, i cili përfshin Detërë Projektimi, "
                      "Terma Reference etj.",
             "italic": True},
            {"type": "text", "value": d.get("dokumentacionSherbim") or "", "pre": True},
        ]})

    # ── Faqja 5 — Grupi i punës (kondicionali) ───────────────────────────
    if has_p5:
        pages.append({"nodes": [
            {"type": "separator"},
            {"type": "para", "segs": [
                _t("Ky relacion u hartua në "),
                _f(d.get("numriKopjeve")),
                _t(" kopje të barazvlefshme dhe pasi u lexua, është nënshkruar nga "),
                _f(d.get("grupiPunes")),
                _t("."),
            ]},
            {
                "type": "signature_block",
                "title": "GRUPI I PUN\u00cbS / ZYRTARI P\u00cbRGJEGJ\u00cbS",
                "value": d.get("grupiPunes") or "",
            },
        ]})

    return {"adresa": adresa, "pages": pages}


# ─── Mallra / Shërbime Builder ────────────────────────────────────────────────

def build_mallra_doc(form, d: dict) -> dict:
    """
    Prodhon FormDoc (dict) identik me buildMallraDoc() në TypeScript.
    """
    adresa = (
        (form.address or "").strip()
        or (form.institution.name if form.institution else "")
        or d.get("adresaFooter", "")
    )
    inst = (form.institution.name if form.institution else "") or d.get("emertimiInst", "")

    def value_rows(rows: list) -> tuple[list, float]:
        visible = [r for r in rows if _has_content(r)]
        total = sum(_parse_num(r.get("sasia")) * _parse_num(r.get("cmimi")) for r in visible)
        computed = [
            {**r, "_vlera": _money(_parse_num(r.get("sasia")) * _parse_num(r.get("cmimi")))}
            for r in visible
        ]
        return computed, total

    VALUE_COLS = [
        {"key": "manuali",  "header": "Manuali"},
        {"key": "nrRendor", "header": "Nr. Rendor"},
        {"key": "emertimi", "header": "Emërtimi"},
        {"key": "njesia",   "header": "Njësia"},
        {"key": "sasia",    "header": "Sasia",         "align": "r"},
        {"key": "cmimi",    "header": "Çmimi/njësi",  "align": "r"},
        {"key": "_vlera",   "header": "Vlera totale",  "align": "r"},
    ]

    pages = []

    # ── Faqja 1 — Kopertinë ──────────────────────────────────────────────
    pages.append({"nodes": [
        {"type": "shtojca",
         "text": "SHTOJCA 2 – Modeli i dokumentit për planifikimin e prokurimit",
         "footnoteRef": "1"},
        {"type": "big_title", "text": d.get("titulliProjekti") or form.form_title or ""},
    ]})

    # ── Faqja 2 — Hyrje ──────────────────────────────────────────────────
    p2 = [
        {"type": "h2", "title": "HYRJE"},
        {"type": "para", "segs": [
            _t("Ky relacion, mbahet pranë autoritetit / enti kontraktor "),
            _f(inst),
            _t(", për identifikimin e nevojave, hartimin e specifikimeve teknike dhe "
               "përllogaritjen e vlerës së prokurimit për procedurën me objekt "),
            _f(d.get("objektiProkurimit")),
            _t(". Kodi (CPV) sipas fjalorit të pëbashkët të prokurimit: "),
            _f(d.get("kodiCPV")),
            _t("."),
        ]},
    ]
    if (d.get("panoramaObjektivat") or "").strip():
        p2.append({"type": "text", "value": d["panoramaObjektivat"]})
    pages.append({"nodes": p2})

    # ── Faqja 3 — Baza ligjore ────────────────────────────────────────────
    pages.append({"nodes": [
        {"type": "h2", "title": "BAZA LIGJORE"},
        {"type": "text", "value": "Ky relacion u hartua bazuar në:"},
        {"type": "bullets", "items": MALLRA_LEGAL_BULLETS},
        {"type": "table",
         "cols": [
             {"key": "zgjedhja", "header": "Lloji i aktit"},
             {"key": "numri",    "header": "Numri"},
             {"key": "data",     "header": "Data"},
             {"key": "titulli",  "header": "Titulli"},
             {"key": "konfirmo", "header": "Konfirmo"},
         ],
         "rows": d.get("bazaRows") or []},
    ]})

    # ── Faqja 4 — I. Identifikimi ─────────────────────────────────────────
    pages.append({"nodes": [
        {"type": "h2", "title": "I. IDENTIFIKIMI I NEVOJAVE DHE SASIA"},
        {"type": "text", "value": "Tabela nr. 1", "italic": True},
        {"type": "table",
         "cols": [
             {"key": "emertimi", "header": "Emërtimi i artikullit"},
             {"key": "njesia",   "header": "Njësia"},
             {"key": "sasia",    "header": "Sasia", "align": "r"},
             {"key": "cpv",      "header": "Kodi CPV"},
         ],
         "rows": [r for r in (d.get("tab1Rows") or []) if _has_content(r)]},
    ]})

    # ── Faqja 5 — II. Specifikimet ────────────────────────────────────────
    pages.append({"nodes": [
        {"type": "h2", "title": "II. HARTIMI I SPECIFIKIMEVE TEKNIKE"},
        {"type": "text", "value": "Tabela nr. 2", "italic": True},
        {"type": "table",
         "cols": [
             {"key": "emertimi",     "header": "Emërtimi i artikullit"},
             {"key": "njesia",       "header": "Njësia"},
             {"key": "specifikime",  "header": "Specifikimet teknike"},
             {"key": "metodologjia", "header": "Metodologjia"},
             {"key": "argumentimi",  "header": "Argumentimi teknik"},
         ],
         "rows": [r for r in (d.get("tab2Rows") or []) if _has_content(r)]},
    ]})

    # ── Faqja 6 — III. Përllogaritja ──────────────────────────────────────
    p6 = [{"type": "h2", "title": "III. PËRLLOGARITJA E VLERës SË PARASHIKUAR"}]

    for title, key in [
        ("1.1. Manuale / katalogë për mallra",       "mallraRows"),
        ("1.2. Manuale / katalogë për punë publike", "puneRows"),
        ("1.3. Manuale / katalogë për shërbime",  "sherbimeRows"),
    ]:
        rws = [r for r in (d.get(key) or []) if _has_content(r)]
        if rws:
            computed, total = value_rows(rws)
            p6.append({"type": "h3", "title": title})
            p6.append({
                "type": "table", "cols": VALUE_COLS, "rows": computed,
                "total_row": ["", "", "", "", "", "Totali (pa TVSH)", _money(total)] if total > 0 else None,
            })

    neni76b = [r for r in (d.get("neni76BRows") or []) if _has_content(r)]
    if neni76b:
        p6.append({"type": "h3",
                   "title": "Përllogaritja sipas germës “b” të nenit 76"})
        p6.append({"type": "table",
                   "cols": [
                       {"key": "emertimi", "header": "Emërtimi"},
                       {"key": "njesia",   "header": "Njësia"},
                       {"key": "sasia",    "header": "Sasia",           "align": "r"},
                       {"key": "oferta1",  "header": "Oferta 1",        "align": "r"},
                       {"key": "oferta2",  "header": "Oferta 2",        "align": "r"},
                       {"key": "oferta3",  "header": "Oferta 3",        "align": "r"},
                       {"key": "cmimi",    "header": "Çmimi mes./njësi", "align": "r"},
                   ],
                   "rows": neni76b})

    neni76c = [r for r in (d.get("neni76CRows") or []) if _has_content(r)]
    if neni76c:
        computed, total = value_rows(neni76c)
        p6.append({"type": "h3",
                   "title": "Përllogaritja sipas germës “c” të nenit 76"})
        p6.append({"type": "table", "cols": VALUE_COLS, "rows": computed,
                   "total_row": ["", "", "", "", "", "Totali (pa TVSH)", _money(total)] if total > 0 else None})

    neni76cc = [r for r in (d.get("neni76CcRows") or []) if _has_content(r)]
    if neni76cc:
        p6.append({"type": "h3",
                   "title": "Përllogaritja sipas germës “ç” të nenit 76"})
        p6.append({"type": "table",
                   "cols": [
                       {"key": "burimi",   "header": "Burimi"},
                       {"key": "nrKodi",   "header": "Nr./Kodi"},
                       {"key": "emertimi", "header": "Emërtimi"},
                       {"key": "njesia",   "header": "Njësia"},
                       {"key": "sasia",    "header": "Sasia",          "align": "r"},
                       {"key": "cmimi",    "header": "Çmimi/njësi", "align": "r"},
                   ],
                   "rows": neni76cc})

    pages.append({"nodes": p6})

    # ── Faqja 7 — IV. Grafiku ─────────────────────────────────────────────
    p7 = [
        {"type": "h2", "title": "IV. GRAFIKU I LËVRIMIT"},
        {"type": "text",
         "value": "Autoriteti / enti kontraktor duhet të përcaktojë grafikun e lëvrimit."},
    ]
    if (d.get("grafiku") or "").strip():
        p7.append({"type": "text", "value": d["grafiku"]})
    if d.get("grafikuFileName"):
        p7.append({"type": "text", "value": "Bashkëlidhur: " + d["grafikuFileName"],
                   "italic": True})
    pages.append({"nodes": p7})

    # ── Faqja 8 — Kontakti, Grupi i punës ────────────────────────────────
    p8 = [
        {"type": "h2", "title": "PERSONI I KONTAKTIT / KOORDINATORI"},
        {"type": "kv_table", "rows": [
            {"label": "Emër Mbiemr",  "value": d.get("kontaktEmer") or ""},
            {"label": "E-mail",            "value": d.get("kontaktEmail") or ""},
            {"label": "Nr. telefoni",      "value": d.get("kontaktTel") or ""},
        ]},
    ]
    if (d.get("grupiPunes") or "").strip():
        p8.append({
            "type": "signature_block",
            "title": "GRUPI I PUN\u00cbS / ZYRTARI P\u00cbRGJEGJ\u00cbS",
            "value": d["grupiPunes"],
        })
    pages.append({"nodes": p8})

    return {"adresa": adresa, "pages": pages}

