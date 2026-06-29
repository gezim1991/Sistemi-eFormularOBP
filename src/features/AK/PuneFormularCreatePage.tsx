import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowUp, CheckCircle2, ChevronLeft, FileText, Loader2, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { EditableYellow, InlineYellow } from "@/components/doc-editor/editable";
import { DataTable, type Column, type Row } from "@/components/doc-editor/data-table";
import { Btn } from "@/components/btn";
import { useAuth } from "@/lib/auth-store";
import { useFormulare } from "@/lib/formulare-store";
import type { PunePublikeDocumentData } from "@/lib/mock-data";

const TOTAL_PAGES = 5;

const uid = () => Math.random().toString(36).slice(2, 9);

const money = (value: number) =>
  value.toLocaleString("sq-AL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const parseNum = (value?: string) => {
  const n = Number(
    String(value ?? "")
      .replace(/\s/g, "")
      .replace(",", "."),
  );
  return Number.isFinite(n) ? n : 0;
};

const makeRow = (): Row => ({
  id: uid(),
  emertimi: "",
  njesia: "",
  sasia: "",
  oferta1: "",
  oferta2: "",
  oferta3: "",
});

const puneColumns: Column[] = [
  { key: "emertimi", header: "Emërtimi i artikullit", placeholder: "Përshkrimi", width: "17%" },
  { key: "njesia", header: "Njësia", placeholder: "copë / m²", width: "9%" },
  { key: "sasia", header: "Sasia", placeholder: "0", numeric: true, width: "8%" },
  {
    key: "oferta1",
    header: "Oferta ekonomike e operatorit ekonomik “1”",
    placeholder: "0",
    numeric: true,
    width: "13%",
  },
  {
    key: "oferta2",
    header: "Oferta ekonomike e operatorit ekonomik “2”",
    placeholder: "0",
    numeric: true,
    width: "13%",
  },
  {
    key: "oferta3",
    header: "Oferta ekonomike e operatorit ekonomik “3”",
    placeholder: "0",
    numeric: true,
    width: "13%",
  },
  {
    key: "cmimiMesatar",
    header: "Çmimi mesatar për njësi (lekë pa TVSH)",
    width: "14%",
    compute: (row) => {
      const values = [parseNum(row.oferta1), parseNum(row.oferta2), parseNum(row.oferta3)].filter(
        (v) => v > 0,
      );
      if (!values.length) return "";
      return money(values.reduce((a, b) => a + b, 0) / values.length);
    },
  },
  {
    key: "vleraTotale",
    header: "Vlera totale për artikull (pa TVSH)",
    width: "13%",
    compute: (row) => {
      const values = [parseNum(row.oferta1), parseNum(row.oferta2), parseNum(row.oferta3)].filter(
        (v) => v > 0,
      );
      if (!values.length) return "";
      const average = values.reduce((a, b) => a + b, 0) / values.length;
      return money(average * parseNum(row.sasia));
    },
  },
];

export function PuneFormularCreatePage({ editId }: { editId?: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { create, get, update, generatePdf } = useFormulare();
  const existingFormular = editId ? get(editId) : undefined;

  const institutionName = user?.institucioni || "[emërtimi i plotë i institucionit]";
  const institutionAddress =
    user?.adresaInstitucioni || "[Adresa e autoritetit / entit kontraktor përfitues]";

  const [hydratedEditId, setHydratedEditId] = useState<string | null>(null);
  const [titulli, setTitulli] = useState("");
  const [llojiDokumentit, setLlojiDokumentit] = useState("");
  const [objekti, setObjekti] = useState("");
  const [bazaDokumentit, setBazaDokumentit] = useState("");
  const [detaje, setDetaje] = useState("");
  const [shenimeTregu, setShenimeTregu] = useState("");
  const [dokumentacionNdertim, setDokumentacionNdertim] = useState("");
  const [dokumentacionSherbim, setDokumentacionSherbim] = useState("");
  const [numriKopjeve, setNumriKopjeve] = useState("");
  const [grupiPunes, setGrupiPunes] = useState("");
  const [rows, setRows] = useState<Row[]>([makeRow(), makeRow(), makeRow()]);

  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showGenerateShortcut, setShowGenerateShortcut] = useState(false);
  const [generatePulse, setGeneratePulse] = useState(false);

  const has = (key: string) => errors.has(key);

  // Hydrate from existing document when editing
  useEffect(() => {
    if (!editId || !existingFormular || hydratedEditId === editId) return;
    const doc = existingFormular.document as PunePublikeDocumentData | undefined;
    if (!doc || doc.formType !== "pune") return;
    setTitulli(doc.titulli || "");
    setLlojiDokumentit(doc.llojiDokumentit || "");
    setObjekti(doc.objekti || "");
    setBazaDokumentit(doc.bazaDokumentit || "");
    setDetaje(doc.detaje || "");
    setShenimeTregu(doc.shenimeTregu || "");
    setDokumentacionNdertim(doc.dokumentacionNdertim || "");
    setDokumentacionSherbim(doc.dokumentacionSherbim || "");
    setNumriKopjeve(doc.numriKopjeve || "");
    setGrupiPunes(doc.grupiPunes || "");
    if (doc.rows?.length) setRows(doc.rows as Row[]);
    setHydratedEditId(editId);
  }, [editId, existingFormular, hydratedEditId]);

  const totalTable = useMemo(
    () =>
      rows.reduce((sum, row) => {
        const values = [parseNum(row.oferta1), parseNum(row.oferta2), parseNum(row.oferta3)].filter(
          (v) => v > 0,
        );
        if (!values.length) return sum;
        const average = values.reduce((a, b) => a + b, 0) / values.length;
        return sum + average * parseNum(row.sasia);
      }, 0),
    [rows],
  );

  const hasFilledRows = rows.some((row) =>
    ["emertimi", "njesia", "sasia", "oferta1", "oferta2", "oferta3"].some((key) =>
      row[key]?.trim(),
    ),
  );

  useEffect(() => {
    if (!generating) return;
    const timer = window.setInterval(() => {
      setGenerationProgress((c) =>
        c >= 100 ? 100 : c >= 90 ? 90 : Math.min(c + Math.floor(Math.random() * 9) + 6, 90),
      );
    }, 180);
    return () => window.clearInterval(timer);
  }, [generating]);

  useEffect(() => {
    if (!generating || generationProgress < 100) return;
    const timer = window.setTimeout(() => {
      setGenerating(false);
      const hadPdf = Boolean(existingFormular && existingFormular.status !== "draft");
      toast.success(hadPdf ? "PDF u rigjenerua." : "PDF u gjenerua me sukses.");
      navigate({ to: "/forms" });
    }, 450);
    return () => window.clearTimeout(timer);
  }, [generating, generationProgress, existingFormular, navigate]);

  useEffect(() => {
    const updateShortcut = () => {
      const doc = document.documentElement;
      const distanceFromBottom = doc.scrollHeight - window.innerHeight - window.scrollY;
      setShowGenerateShortcut(window.scrollY > 900 && distanceFromBottom < 1100);
    };

    updateShortcut();
    window.addEventListener("scroll", updateShortcut, { passive: true });
    window.addEventListener("resize", updateShortcut);
    return () => {
      window.removeEventListener("scroll", updateShortcut);
      window.removeEventListener("resize", updateShortcut);
    };
  }, []);

  const validate = (): { ok: boolean; missing: string[] } => {
    const errSet = new Set<string>();
    const missing: string[] = [];
    const req = (value: string, key: string, label: string) => {
      if (!value.trim()) {
        errSet.add(key);
        missing.push(label);
      }
    };

    req(titulli, "titulli", "Titulli i projektit");
    req(llojiDokumentit, "llojiDokumentit", "Lloji i dokumentit në hyrje");
    req(objekti, "objekti", "Objekti i prokurimit");
    req(bazaDokumentit, "bazaDokumentit", "Lloji i dokumentit në bazën ligjore");
    req(detaje, "detaje", "Identifikimi i nevojave");
    req(shenimeTregu, "shenimeTregu", "Shënime për përllogaritjen");
    req(numriKopjeve, "numriKopjeve", "Numri i kopjeve");
    req(grupiPunes, "grupiPunes", "Grupi i punës / zyrtari përgjegjës");

    if (!hasFilledRows) {
      missing.push("Të paktën një rresht i plotësuar në tabelë");
    }

    setErrors(errSet);
    return { ok: missing.length === 0, missing };
  };

  const handleSave = async (generate: boolean) => {
    if (generating) return;

    if (generate) {
      const { ok, missing } = validate();
      if (!ok) {
        const preview = missing.slice(0, 3).join(" · ");
        const extra = missing.length > 3 ? ` (+${missing.length - 3} të tjera)` : "";
        toast.error("Plotëso fushat e detyrueshme", { description: `${preview}${extra}` });
        return;
      }
    }

    const document: PunePublikeDocumentData = {
      formType: "pune",
      titulli,
      llojiDokumentit,
      objekti,
      bazaDokumentit,
      detaje,
      shenimeTregu,
      dokumentacionNdertim,
      dokumentacionSherbim,
      numriKopjeve,
      grupiPunes,
      rows: rows as Array<Record<string, string>>,
    };

    const docTitle = titulli.trim() || "Formular punësh publike";

    try {
      const f = editId && existingFormular
        ? existingFormular
        : await create(docTitle, {
            emri: user?.name?.split(" ")[0] ?? "",
            mbiemri: user?.name?.split(" ").slice(1).join(" ") ?? "",
            email: user?.email ?? "",
            institucioni: institutionName,
            arsyeja: objekti,
            adresa: institutionAddress,
          });

      await update(f.id, { emerFormulari: docTitle, document });

      if (!generate) {
        toast.success("Drafti u ruajt.");
        navigate({ to: "/forms" });
        return;
      }

      setErrors(new Set());
      setGenerationProgress(0);
      setGenerating(true);

      generatePdf(f.id)
        .then(() => setGenerationProgress(100))
        .catch((err) => {
          setGenerating(false);
          setGenerationProgress(0);
          toast.error("Gabim gjatë gjenerimit të PDF.", {
            description: err instanceof Error ? err.message : "Provoni sërish.",
          });
        });
    } catch (err) {
      toast.error("Gabim gjatë ruajtjes.", {
        description: err instanceof Error ? err.message : "Provoni sërish.",
      });
    }
  };

  const jumpToGenerate = () => {
    setGeneratePulse(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => {
      document.getElementById("generate-pdf-action")?.focus({ preventScroll: true });
    }, 450);
    window.setTimeout(() => setGeneratePulse(false), 1100);
  };

  const actions = (
    <>
      <Link
        to="/forms"
        className="hidden items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-muted-foreground transition-all hover:-translate-x-0.5 hover:bg-secondary hover:text-navy md:inline-flex"
      >
        <ChevronLeft className="h-4 w-4" /> Kthehu te lista
      </Link>
      <Btn
        variant="outline"
        onClick={() => handleSave(false)}
        leading={<Save className="h-4 w-4" />}
        disabled={generating}
      >
        Ruaj Draft
      </Btn>
      <Btn
        id="generate-pdf-action"
        variant="gold"
        onClick={() => handleSave(true)}
        leading={<FileText className="h-4 w-4" />}
        disabled={generating}
        className={
          generatePulse
            ? "ring-2 ring-gold/70 ring-offset-2 animate-[login-success-pulse_700ms_ease-out]"
            : undefined
        }
      >
        {generating ? "Duke gjeneruar..." : existingFormular && existingFormular.status !== "draft" ? "Rigjenero PDF" : "Gjenero PDF"}
      </Btn>
    </>
  );

  return (
    <AppShell
      title={titulli.trim() || "Modeli i dokumentit për planifikimin e prokurimit"}
      description="Plotëso me kujdes të gjitha fushat e detyrueshme përpara se të gjenerosh PDF-në."
      collapsedNav
      breadcrumbs={[{ label: "Formularët", to: "/forms" }, { label: "Krijo i ri" }]}
      actions={actions}
    >
      {generating && <GenerationModal progress={generationProgress} />}

      {showGenerateShortcut && (
        <button
          type="button"
          onClick={jumpToGenerate}
          className="group/generate fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold px-4 py-3 text-sm font-semibold text-navy shadow-[0_18px_45px_-18px_rgba(15,23,42,0.45)] transition-all duration-200 ease-out hover:-translate-y-1 hover:bg-gold/90 hover:shadow-[0_24px_60px_-20px_rgba(15,23,42,0.55)] active:scale-95"
          aria-label="Kthehu lart te butoni Gjenero PDF"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-navy text-navy-foreground transition-transform duration-200 group-hover/generate:-translate-y-0.5">
            <ArrowUp className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">Shko te Gjenero PDF</span>
        </button>
      )}

      {errors.size > 0 && (
        <div className="mx-auto mb-4 max-w-[900px] animate-[field-slide-in_220ms_ease-out] rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <strong className="font-semibold">Vëmendje:</strong> ka fusha të detyrueshme që mungojnë
          ose janë të pavlefshme. Fushat e shënuara me kufi të kuq duhet të plotësohen për të
          gjeneruar PDF-në.
        </div>
      )}

      <div className="mb-4 rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent/15 text-[oklch(0.42_0.12_60)] ring-1 ring-inset ring-accent/30">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold">Editor i formularit të punëve</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fushat me të verdhë janë të editueshme. Tabela lejon ndryshim qelizash dhe shtim
              rreshtash.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8 overflow-x-auto pb-8">
        <PunePage index={1} address={institutionAddress}>
          <p className="font-serif text-[14px] text-foreground">
            SHTOJCA 3 – Modeli i dokumentit për planifikimin e prokurimit për punë publike
            <sup className="text-[9px]">1</sup>
          </p>
          <div className="flex min-h-[720px] items-center justify-center text-center">
            <EditableYellow
              value={titulli}
              onChange={setTitulli}
              invalid={has("titulli")}
              placeholder="[Këtu shënohet vetëm titulli i projektit / objekti i procedurës së prokurimit. Lloji i shkrimit “Times New Roman” dhe madhësia “12pt”]"
              className="mx-auto max-w-[620px] text-center font-semibold"
            />
          </div>
          <p className="border-t border-foreground/30 pt-2 font-serif text-[10pt]">
            <sup>1</sup> Ky dokument i bashkëlidhet kërkesës standarde sipas Shtojcës 1
          </p>
        </PunePage>

        <PunePage index={2} address={institutionAddress}>
          <Section title="HYRJE">
            <Body>
              Ky{" "}
              <InlineYellow
                value={llojiDokumentit}
                onChange={setLlojiDokumentit}
                invalid={has("llojiDokumentit")}
                placeholder="[lloji i dokumentit, e.g. relacion, procesverbal, projekt, preventiv]"
              />{" "}
              mbahet pranë autoritetit / entit kontraktor{" "}
              <span className="rounded-sm bg-yellow-100 px-1 font-semibold">{institutionName}</span>
              , për realizimin e procedurës prokurimit dhe përllogaritjen e vlerës së prokurimit për
              procedurën me objekt{" "}
              <InlineYellow
                value={objekti}
                onChange={setObjekti}
                invalid={has("objekti")}
                placeholder="[Ndërtim, rikonstruksion, shërbim... objekti i prokurimit]"
              />
              .
            </Body>
          </Section>

          <Section title="BAZA LIGJORE">
            <Body>
              Ky{" "}
              <InlineYellow
                value={bazaDokumentit}
                onChange={setBazaDokumentit}
                invalid={has("bazaDokumentit")}
                placeholder="[lloji i dokumentit, e.g. relacion, procesverbal, projekt, preventiv, specifikimet]"
              />{" "}
              u hartua bazuar në:
            </Body>
            <ul className="ml-8 list-disc space-y-1 font-serif text-[12pt] leading-relaxed">
              <li>Ligjin nr. 162, datë 23.12.2020 “Për prokurimin publik”, i ndryshuar;</li>
              <li>
                Vendimin nr. 285, datë 19.05.2021 të Këshillit të Ministrave, “Për miratimin e
                Rregullave të Prokurimit Publik”, i ndryshuar;
              </li>
              <li>
                Vendimin nr. 531, datë 07.09.2023 të Këshillit të Ministrave, për krijimin e
                shoqërisë aksionare shtetërore “Operatori i Blerjeve të Përqendruara”, sh.a.;
              </li>
              <li>
                VKM nr. 216, datë 13.4.2023 për krijimin dhe funksionimin e sistemit të integruar
                për informatizimin e manualit të çmimeve për zërat e punimeve në ndërtim;
              </li>
            </ul>
          </Section>

          <Section title="IDENTIFIKIMI I NEVOJAVE PËR NDËRTIM / RIKONSTRUKSION / SHËRBIM">
            <h3 className="font-serif text-[11pt] font-bold">
              &gt; DOKUMENTACIONI I NEVOJSHËM PËR PROCEDURË PROKURIMI NDËRTIM / RIKONSTRUKSION
            </h3>
            <EditableYellow
              value={detaje}
              onChange={setDetaje}
              invalid={has("detaje")}
              placeholder="Detaje të mëtejshme, specifikime teknike, projekte, relacion teknik..."
              className="min-h-32"
            />
          </Section>
        </PunePage>

        <PunePage index={3} address={institutionAddress}>
          <Section title="PËRLLOGARITJA E VLERËS SË PROKURIMIT">
            <Body italic>
              Në rast se specifikimet teknike hartohen bazuar në një manual standard apo katalog,
              ato duhet të jenë në përputhje të plotë me këta të fundit.
            </Body>
            <EditableYellow
              value={shenimeTregu}
              onChange={setShenimeTregu}
              invalid={has("shenimeTregu")}
              placeholder="Shto shënime për preventivin, analizën teknike, ofertat ekonomike ose metodologjinë e përllogaritjes..."
              className="min-h-24"
            />
            <p className="mt-4 font-serif text-[12pt] italic">
              Shembull – Përllogaritja sipas germës “b” të nenit 76
            </p>
            <DataTable
              columns={puneColumns}
              rows={rows}
              onChange={setRows}
              showIndex
              footerRow={{
                label: "Vlera totale pa TVSH",
                compute: () => (totalTable > 0 ? money(totalTable) : "—"),
              }}
            />
          </Section>
        </PunePage>

        <PunePage index={4} address={institutionAddress}>
          <Section title="DOKUMENTACIONI I NEVOJSHËM PËR PROCEDURË PROKURIMI NDËRTIM">
            <Body italic>
              - Dokumentacioni teknik, i cili përfshin Projektet, Relacionet teknike, Specifikimet
              teknike përkatëse.
            </Body>
            <EditableYellow
              value={dokumentacionNdertim}
              onChange={setDokumentacionNdertim}
              placeholder="Plotëso dokumentacionin, grafikun, specifikimet, preventivin dhe çdo sqarim tjetër për ndërtim/rikonstruksion..."
              className="min-h-56"
            />
          </Section>

          <Section title="DOKUMENTACIONI I NEVOJSHËM PËR PROCEDURË PROKURIMI SHËRBIM">
            <Body italic>
              - Dokumentacioni teknik, i cili përfshin Detyrë Projektimi, Terma Reference etj.
            </Body>
            <EditableYellow
              value={dokumentacionSherbim}
              onChange={setDokumentacionSherbim}
              placeholder="Plotëso dokumentacionin për shërbime, termat e referencës, procesverbalet dhe specifikimet..."
              className="min-h-56"
            />
          </Section>
        </PunePage>

        <PunePage index={5} address={institutionAddress}>
          <div className="pt-16 text-center font-serif text-[12pt]">***</div>
          <div className="mt-12 space-y-8">
            <Body>
              Ky relacion u hartua në{" "}
              <InlineYellow
                value={numriKopjeve}
                onChange={setNumriKopjeve}
                invalid={has("numriKopjeve")}
                placeholder="[numri i kopjeve]"
              />{" "}
              kopje të barazvlefshme dhe pasi u lexua, është nënshkruar nga{" "}
              <InlineYellow
                value={grupiPunes}
                onChange={setGrupiPunes}
                invalid={has("grupiPunes")}
                placeholder="[të gjithë anëtarët e grupit të punës / zyrtari i caktuar nga titullari i autoritetit kontraktor]"
              />
              .
            </Body>

            <Section title="GRUPI I PUNËS / ZYRTARI PËRGJEGJËS">
              <EditableYellow
                value={grupiPunes}
                onChange={setGrupiPunes}
                invalid={has("grupiPunes")}
                placeholder="Emër Mbiemër – Emërtesa e pozicionit (nënshkrimi)"
                className="min-h-36"
              />
            </Section>
          </div>
        </PunePage>
      </div>
    </AppShell>
  );
}

function PunePage({
  index,
  address,
  children,
}: {
  index: number;
  address: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="mx-auto flex w-full animate-[fade-in_280ms_ease-out] flex-col bg-white px-10 py-12 shadow-md ring-1 ring-border transition-shadow duration-200 hover:shadow-lg print:shadow-none sm:px-16"
      style={{ width: "794px", minHeight: "1123px" }}
    >
      <div className="flex-1">{children}</div>
      <div className="mt-10 border-t border-foreground/30 pt-2 text-center">
        <div
          className="mx-auto max-w-[620px] rounded-sm bg-yellow-100 px-2 py-0.5 text-center italic text-foreground/80"
          style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: "10pt" }}
        >
          {address}
        </div>
        <div className="mt-1 text-right font-serif text-[10px] text-muted-foreground">
          {index} / {TOTAL_PAGES}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 animate-[field-slide-in_240ms_ease-out]">
      <h2 className="font-serif text-[13pt] font-bold tracking-wide text-navy">{title}</h2>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

function Body({ children, italic = false }: { children: React.ReactNode; italic?: boolean }) {
  return (
    <p
      className={italic ? "italic" : undefined}
      style={{
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: "12pt",
        lineHeight: 1.45,
      }}
    >
      {children}
    </p>
  );
}

function GenerationModal({ progress }: { progress: number }) {
  const complete = progress >= 100;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy/45 px-4 backdrop-blur-sm animate-[fade-in_200ms_ease-out]">
      <div className="w-full max-w-md origin-center animate-[scale-in_220ms_ease-out] rounded-lg border border-border bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-navy text-navy-foreground transition-all duration-300">
            {complete ? (
              <CheckCircle2 className="h-6 w-6 animate-[scale-in_300ms_ease-out]" />
            ) : (
              <Loader2 className="h-6 w-6 animate-spin" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gold">
              Gjenerim PDF
            </p>
            <h3 className="mt-1 font-display text-xl font-bold text-navy">
              {complete ? "PDF u përgatit" : "Po përgatitet dokumenti"}
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {complete
                ? "Dokumenti është gati për lidhjen me gjenerimin real."
                : "Ju lutem prisni disa sekonda."}
            </p>
          </div>
        </div>
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold">
            <span className="text-muted-foreground">Progresi</span>
            <span className="tabular-nums text-navy">{progress}%</span>
          </div>
          <div className="relative h-3 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-to-r from-navy via-sky-700 to-emerald-500 transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
            {!complete && (
              <div
                className="absolute inset-y-0 w-24 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"
                style={{ left: `${progress}%` }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
