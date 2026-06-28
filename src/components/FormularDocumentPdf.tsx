import type { FormularDocumentData } from "@/lib/mock-data";

/**
 * PDF-only render of the procurement planning document.
 * Matches the official Word template exactly: Times New Roman, no colors,
 * bordered header/footer on every page, plain black-and-white tables.
 * Used by useFormPdfDownload — NOT shown on screen (rendered off-screen).
 */

type Doc = Partial<FormularDocumentData> | undefined;

const LEGAL_BULLETS = [
  'Ligjin nr. 162, datë 23.12.2020 “Për prokurimin publik”, i ndryshuar;',
  'Vendimin nr. 285, datë 19.05.2021 të Këshillit të Ministrave, “Për miratimin e Rregullave të Prokurimit Publik”, i ndryshuar;',
  'Vendimin nr. 531, datë 07.09.2023 të Këshillit të Ministrave, “Për krijimin e shoërisë aksionare shtetërore „Operatori i Blerjeve të Përqëndruara“, sh.a.”, i ndryshuar',
  '[Sipas rastit, urdhri / akti administrativ për caktimin e zyrtarit / zyrtareve përgjegjëb për hartimin e këtij dokumenti]',
];

const TNR: React.CSSProperties = {
  fontFamily: '"Times New Roman", Times, serif',
};

const parseNum = (v?: string): number => {
  if (!v) return 0;
  const n = parseFloat(String(v).replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};
const fmtNum = (n: number) =>
  n === 0 ? "" : n.toLocaleString("sq-AL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function hasContent(row: Record<string, string>) {
  return Object.entries(row).some(
    ([k, v]) => !["id", "_sourceId", "vlera"].includes(k) && String(v ?? "").trim().length > 0,
  );
}

/* ── Page shell ── */
function PdfPage({
  index,
  total,
  address,
  children,
}: {
  index: number;
  total: number;
  address: string;
  children: React.ReactNode;
}) {
  const footerBox: React.CSSProperties = {
    border: "1px solid #000",
    padding: "4px 8px",
    textAlign: "center",
    fontStyle: "italic",
    fontSize: "10pt",
    ...TNR,
  };

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        backgroundColor: "#fff",
        position: "relative",
        boxSizing: "border-box",
        padding: "72px 72px 100px 72px",
        pageBreakAfter: "always",
      }}
    >
      {/* TOP header box (address) */}
      <div style={{ ...footerBox, marginBottom: 24 }}>
        {address || " "}
      </div>

      {/* Page number top-right */}
      <div
        style={{
          position: "absolute",
          top: 72,
          right: 72,
          fontSize: "10pt",
          ...TNR,
        }}
      >
        {index}
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>{children}</div>

      {/* BOTTOM footer box (address + page) */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: 72,
          right: 72,
        }}
      >
        <div style={footerBox}>{address || " "}</div>
        <div
          style={{
            textAlign: "right",
            fontSize: "10pt",
            ...TNR,
            marginTop: 2,
          }}
        >
          {index}
        </div>
      </div>
    </div>
  );
}

/* ── Section title ── */
function PdfSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 28 }}>
      <p style={{ fontWeight: "bold", fontSize: "12pt", marginBottom: 10, ...TNR }}>{title}</p>
      {children}
    </div>
  );
}

/* ── Body text paragraph ── */
function Body({ children, italic }: { children: React.ReactNode; italic?: boolean }) {
  return (
    <p
      style={{
        fontSize: "12pt",
        lineHeight: 1.6,
        marginBottom: 8,
        fontStyle: italic ? "italic" : "normal",
        ...TNR,
      }}
    >
      {children}
    </p>
  );
}

/* ── Simple bordered table ── */
const TD: React.CSSProperties = {
  border: "1px solid #000",
  padding: "4px 8px",
  fontSize: "11pt",
  verticalAlign: "top",
  ...TNR,
};
const TH: React.CSSProperties = {
  ...TD,
  fontWeight: "bold",
  textAlign: "center",
  backgroundColor: "#f0f0f0",
};

function PdfTable({
  columns,
  rows,
  showIndex,
}: {
  columns: { key: string; header: string }[];
  rows: Array<Record<string, string>>;
  showIndex?: boolean;
}) {
  const visible = rows.filter(hasContent);
  if (visible.length === 0) return null;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
      <thead>
        <tr>
          {showIndex && <th style={{ ...TH, width: 32 }}>Nr.</th>}
          {columns.map((c) => (
            <th key={c.key} style={TH}>
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {visible.map((row, idx) => (
          <tr key={row.id ?? idx}>
            {showIndex && <td style={{ ...TD, textAlign: "center" }}>{idx + 1}</td>}
            {columns.map((c) => (
              <td key={c.key} style={TD}>
                {row[c.key]?.trim() || ""}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── Value table (Shembull 1 style) with total row ── */
function PdfValueTable({ rows }: { rows: Array<Record<string, string>> }) {
  const visible = rows.filter(hasContent);
  if (visible.length === 0) return null;
  const total = visible.reduce((acc, r) => acc + parseNum(r.sasia) * parseNum(r.cmimi), 0);
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
      <thead>
        <tr>
          {["Nr.", "Manuali", "Nr. Rendor", "Emërtimi", "Njësia", "Sasia", "Çmimi/njësi (lekë pa TVSH)", "Vlera totale"].map((h) => (
            <th key={h} style={TH}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {visible.map((r, i) => (
          <tr key={r.id ?? i}>
            <td style={{ ...TD, textAlign: "center" }}>{i + 1}</td>
            <td style={TD}>{r.manuali || ""}</td>
            <td style={TD}>{r.nrRendor || ""}</td>
            <td style={TD}>{r.emertimi || ""}</td>
            <td style={TD}>{r.njesia || ""}</td>
            <td style={TD}>{r.sasia || ""}</td>
            <td style={TD}>{r.cmimi || ""}</td>
            <td style={TD}>{fmtNum(parseNum(r.sasia) * parseNum(r.cmimi)) || ""}</td>
          </tr>
        ))}
        <tr>
          <td colSpan={7} style={{ ...TD, textAlign: "right", fontWeight: "bold" }}>
            (Vlera totale pa TVSH)
          </td>
          <td style={{ ...TD, fontWeight: "bold" }}>{fmtNum(total)}</td>
        </tr>
      </tbody>
    </table>
  );
}

/* ── Main export ── */
export function FormularDocumentPdf({ document }: { document: Doc }) {
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
    ...(document ?? {}),
  };

  const TOTAL_PAGES = 9;
  const addr = d.adresaFooter;

  return (
    <div style={{ width: 794, backgroundColor: "#fff" }}>
      {/* PAGE 1 — Cover */}
      <PdfPage index={1} total={TOTAL_PAGES} address={addr}>
        <div style={{ minHeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p
            style={{
              fontSize: "12pt",
              fontWeight: "bold",
              textAlign: "center",
              ...TNR,
            }}
          >
            SHTOJCA 2 – Modeli i dokumentit për planifikimin e prokurimit
            <sup style={{ fontSize: "8pt" }}>1</sup>
            <br />
            <br />
            {d.titulliProjekti || " "}
          </p>
        </div>
        <div style={{ position: "absolute", bottom: 130, left: 72, right: 72 }}>
          <hr style={{ borderTop: "1px solid #000", marginBottom: 4 }} />
          <p style={{ fontSize: "10pt", ...TNR }}>
            <sup>1</sup> Ky dokument i bashkëlidhet kërkesës standarde sipas Shtojcës 1
          </p>
        </div>
      </PdfPage>

      {/* PAGE 2 — Hyrje */}
      <PdfPage index={2} total={TOTAL_PAGES} address={addr}>
        <PdfSection title="HYRJE">
          <Body>
            Ky relacion, mbahet pranë autoritetit / entit kontraktor{" "}
            <strong>{d.emertimiInst || "[emërtimi i plotë i institucionit dhe NIPT]"}</strong>, për
            identifikimin e nevojave, hartimin e specifikimeve teknike dhe përllogaritjen e vlerës së
            prokurimit për procedurën me objekt{" "}
            <strong>{d.objektiProkurimit || "[objekti i prokurimit]"}</strong>. Kodi (CPV) sipas
            fjalorit të përbashkët të prokurimit:{" "}
            <strong>{d.kodiCPV || "[xxxxxxxxx-x]"}</strong>.
          </Body>
          {d.panoramaObjektivat?.trim() && (
            <Body>{d.panoramaObjektivat}</Body>
          )}
        </PdfSection>
      </PdfPage>

      {/* PAGE 3 — Baza Ligjore */}
      <PdfPage index={3} total={TOTAL_PAGES} address={addr}>
        <PdfSection title="BAZA LIGJORE">
          <Body>Ky relacion u hartua bazuar në:</Body>
          <ul style={{ paddingLeft: 32, ...TNR, fontSize: "12pt", lineHeight: 1.6 }}>
            {LEGAL_BULLETS.map((item) => (
              <li key={item} style={{ listStyleType: "none", marginBottom: 6 }}>
                – {item}
              </li>
            ))}
            {(d.bazaRows ?? []).filter(hasContent).map((row, i) => (
              <li key={i} style={{ listStyleType: "none", marginBottom: 6 }}>
                – {[row.zgjedhja, row.numri, row.data, row.titulli].filter(Boolean).join(", ")}
                {row.konfirmo ? " (i ndryshuar)" : ""}
              </li>
            ))}
          </ul>
          <PdfTable
            rows={d.bazaRows ?? []}
            columns={[
              { key: "zgjedhja", header: "Zgjidh llojin e aktit" },
              { key: "numri", header: "Numri i aktit" },
              { key: "data", header: "Data / Viti" },
              { key: "titulli", header: "Titulli" },
              { key: "konfirmo", header: "Konfirmo nëse akti ka pësuar ndryshime" },
            ]}
            showIndex
          />
        </PdfSection>
      </PdfPage>

      {/* PAGE 4 — I. Identifikimi */}
      <PdfPage index={4} total={TOTAL_PAGES} address={addr}>
        <PdfSection title="I.  IDENTIFIKIMI I NEVOJAVE DHE SASIA">
          {d.nevojaArgument?.trim() && <Body italic>{d.nevojaArgument}</Body>}
          <Body italic>Tabela nr. 1</Body>
          <PdfTable
            rows={d.tab1Rows ?? []}
            showIndex
            columns={[
              { key: "emertimi", header: "Emërtimi i artikullit" },
              { key: "njesia", header: "Njësia" },
              { key: "sasia", header: "Sasia" },
              { key: "cpv", header: "Kodi CPV" },
            ]}
          />
        </PdfSection>
      </PdfPage>

      {/* PAGE 5 — II. Specifikimet */}
      <PdfPage index={5} total={TOTAL_PAGES} address={addr}>
        <PdfSection title="II. HARTIMI I SPECIFIKIMEVE TEKNIKE">
          <Body italic>Tabela nr. 2</Body>
          <PdfTable
            rows={d.tab2Rows ?? []}
            showIndex
            columns={[
              { key: "emertimi", header: "Emërtimi i artikullit" },
              { key: "njesia", header: "Njësia" },
              { key: "specifikime", header: "Specifikimet teknike" },
              { key: "metodologjia", header: "Metodologjia e përdorur" },
              { key: "argumentimi", header: "Argumentimi teknik" },
            ]}
          />
        </PdfSection>
      </PdfPage>

      {/* PAGE 6 — III. Përllogaritja gërmë a */}
      <PdfPage index={6} total={TOTAL_PAGES} address={addr}>
        <PdfSection title="III.     PËRLLOGARITJA E VLERËS SË PARASHIKUAR TË PROKURIMIT">
          {d.mallraRows.some(hasContent) && (
            <>
              <Body italic>Shembull 1 – Përllogaritja sipas gërmës "a" të nenit 76</Body>
              <Body italic>1.1. Referenca në manuale / katalogë zyrtarë për mallra</Body>
              <PdfValueTable rows={d.mallraRows} />
            </>
          )}
          {d.puneRows.some(hasContent) && (
            <>
              <Body italic>1.2. Referenca në manuale / katalogë zyrtarë për punë publike</Body>
              <PdfValueTable rows={d.puneRows} />
            </>
          )}
          {d.sherbimeRows.some(hasContent) && (
            <>
              <Body italic>1.3. Referenca në manuale / katalogë zyrtarë për shërbime</Body>
              <PdfValueTable rows={d.sherbimeRows} />
            </>
          )}
        </PdfSection>
      </PdfPage>

      {/* PAGE 7 — III. gërmë b, c, ç */}
      <PdfPage index={7} total={TOTAL_PAGES} address={addr}>
        <PdfSection title="III. (vazhdim)">
          {d.neni76BRows.some(hasContent) && (
            <>
              <Body italic>Shembull 2 – Përllogaritja sipas gërmës "b" të nenit 76</Body>
              <PdfTable
                rows={d.neni76BRows}
                columns={[
                  { key: "emertimi", header: "Emërtimi" },
                  { key: "njesia", header: "Njësia" },
                  { key: "sasia", header: "Sasia" },
                  { key: "oferta1", header: "Oferta ekonomike 1" },
                  { key: "oferta2", header: "Oferta ekonomike 2" },
                  { key: "oferta3", header: "Oferta ekonomike 3" },
                  { key: "cmimi", header: "Çmimi mesatar për njësi (lekë pa TVSH)" },
                ]}
              />
            </>
          )}
          {d.neni76CRows.some(hasContent) && (
            <>
              <Body italic>Shembull 3 – Përllogaritja sipas gërmës "c" të nenit 76</Body>
              <PdfValueTable rows={d.neni76CRows} />
            </>
          )}
          {d.neni76CcRows.some(hasContent) && (
            <>
              <Body italic>Shembull 4 – Përllogaritja sipas gërmës "ç" të nenit 76</Body>
              <PdfTable
                rows={d.neni76CcRows}
                columns={[
                  { key: "burimi", header: "Zgjidh burimin" },
                  { key: "nrKodi", header: "Nr. Rendor ose kodi" },
                  { key: "emertimi", header: "Emërtimi i artikullit" },
                  { key: "njesia", header: "Njësia" },
                  { key: "sasia", header: "Sasia" },
                  { key: "cmimi", header: "Çmimi për njësi (lekë pa TVSH)" },
                ]}
              />
            </>
          )}
        </PdfSection>
      </PdfPage>

      {/* PAGE 8 — IV. Grafiku */}
      <PdfPage index={8} total={TOTAL_PAGES} address={addr}>
        <PdfSection title="IV.     GRAFIKU I LËVRIMIT">
          <Body>Autoriteti / enti kontraktor duhet të përcaktojë grafikun e lëvrimit.</Body>
          {d.grafiku?.trim() && <Body>{d.grafiku}</Body>}
          {d.grafikuFileName && (
            <Body italic>Bashkëlidhur: {d.grafikuFileName}</Body>
          )}
        </PdfSection>
      </PdfPage>

      {/* PAGE 9 — Kontakti & Grupi */}
      <PdfPage index={9} total={TOTAL_PAGES} address={addr}>
        <div style={{ marginTop: 40, ...TNR, fontSize: "12pt", lineHeight: 1.8 }}>
          <p style={{ textAlign: "center", marginBottom: 28, ...TNR }}>***</p>
          <p style={{ marginBottom: 20, ...TNR, fontSize: "12pt" }}>
            Ky relacion u hartua në{" "}
            <strong>[numri i kopjeve]</strong> kopje të barazvlefshme dhe pasi u lexua, është
            nënshkruar nga{" "}
            <strong>[të gjithë anëtarët e grupit të punës / zyrtari i caktuar nga titullari i autoritetit kontraktor]</strong>
          </p>

          {/* Contact table */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 28 }}>
            <thead>
              <tr>
                <th
                  colSpan={2}
                  style={{ ...TH, textAlign: "left", padding: "6px 8px" }}
                >
                  Personi i kontaktit / Koordinatori ndërmjet OBP dhe AK përfitues:
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...TD, width: "40%", fontWeight: "bold" }}>Emër Mbiemër</td>
                <td style={TD}>{d.kontaktEmer || ""}</td>
              </tr>
              <tr>
                <td style={{ ...TD, fontWeight: "bold" }}>E-mail</td>
                <td style={TD}>{d.kontaktEmail || ""}</td>
              </tr>
              <tr>
                <td style={{ ...TD, fontWeight: "bold" }}>Nr. telefoni</td>
                <td style={TD}>{d.kontaktTel || ""}</td>
              </tr>
            </tbody>
          </table>

          <p style={{ fontWeight: "bold", marginBottom: 12, ...TNR, fontSize: "12pt" }}>
            GRUPI I PUNËS / ZYRTARI PËRGJEGJËS
          </p>
          {d.grupiPunes?.trim() ? (
            <p style={{ whiteSpace: "pre-wrap", ...TNR, fontSize: "12pt" }}>{d.grupiPunes}</p>
          ) : (
            <>
              <p style={{ marginBottom: 8, ...TNR, fontSize: "12pt" }}>
                Emër Mbiemër – Emërtesa e pozicionit / profesioni (nënshkrimi)
              </p>
              <p style={{ marginBottom: 8, ...TNR, fontSize: "12pt" }}>
                Emër Mbiemër – Emërtesa e pozicionit / profesioni (nënshkrimi)
              </p>
              <p style={{ ...TNR, fontSize: "12pt" }}>(...)</p>
            </>
          )}
        </div>
      </PdfPage>
    </div>
  );
}
