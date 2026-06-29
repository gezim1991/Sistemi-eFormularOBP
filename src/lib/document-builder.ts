/**
 * Document Builder — BURIMI I VETËM i logjikës së dokumentit.
 *
 * Kjo është e njëjta logjikë e implementuar edhe në
 * backend/apps/forms/document_builder.py — çdo ndryshim duhet
 * të reflektohet në të dyja dosjet.
 *
 * Builders:
 *   buildPuneDoc(data, adresa)   → FormDoc  (Punë Publike)
 *   buildMallraDoc(data, adresa) → FormDoc  (Mallra / Shërbime)
 */

import type {
  FormDoc,
  DocPage,
  DocNode,
  Col,
  Seg,
} from "@/lib/document-types"
import type {
  FormularDocumentData,
  PunePublikeDocumentData,
} from "@/lib/mock-data"

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseNum(v?: string): number {
  const n = Number(String(v ?? "").replace(/\s/g, "").replace(",", "."))
  return Number.isFinite(n) ? n : 0
}

function money(n: number): string {
  if (n <= 0) return ""
  return n.toLocaleString("sq-AL", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function field(v: string | undefined, empty = false): Seg {
  const val = (v ?? "").trim()
  return { k: "f", v: val, empty: empty || !val }
}

function t(v: string): Seg {
  return { k: "t", v }
}

const PUNE_LEGAL_BULLETS = [
  "Ligjin nr. 162, datë 23.12.2020 “Për prokurimin publik”, i ndryshuar;",
  "Vendimin nr. 285, datë 19.05.2021 të Këshillit të Ministrave, “Për miratimin e Rregullave të Prokurimit Publik”, i ndryshuar;",
  "Vendimin nr. 531, datë 07.09.2023 të Këshillit të Ministrave, për krijimin e shoqërisë aksionare shtetërore “Operatori i Blerjeve të Përqendruara”, sh.a.;",
  "VKM nr. 216, datë 13.4.2023 për krijimin dhe funksionimin e sistemit të integruar për informatizimin e manualit të çmimeve për zërat e punimeve në ndërtim;",
]

const MALLRA_LEGAL_BULLETS = [
  "Ligjin nr. 162, datë 23.12.2020 “Për prokurimin publik”, i ndryshuar;",
  "Vendimin nr. 285, datë 19.05.2021 të Këshillit të Ministrave, “Për miratimin e Rregullave të Prokurimit Publik”, i ndryshuar;",
  "Vendimin nr. 531, datë 07.09.2023 të Këshillit të Ministrave, “Për krijimin e shoqërisë aksionare shtetërore “Operatori i Blerjeve të Përqëndruara”, sh.a.”, i ndryshuar",
]

// ─── Punë Publike Builder ────────────────────────────────────────────────────

export function buildPuneDoc(
  doc: Partial<PunePublikeDocumentData>,
  adresa?: string,
): FormDoc {
  const d: PunePublikeDocumentData = {
    formType: "pune",
    titulli: "",
    llojiDokumentit: "",
    objekti: "",
    bazaDokumentit: "",
    detaje: "",
    shenimeTregu: "",
    dokumentacionNdertim: "",
    dokumentacionSherbim: "",
    numriKopjeve: "",
    grupiPunes: "",
    rows: [],
    ...doc,
  }

  const rows = (d.rows ?? []) as Array<Record<string, string>>

  // Llogarit avg dhe total për çdo rresht
  type ComputedRow = Record<string, string> & { _nr: string; _avg: string; _total: string }

  const computedRows: ComputedRow[] = rows.map((row, i) => {
    const vals = [parseNum(row.oferta1), parseNum(row.oferta2), parseNum(row.oferta3)].filter(
      (v) => v > 0,
    )
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    const tot = avg * parseNum(row.sasia)
    return {
      ...row,
      _nr: String(i + 1),
      _avg: avg > 0 ? money(avg) : "",
      _total: tot > 0 ? money(tot) : "",
    } as ComputedRow
  })

  const totalTable = rows.reduce((sum, row) => {
    const vals = [parseNum(row.oferta1), parseNum(row.oferta2), parseNum(row.oferta3)].filter(
      (v) => v > 0,
    )
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    return sum + avg * parseNum(row.sasia)
  }, 0)

  const hasP4 = Boolean(d.dokumentacionNdertim?.trim()) || Boolean(d.dokumentacionSherbim?.trim())
  const hasP5 = Boolean(d.numriKopjeve?.trim()) || Boolean(d.grupiPunes?.trim())

  const TABLE_COLS: Col[] = [
    { key: "_nr",     header: "Nr.",                 align: "c", pct: 4 },
    { key: "emertimi",header: "Emërtimi i artikullit", align: "l", pct: 24 },
    { key: "njesia",  header: "Njësia",               align: "c", pct: 7 },
    { key: "sasia",   header: "Sasia",                align: "r", pct: 7 },
    { key: "oferta1", header: "Oferta 1",             align: "r", pct: 9 },
    { key: "oferta2", header: "Oferta 2",             align: "r", pct: 9 },
    { key: "oferta3", header: "Oferta 3",             align: "r", pct: 9 },
    { key: "_avg",    header: "Çmimi mesatar",        align: "r", pct: 10 },
    { key: "_total",  header: "Vlera totale",         align: "r", pct: 11 },
  ]

  const pages: DocPage[] = []

  // ── Faqja 1 — Kopertinë ─────────────────────────────────────────────────
  pages.push({
    nodes: [
      {
        type: "shtojca",
        text: "SHTOJCA 3 – Modeli i dokumentit për planifikimin e prokurimit për punë publike",
        footnoteRef: "1",
      },
      { type: "big_title", text: d.titulli || "" },
      {
        type: "footnote",
        text: "¹ Ky dokument i bashkëlidhet kërkësîs standarde sipas Shtojcës 1",
      },
    ],
  })

  // ── Faqja 2 — Hyrje, Baza ligjore, Identifikimi ─────────────────────────
  pages.push({
    nodes: [
      { type: "h2", title: "HYRJE" },
      {
        type: "para",
        segs: [
          t("Ky "),
          field(d.llojiDokumentit),
          t(" mbahet pranë autoritetit / entit kontraktor, për realizimin e procedurës prokurimit dhe përllogaritjen e vlerës së prokurimit për procedurën me objekt "),
          field(d.objekti),
          t("."),
        ],
      },
      { type: "h2", title: "BAZA LIGJORE" },
      {
        type: "para",
        segs: [
          t("Ky "),
          field(d.bazaDokumentit),
          t(" u hartua bazuar në:"),
        ],
      },
      { type: "bullets", items: PUNE_LEGAL_BULLETS },
      {
        type: "h2",
        title: "IDENTIFIKIMI I NEVOJAVE PËR NDËRTIM / RIKONSTRUKSION / SHËRBIM",
      },
      {
        type: "text",
        value:
          "> DOKUMENTACIONI I NEVOJSHËM PËR PROCEDURË PROKURIMI NDËRTIM / RIKONSTRUKSION",
        bold: true,
      },
      { type: "text", value: d.detaje || "" },
    ],
  })

  // ── Faqja 3 — Përllogaritja, Tabela ─────────────────────────────────────
  const p3Nodes: DocNode[] = [
    { type: "h2", title: "PËRLLOGARITJA E VLERës SË PROKURIMIT" },
    {
      type: "text",
      value:
        "Në rast se specifikimet teknike hartohen bazuar në një manual standard apo katalog, ato duhet të jenë në përputhje të plotë me këta të fundit.",
      italic: true,
    },
  ]
  if (d.shenimeTregu?.trim()) {
    p3Nodes.push({ type: "text", value: d.shenimeTregu })
  }
  p3Nodes.push({
    type: "text",
    value: "Shembull – Përllogaritja sipas germës “b” të nenit 76",
    italic: true,
  })
  p3Nodes.push({
    type: "table",
    cols: TABLE_COLS,
    rows: computedRows,
    total_row:
      totalTable > 0
        ? ["", "", "", "", "", "", "", "Vlera totale pa TVSH", money(totalTable)]
        : undefined,
  })
  pages.push({ nodes: p3Nodes })

  // ── Faqja 4 — Dokumentacioni (kondicionali) ──────────────────────────────
  if (hasP4) {
    pages.push({
      nodes: [
        {
          type: "h2",
          title: "DOKUMENTACIONI I NEVOJSHËM PËR PROCEDURË PROKURIMI NDËRTIM",
        },
        {
          type: "text",
          value:
            "- Dokumentacioni teknik, i cili përfshin Projektet, Relacionet teknike, Specifikimet teknike përkatëse.",
          italic: true,
        },
        { type: "text", value: d.dokumentacionNdertim || "", pre: true },
        {
          type: "h2",
          title: "DOKUMENTACIONI I NEVOJSHËM PËR PROCEDURË PROKURIMI SHËRBIM",
        },
        {
          type: "text",
          value:
            "- Dokumentacioni teknik, i cili përfshin Detërë Projektimi, Terma Reference etj.",
          italic: true,
        },
        { type: "text", value: d.dokumentacionSherbim || "", pre: true },
      ],
    })
  }

  // ── Faqja 5 — Grupi i punës (kondicionali) ───────────────────────────────
  if (hasP5) {
    pages.push({
      nodes: [
        { type: "separator" },
        {
          type: "para",
          segs: [
            t("Ky relacion u hartua në "),
            field(d.numriKopjeve),
            t(" kopje të barazvlefshme dhe pasi u lexua, është nënshkruar nga "),
            field(d.grupiPunes),
            t("."),
          ],
        },
        {
          type: "signature_block",
          title: "GRUPI I PUN\u00cbS / ZYRTARI P\u00cbRGJEGJ\u00cbS",
          value: d.grupiPunes || "",
        },
      ],
    })
  }

  return { adresa: adresa || "", pages }
}

// ─── Mallra / Shërbime Builder ───────────────────────────────────────────────

export function buildMallraDoc(
  doc: Partial<FormularDocumentData> | undefined,
  adresa?: string,
): FormDoc {
  const d: FormularDocumentData = {
    adresaFooter: "",
    titulliProjekti: "",
    emertimiInst: "",
    objektiProkurimit: "",
    kodiCPV: "",
    panoramaObjektivat: "",
    bazaRows: [],
    tab1Rows: [],
    tab2Rows: [],
    mallraRows: [],
    puneRows: [],
    sherbimeRows: [],
    neni76BRows: [],
    neni76CRows: [],
    neni76CcRows: [],
    grafiku: "",
    grafikuFileName: "",
    kontaktEmer: "",
    kontaktEmail: "",
    kontaktTel: "",
    grupiPunes: "",
    ...(doc ?? {}),
  }

  function hasContent(row: Record<string, string>) {
    return Object.entries(row).some(
      ([k, v]) => !["id", "_sourceId", "vlera"].includes(k) && String(v ?? "").trim().length > 0,
    )
  }

  function valueRows(rows: Record<string, string>[]) {
    const visible = rows.filter(hasContent)
    const total = visible.reduce(
      (acc, r) => acc + parseNum(r.sasia) * parseNum(r.cmimi),
      0,
    )
    const computed = visible.map((r) => ({
      ...r,
      _vlera: money(parseNum(r.sasia) * parseNum(r.cmimi)),
    }))
    return { rows: computed, total }
  }

  const VALUE_COLS: Col[] = [
    { key: "manuali",  header: "Manuali" },
    { key: "nrRendor", header: "Nr. Rendor" },
    { key: "emertimi", header: "Emërtimi" },
    { key: "njesia",   header: "Njësia" },
    { key: "sasia",    header: "Sasia",        align: "r" },
    { key: "cmimi",    header: "Çmimi/njësi", align: "r" },
    { key: "_vlera",   header: "Vlera totale", align: "r" },
  ]

  const pages: DocPage[] = []

  // ── Faqja 1 — Kopertinë ─────────────────────────────────────────────────
  pages.push({
    nodes: [
      {
        type: "shtojca",
        text: "SHTOJCA 2 – Modeli i dokumentit për planifikimin e prokurimit",
        footnoteRef: "1",
      },
      { type: "big_title", text: d.titulliProjekti || "" },
    ],
  })

  // ── Faqja 2 — Hyrje ─────────────────────────────────────────────────────
  const p2Nodes: DocNode[] = [
    { type: "h2", title: "HYRJE" },
    {
      type: "para",
      segs: [
        t("Ky relacion, mbahet pranë autoritetit / enti kontraktor "),
        field(d.emertimiInst),
        t(", për identifikimin e nevojave, hartimin e specifikimeve teknike dhe përllogaritjen e vlerës së prokurimit për procedurën me objekt "),
        field(d.objektiProkurimit),
        t(". Kodi (CPV) sipas fjalorit të pëbashkët të prokurimit: "),
        field(d.kodiCPV),
        t("."),
      ],
    },
  ]
  if (d.panoramaObjektivat?.trim()) {
    p2Nodes.push({ type: "text", value: d.panoramaObjektivat })
  }
  pages.push({ nodes: p2Nodes })

  // ── Faqja 3 — Baza ligjore ──────────────────────────────────────────────
  pages.push({
    nodes: [
      { type: "h2", title: "BAZA LIGJORE" },
      {
        type: "text",
        value: "Ky relacion u hartua bazuar në:",
      },
      { type: "bullets", items: MALLRA_LEGAL_BULLETS },
      {
        type: "table",
        cols: [
          { key: "zgjedhja", header: "Lloji i aktit" },
          { key: "numri",    header: "Numri" },
          { key: "data",     header: "Data" },
          { key: "titulli",  header: "Titulli" },
          { key: "konfirmo", header: "Konfirmo" },
        ],
        rows: d.bazaRows,
      },
    ],
  })

  // ── Faqja 4 — I. Identifikimi ────────────────────────────────────────────
  pages.push({
    nodes: [
      { type: "h2", title: "I. IDENTIFIKIMI I NEVOJAVE DHE SASIA" },
      { type: "text", value: "Tabela nr. 1", italic: true },
      {
        type: "table",
        cols: [
          { key: "emertimi", header: "Emërtimi i artikullit" },
          { key: "njesia",   header: "Njësia" },
          { key: "sasia",    header: "Sasia", align: "r" },
          { key: "cpv",      header: "Kodi CPV" },
        ],
        rows: d.tab1Rows.filter(hasContent),
      },
    ],
  })

  // ── Faqja 5 — II. Specifikimet ───────────────────────────────────────────
  pages.push({
    nodes: [
      { type: "h2", title: "II. HARTIMI I SPECIFIKIMEVE TEKNIKE" },
      { type: "text", value: "Tabela nr. 2", italic: true },
      {
        type: "table",
        cols: [
          { key: "emertimi",     header: "Emërtimi i artikullit" },
          { key: "njesia",       header: "Njësia" },
          { key: "specifikime",  header: "Specifikimet teknike" },
          { key: "metodologjia", header: "Metodologjia" },
          { key: "argumentimi",  header: "Argumentimi teknik" },
        ],
        rows: d.tab2Rows.filter(hasContent),
      },
    ],
  })

  // ── Faqja 6 — III. Përllogaritja ─────────────────────────────────────────
  const p6Nodes: DocNode[] = [
    { type: "h2", title: "III. PËRLLOGARITJA E VLERës SË PARASHIKUAR" },
  ]

  const sections: { title: string; rowsKey: keyof FormularDocumentData; type: "value" | "b" | "c" | "cc" }[] = [
    { title: "1.1. Manuale / katalogë për mallra",         rowsKey: "mallraRows",  type: "value" },
    { title: "1.2. Manuale / katalogë për punë publike", rowsKey: "puneRows",   type: "value" },
    { title: "1.3. Manuale / katalogë për shërbime",    rowsKey: "sherbimeRows", type: "value" },
  ]

  for (const sec of sections) {
    const secRows = d[sec.rowsKey] as Record<string, string>[]
    if (secRows.filter(hasContent).length > 0) {
      const { rows: computed, total } = valueRows(secRows)
      p6Nodes.push({ type: "h3", title: sec.title })
      p6Nodes.push({
        type: "table",
        cols: VALUE_COLS,
        rows: computed,
        total_row: total > 0 ? ["", "", "", "", "", "Totali (pa TVSH)", money(total)] : undefined,
      })
    }
  }

  if (d.neni76BRows.filter(hasContent).length > 0) {
    p6Nodes.push({ type: "h3", title: "Përllogaritja sipas germës “b” të nenit 76" })
    p6Nodes.push({
      type: "table",
      cols: [
        { key: "emertimi", header: "Emërtimi" },
        { key: "njesia",   header: "Njësia" },
        { key: "sasia",    header: "Sasia",           align: "r" },
        { key: "oferta1",  header: "Oferta 1",        align: "r" },
        { key: "oferta2",  header: "Oferta 2",        align: "r" },
        { key: "oferta3",  header: "Oferta 3",        align: "r" },
        { key: "cmimi",    header: "Çmimi mes./njësi", align: "r" },
      ],
      rows: d.neni76BRows.filter(hasContent),
    })
  }

  if (d.neni76CRows.filter(hasContent).length > 0) {
    const { rows: computed, total } = valueRows(d.neni76CRows)
    p6Nodes.push({ type: "h3", title: "Përllogaritja sipas germës “c” të nenit 76" })
    p6Nodes.push({
      type: "table",
      cols: VALUE_COLS,
      rows: computed,
      total_row: total > 0 ? ["", "", "", "", "", "Totali (pa TVSH)", money(total)] : undefined,
    })
  }

  if (d.neni76CcRows.filter(hasContent).length > 0) {
    p6Nodes.push({ type: "h3", title: "Përllogaritja sipas germës “ç” të nenit 76" })
    p6Nodes.push({
      type: "table",
      cols: [
        { key: "burimi",   header: "Burimi" },
        { key: "nrKodi",   header: "Nr./Kodi" },
        { key: "emertimi", header: "Emërtimi" },
        { key: "njesia",   header: "Njësia" },
        { key: "sasia",    header: "Sasia",         align: "r" },
        { key: "cmimi",    header: "Çmimi/njësi", align: "r" },
      ],
      rows: d.neni76CcRows.filter(hasContent),
    })
  }

  pages.push({ nodes: p6Nodes })

  // ── Faqja 7 — IV. Grafiku ────────────────────────────────────────────────
  const p7Nodes: DocNode[] = [
    { type: "h2", title: "IV. GRAFIKU I LËVRIMIT" },
    {
      type: "text",
      value: "Autoriteti / enti kontraktor duhet të përcaktojë grafikun e lëvrimit.",
    },
  ]
  if (d.grafiku?.trim()) {
    p7Nodes.push({ type: "text", value: d.grafiku })
  }
  if (d.grafikuFileName) {
    p7Nodes.push({ type: "text", value: "Bashkëlidhur: " + d.grafikuFileName, italic: true })
  }
  pages.push({ nodes: p7Nodes })

  // ── Faqja 8 — Kontakti, Grupi i punës ────────────────────────────────────
  const p8Nodes: DocNode[] = [
    { type: "h2", title: "PERSONI I KONTAKTIT / KOORDINATORI" },
    {
      type: "kv_table",
      rows: [
        { label: "Emër Mbiemr", value: d.kontaktEmer },
        { label: "E-mail",           value: d.kontaktEmail },
        { label: "Nr. telefoni",     value: d.kontaktTel },
      ],
    },
  ]
  if (d.grupiPunes?.trim()) {
    p8Nodes.push({
      type: "signature_block",
      title: "GRUPI I PUN\u00cbS / ZYRTARI P\u00cbRGJEGJ\u00cbS",
      value: d.grupiPunes,
    })
  }
  pages.push({ nodes: p8Nodes })

  return { adresa: adresa || d.adresaFooter || "", pages }
}

