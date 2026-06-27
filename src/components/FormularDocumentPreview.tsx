import type { FormularDocumentData } from "@/lib/mock-data";

/**
 * FormularDocumentPreview — read-only render of the procurement planning
 * document. Mirrors the structure of FormularCreatePage so the preview
 * matches exactly what was generated as PDF.
 */

const LEGAL_BULLETS = [
  "Ligjin nr. 162, datë 23.12.2020 “Për prokurimin publik”, i ndryshuar;",
  "Vendimin nr. 285, datë 19.05.2021 të Këshillit të Ministrave, “Për miratimin e Rregullave të Prokurimit Publik”, i ndryshuar;",
  'Vendimin nr. 531, datë 07.09.2023 të Këshillit të Ministrave, “Për krijimin e shoqërisë aksionare shtetërore "Operatori i Blerjeve të Përqëndruara", sh.a.”, i ndryshuar',
];

type Doc = Partial<FormularDocumentData> | undefined;

const parseNum = (v?: string): number => {
  if (!v) return 0;
  const cleaned = String(v)
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
};
const fmtNum = (n: number) =>
  n === 0 ? "" : n.toLocaleString("sq-AL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function FormularDocumentPreview({ document }: { document: Doc }) {
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

  return (
    <div className="mx-auto flex flex-col gap-8 print:gap-0" style={{ maxWidth: 900 }}>
      <Page index={1} total={8} address={d.adresaFooter}>
        <p className="font-serif text-[14px] font-bold text-navy">
          SHTOJCA 2 – Modeli i dokumentit për planifikimin e prokurimit
          <sup className="text-[9px]">1</sup>
        </p>
        <div className="flex items-center justify-center" style={{ minHeight: 800 }}>
          <Filled value={d.titulliProjekti} className="text-center" big />
        </div>
      </Page>

      <Page index={2} total={8} address={d.adresaFooter}>
        <Section title="HYRJE">
          <p className="font-serif text-[14px] leading-relaxed text-foreground">
            Ky relacion, mbahet pranë autoritetit / enti kontraktor{" "}
            <Inline value={d.emertimiInst} />, për identifikimin e nevojave, hartimin e
            specifikimeve teknike dhe përllogaritjen e vlerës së prokurimit për procedurën me objekt{" "}
            <Inline value={d.objektiProkurimit} />. Kodi (CPV) sipas fjalorit të përbashkët të
            prokurimit: <Inline value={d.kodiCPV} />.
          </p>
          {d.panoramaObjektivat?.trim() && (
            <div className="mt-3">
              <Filled value={d.panoramaObjektivat} />
            </div>
          )}
        </Section>
      </Page>

      <Page index={3} total={8} address={d.adresaFooter}>
        <Section title="BAZA LIGJORE">
          <p className="font-serif text-[14px] leading-relaxed">Ky relacion u hartua bazuar në:</p>
          <ul className="ml-8 list-['-_'] space-y-2 font-serif text-[14px] leading-relaxed">
            {LEGAL_BULLETS.map((item) => (
              <li key={item} className="pl-2">
                {item}
              </li>
            ))}
          </ul>
          <RowsTable
            rows={d.bazaRows}
            columns={[
              { key: "zgjedhja", header: "Lloji i aktit" },
              { key: "numri", header: "Numri" },
              { key: "data", header: "Data" },
              { key: "titulli", header: "Titulli" },
              { key: "konfirmo", header: "Konfirmo" },
            ]}
          />
        </Section>
      </Page>

      <Page index={4} total={8} address={d.adresaFooter}>
        <Section title="I. IDENTIFIKIMI I NEVOJAVE DHE SASIA">
          <p className="mt-3 font-serif text-[14px] italic">Tabela nr. 1</p>
          <RowsTable
            rows={d.tab1Rows}
            showIndex
            columns={[
              { key: "emertimi", header: "Emërtimi i artikullit" },
              { key: "njesia", header: "Njësia" },
              { key: "sasia", header: "Sasia" },
              { key: "cpv", header: "Kodi CPV" },
            ]}
          />
        </Section>
      </Page>

      <Page index={5} total={8} address={d.adresaFooter}>
        <Section title="II. HARTIMI I SPECIFIKIMEVE TEKNIKE">
          <p className="mt-3 font-serif text-[14px] italic">Tabela nr. 2</p>
          <RowsTable
            rows={d.tab2Rows}
            showIndex
            columns={[
              { key: "emertimi", header: "Emërtimi i artikullit" },
              { key: "njesia", header: "Njësia" },
              { key: "specifikime", header: "Specifikimet teknike" },
              { key: "metodologjia", header: "Metodologjia" },
              { key: "argumentimi", header: "Argumentimi teknik" },
            ]}
          />
        </Section>
      </Page>

      <Page index={6} total={8} address={d.adresaFooter}>
        <Section title="III. PËRLLOGARITJA E VLERËS SË PARASHIKUAR">
          {d.mallraRows.length > 0 && (
            <CalcBlock title="1.1. Manuale / katalogë për mallra">
              <ValueTable rows={d.mallraRows} />
            </CalcBlock>
          )}
          {d.puneRows.length > 0 && (
            <CalcBlock title="1.2. Manuale / katalogë për punë publike">
              <ValueTable rows={d.puneRows} />
            </CalcBlock>
          )}
          {d.sherbimeRows.length > 0 && (
            <CalcBlock title="1.3. Manuale / katalogë për shërbime">
              <ValueTable rows={d.sherbimeRows} />
            </CalcBlock>
          )}
          {d.neni76BRows.some(hasContent) && (
            <CalcBlock title="Përllogaritja sipas gërmës “b” të nenit 76">
              <RowsTable
                rows={d.neni76BRows}
                columns={[
                  { key: "emertimi", header: "Emërtimi" },
                  { key: "njesia", header: "Njësia" },
                  { key: "sasia", header: "Sasia" },
                  { key: "oferta1", header: "Oferta 1" },
                  { key: "oferta2", header: "Oferta 2" },
                  { key: "oferta3", header: "Oferta 3" },
                  { key: "cmimi", header: "Çmimi mes./njësi" },
                ]}
              />
            </CalcBlock>
          )}
          {d.neni76CRows.some(hasContent) && (
            <CalcBlock title="Përllogaritja sipas gërmës “c” të nenit 76">
              <ValueTable rows={d.neni76CRows} />
            </CalcBlock>
          )}
          {d.neni76CcRows.some(hasContent) && (
            <CalcBlock title="Përllogaritja sipas gërmës “ç” të nenit 76">
              <RowsTable
                rows={d.neni76CcRows}
                columns={[
                  { key: "burimi", header: "Burimi" },
                  { key: "nrKodi", header: "Nr./Kodi" },
                  { key: "emertimi", header: "Emërtimi" },
                  { key: "njesia", header: "Njësia" },
                  { key: "sasia", header: "Sasia" },
                  { key: "cmimi", header: "Çmimi/njësi" },
                ]}
              />
            </CalcBlock>
          )}
        </Section>
      </Page>

      <Page index={7} total={8} address={d.adresaFooter}>
        <Section title="IV. GRAFIKU I LËVRIMIT">
          <p className="font-serif text-[14px] leading-relaxed">
            Autoriteti / enti kontraktor duhet të përcaktojë grafikun e lëvrimit.
          </p>
          {d.grafiku?.trim() && <Filled value={d.grafiku} />}
          {d.grafikuFileName && (
            <p className="mt-3 text-sm italic text-muted-foreground">
              Bashkëlidhur: {d.grafikuFileName}
            </p>
          )}
        </Section>
      </Page>

      <Page index={8} total={8} address={d.adresaFooter}>
        <Section title="PERSONI I KONTAKTIT / KOORDINATORI">
          <div className="overflow-hidden rounded-md border border-navy/20">
            <table className="w-full font-serif text-[14px]">
              <tbody>
                <ContactRow label="Emër Mbiemër" value={d.kontaktEmer} />
                <ContactRow label="E-mail" value={d.kontaktEmail} />
                <ContactRow label="Nr. telefoni" value={d.kontaktTel} />
              </tbody>
            </table>
          </div>
        </Section>
        {d.grupiPunes?.trim() && (
          <Section title="GRUPI I PUNËS / ZYRTARI PËRGJEGJËS">
            <Filled value={d.grupiPunes} />
          </Section>
        )}
      </Page>
    </div>
  );
}

/* ───────── helpers ───────── */

function hasContent(row: Record<string, string>) {
  return Object.entries(row).some(
    ([k, v]) => !["id", "_sourceId", "vlera"].includes(k) && String(v ?? "").trim().length > 0,
  );
}

function Page({
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
  return (
    <div
      className="doc-page-break group/page relative mx-auto w-full origin-top bg-white px-10 py-12 shadow-md ring-1 ring-border transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_55px_-32px_rgba(15,23,42,0.45)] hover:ring-navy/20 print:transform-none print:shadow-none sm:px-16"
      style={{
        minHeight: 1123,
        width: 794,
        animation: `field-slide-in 260ms cubic-bezier(0.22, 1, 0.36, 1) both`,
        animationDelay: `${Math.min(index - 1, 4) * 55}ms`,
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gold/70 transition-transform duration-300 ease-out group-hover/page:scale-x-100 print:hidden" />
      <div className="pb-24">{children}</div>
      <div className="absolute inset-x-10 bottom-6 sm:inset-x-16">
        <div className="border-t border-foreground/20 pt-2 text-center transition-colors duration-200 group-hover/page:border-gold/50">
          <p
            className="italic text-foreground/80 transition-colors duration-200 group-hover/page:text-navy"
            style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: "10pt" }}
          >
            {address || "—"}
          </p>
          <div className="mt-1 text-[10px] text-muted-foreground">
            Faqe {index} / {total}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="group/section mt-10 animate-[field-slide-in_240ms_ease-out]">
      <h2 className="doc-section-title relative inline-flex font-serif text-[15px] font-bold tracking-wide text-navy">
        {title}
        <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-300 ease-out group-hover/section:scale-x-100" />
      </h2>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

function CalcBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="doc-calc-block group/calc mt-4">
      <p className="doc-calc-title rounded-md border border-gold/40 bg-gold/10 px-3 py-2 font-sans text-sm font-semibold text-navy transition-all duration-200 ease-out group-hover/calc:-translate-y-0.5 group-hover/calc:border-gold/70 group-hover/calc:bg-gold/15 group-hover/calc:shadow-sm">
        {title}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Filled({ value, className, big }: { value: string; className?: string; big?: boolean }) {
  return (
    <p
      className={
        "rounded-sm whitespace-pre-wrap break-words font-serif leading-relaxed text-foreground transition-colors duration-200 hover:bg-yellow-50/70 " +
        (big ? "text-[16px] font-semibold " : "text-[14px] ") +
        (className ?? "")
      }
      style={{ fontFamily: '"Times New Roman", Times, serif' }}
    >
      {value || <span className="italic text-muted-foreground">—</span>}
    </p>
  );
}

function Inline({ value }: { value: string }) {
  return (
    <span
      className="doc-inline-val mx-1 inline-block max-w-full break-words rounded-sm bg-yellow-50 px-1.5 py-0.5 align-baseline ring-1 ring-transparent transition-all duration-200 hover:-translate-y-px hover:bg-yellow-100 hover:ring-gold/40"
      style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: 14 }}
    >
      {value?.trim() || <span className="italic text-muted-foreground">—</span>}
    </span>
  );
}

function RowsTable({
  rows,
  columns,
  showIndex,
}: {
  rows: Array<Record<string, string>>;
  columns: { key: string; header: string }[];
  showIndex?: boolean;
}) {
  const visible = rows.filter(hasContent);
  if (visible.length === 0) {
    return (
      <p className="mt-2 rounded-md border border-dashed border-navy/20 px-3 py-3 text-center text-xs italic text-muted-foreground transition-colors duration-200 hover:border-gold/50 hover:bg-gold/5">
        Asnjë rresht i plotësuar.
      </p>
    );
  }
  return (
    <div className="doc-table-wrap mt-2 overflow-hidden rounded-md border border-navy/20 transition-all duration-200 hover:border-navy/35 hover:shadow-sm">
      <table className="w-full font-serif text-[13px]">
        <thead className="doc-thead bg-navy/5 text-navy">
          <tr>
            {showIndex && (
              <th className="border-b border-navy/15 px-2 py-2 text-center font-semibold">#</th>
            )}
            {columns.map((c) => (
              <th key={c.key} className="border-b border-navy/15 px-3 py-2 text-left font-semibold">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((row, idx) => (
            <tr
              key={row.id ?? idx}
              className="border-b border-navy/10 transition-colors duration-150 last:border-b-0 hover:bg-gold/5"
              style={{ animation: `row-pop 180ms ease-out both`, animationDelay: `${idx * 22}ms` }}
            >
              {showIndex && (
                <td className="px-2 py-2 text-center text-muted-foreground">{idx + 1}</td>
              )}
              {columns.map((c) => (
                <td key={c.key} className="whitespace-pre-wrap break-words px-3 py-2 align-top">
                  {row[c.key]?.trim() || <span className="text-muted-foreground">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ValueTable({ rows }: { rows: Array<Record<string, string>> }) {
  const visible = rows.filter(hasContent);
  if (visible.length === 0) {
    return (
      <p className="mt-2 rounded-md border border-dashed border-navy/20 px-3 py-3 text-center text-xs italic text-muted-foreground transition-colors duration-200 hover:border-gold/50 hover:bg-gold/5">
        Asnjë rresht i plotësuar.
      </p>
    );
  }
  const total = visible.reduce((acc, r) => acc + parseNum(r.sasia) * parseNum(r.cmimi), 0);
  return (
    <div className="doc-table-wrap mt-2 overflow-hidden rounded-md border border-navy/20 transition-all duration-200 hover:border-navy/35 hover:shadow-sm">
      <table className="w-full font-serif text-[13px]">
        <thead className="doc-thead bg-navy/5 text-navy">
          <tr>
            {[
              "Manuali",
              "Nr. Rendor",
              "Emërtimi",
              "Njësia",
              "Sasia",
              "Çmimi/njësi",
              "Vlera totale",
            ].map((h) => (
              <th key={h} className="border-b border-navy/15 px-3 py-2 text-left font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((r, i) => (
            <tr
              key={r.id ?? i}
              className="border-b border-navy/10 transition-colors duration-150 last:border-b-0 hover:bg-gold/5"
              style={{ animation: `row-pop 180ms ease-out both`, animationDelay: `${i * 22}ms` }}
            >
              <td className="px-3 py-2 align-top">{r.manuali || "—"}</td>
              <td className="px-3 py-2 align-top">{r.nrRendor || "—"}</td>
              <td className="px-3 py-2 align-top">{r.emertimi || "—"}</td>
              <td className="px-3 py-2 align-top">{r.njesia || "—"}</td>
              <td className="px-3 py-2 align-top">{r.sasia || "—"}</td>
              <td className="px-3 py-2 align-top">{r.cmimi || "—"}</td>
              <td className="px-3 py-2 align-top">
                {fmtNum(parseNum(r.sasia) * parseNum(r.cmimi)) || "—"}
              </td>
            </tr>
          ))}
          <tr className="bg-navy/5 font-semibold text-navy transition-colors duration-150 hover:bg-gold/10">
            <td colSpan={6} className="px-3 py-2 text-right">
              Totali (pa TVSH)
            </td>
            <td className="px-3 py-2">{fmtNum(total) || "0.00"}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ContactRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-navy/15 transition-colors duration-150 last:border-b-0 hover:bg-gold/5">
      <td className="w-44 border-r border-navy/15 bg-navy/5 px-3 py-2 font-semibold text-navy">
        {label}
      </td>
      <td className="px-3 py-2">
        {value?.trim() || <span className="italic text-muted-foreground">—</span>}
      </td>
    </tr>
  );
}
