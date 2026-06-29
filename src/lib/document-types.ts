/**
 * Document Definition Layer (DDL) — kontrata e përbashkët mes
 * React renderer-it dhe PyMuPDF renderer-it.
 *
 * Rregull: ÇFARË renderohet + ÇFARË të dhënash ka çdo bllok
 *          SI renderohet — vendos secili renderer vetë.
 *
 * Ndryshimi i një Node refleKtohet automatikisht si në Preview ashtu
 * edhe në PDF, sepse të dy renderers lexojnë të njëjtën strukturë.
 */

// ─── Segment inline (brenda paragrafëve) ───────────────────────────────────

export type Seg =
  | { k: "t"; v: string }                       // tekst literal
  | { k: "f"; v: string; empty: boolean }        // vlerë fushe (bold nëse plot, placeholder nëse bosh)

// ─── Kolona tabele ─────────────────────────────────────────────────────────

export interface Col {
  key: string
  header: string
  align?: "l" | "c" | "r"   // left | center | right (default "l")
  pct?: number               // % gjerësi për Preview (i llogaritur relativisht)
}

// ─── Nodet e dokumentit ────────────────────────────────────────────────────

export type DocNode =
  /** Rreshti kryesor "SHTOJCA N – ..." në krye të faqes */
  | { type: "shtojca"; text: string; footnoteRef?: string }

  /** Titulli i madh i çentruar (kopertinë) */
  | { type: "big_title"; text: string }

  /** Titull seksioni (H2) me vijë poshtë */
  | { type: "h2"; title: string }

  /** Titull nënseksioni (H3) — stili "CalcBlock" ari */
  | { type: "h3"; title: string }

  /** Paragraf me segmente inline (tekst + vlera fushash) */
  | { type: "para"; segs: Seg[]; italic?: boolean }

  /** Tekst i thjeshtë (mund të jetë preformatted) */
  | { type: "text"; value: string; italic?: boolean; bold?: boolean; pre?: boolean }

  /** Lista me pika */
  | { type: "bullets"; items: string[] }

  /** Tabelë me të dhëna (headers + rreshta, optional rreshti total) */
  | { type: "table"; cols: Col[]; rows: Record<string, string>[]; total_row?: string[] }

  /** Tabelë kontakti çelës-vlerë dy-kolonësh */
  | { type: "kv_table"; rows: { label: string; value: string }[] }

  | { type: "signature_block"; title: string; value: string }

  /** Shënim i vogël (footnote) */
  | { type: "footnote"; text: string }

  /** Ndarës *** */
  | { type: "separator" }

  /** Hapësirë vertikale */
  | { type: "spacer" }

// ─── Faqja ─────────────────────────────────────────────────────────────────

export interface DocPage {
  nodes: DocNode[]
}

// ─── Dokumenti i plotë ─────────────────────────────────────────────────────

export interface FormDoc {
  /** Adresa/institucioni — shfaqet në footer çdo faqeje */
  adresa: string
  pages: DocPage[]
}
