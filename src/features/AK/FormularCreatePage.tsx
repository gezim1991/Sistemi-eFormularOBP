import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  FileText,
  Info,
  Loader2,
  Save,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useFormulare } from "@/lib/formulare-store";
import { useAuth } from "@/lib/auth-store";
import type { FormularDocumentData } from "@/lib/mock-data";
import { Btn } from "@/components/btn";
import { AppShell } from "@/components/layout/AppShell";
import { EditableYellow, InlineYellow } from "@/components/doc-editor/editable";
import { DropdownPicker, type PickerOption } from "@/components/doc-editor/dropdown-picker";
import { DataTable, type Row } from "@/components/doc-editor/data-table";

/* ───────────────── Catalog options for table pickers ───────────────── */

const AKTE_OPTIONS: PickerOption[] = [
  {
    id: "urdher-zyrtar",
    label:
      "[Sipas rastit, urdhri / akti administrativ për caktimin e zyrtarit / zyrtarëve përgjegjës për hartimin e këtij dokumenti]",
    defaults: { titulli: "" },
  },
  {
    id: "akte-specifike",
    label:
      "[nëse është rasti, të listohen edhe aktet ligjore e nënligjore të legjislacionit specifik ku objekti i prokurimit shtrin ndikimin]",
    defaults: { titulli: "" },
  },
];

const MALLRA_OPTIONS: PickerOption[] = [
  { id: "obp", label: "OBP — Operatori i Burimeve të Përqendruara", defaults: { manuali: "OBP" } },
  { id: "akshi", label: "AKSHI — Katalogu i pajisjeve IT", defaults: { manuali: "AKSHI" } },
  { id: "drej-perg", label: "Drejtoria e Përgjithshme e Doganave", defaults: { manuali: "DPD" } },
  { id: "tjeter-m", label: "Tjetër referencë çmimi", defaults: { manuali: "Tjetër" } },
];

const PUNE_OPTIONS: PickerOption[] = [
  {
    id: "vkm-216",
    label: "VKM nr. 216, datë 13.04.2023 — çmimet e punimeve në ndërtim",
    defaults: { manuali: "VKM 216/2023" },
  },
  {
    id: "vkm-1105",
    label: "VKM nr. 11.05.2016 — tarifat për shërbimet e planifikimit",
    defaults: { manuali: "VKM 11.05.2016" },
  },
  { id: "tjeter-p", label: "Tjetër manual / katalog", defaults: { manuali: "Tjetër" } },
];

const SHERBIME_OPTIONS: PickerOption[] = [
  {
    id: "vkm-319",
    label: "VKM nr. 319, datë 31.05.2018 — menaxhimi i integruar i mbetjeve",
    defaults: { manuali: "VKM 319/2018" },
  },
  { id: "tjeter-s", label: "Tjetër referencë shërbimi", defaults: { manuali: "Tjetër" } },
];

const LEGAL_BULLETS = [
  "Ligjin nr. 162, datë 23.12.2020 “Për prokurimin publik”, i ndryshuar;",
  "Vendimin nr. 285, datë 19.05.2021 të Këshillit të Ministrave, “Për miratimin e Rregullave të Prokurimit Publik”, i ndryshuar;",
  'Vendimin nr. 531, datë 07.09.2023 të Këshillit të Ministrave, “Për krijimin e shoqërisë aksionare shtetërore "Operatori i Blerjeve të Përqëndruara", sh.a.”, i ndryshuar',
];

const BASE_LEGAL_ROWS: Row[] = [
  {
    id: "base-ligj-162",
    _sourceId: "base-ligj-162",
    zgjedhja: "Ligj",
    numri: "162",
    data: "23.12.2020",
    titulli: "Për prokurimin publik",
    konfirmo: "Po",
  },
  {
    id: "base-vkm-285",
    _sourceId: "base-vkm-285",
    zgjedhja: "Vendim i Këshillit të Ministrave",
    numri: "285",
    data: "19.05.2021",
    titulli: "Për miratimin e Rregullave të Prokurimit Publik",
    konfirmo: "Po",
  },
  {
    id: "base-vkm-531",
    _sourceId: "base-vkm-531",
    zgjedhja: "Vendim i Këshillit të Ministrave",
    numri: "531",
    data: "07.09.2023",
    titulli: "Për krijimin e OBP sh.a.",
    konfirmo: "Po",
  },
];

const METHOD_OPTIONS = [
  {
    label: 'Gërma "a" – Bazuar në çmimet e tregut',
    value: "Metoda sipas gërmës “a” të nenit 36(3) të LPP",
    description: "Vlera përllogaritet duke analizuar çmimet aktuale të tregut.",
  },
  {
    label: 'Gërma "b" – Bazuar në kontrata të ngjashme',
    value: "Metoda sipas gërmës “b” të nenit 36(3) të LPP",
    description: "Vlera përllogaritet duke marrë si referencë kontrata të ngjashme.",
  },
  {
    label: 'Gërma "c" – Bazuar në analiza teknike',
    value: "Metoda sipas gërmës “c” të nenit 36(3) të LPP",
    description: "Vlera ndërtohet nga analiza e elementëve të kostos.",
  },
  {
    label: 'Gërma "ç" – Kombinim i metodave',
    value: "Metoda sipas gërmës “ç” të nenit 36(3) të LPP",
    description: "Përdoret kur kombinohen dy ose më shumë metoda.",
  },
];

const calculationMethodInfo = {
  a: METHOD_OPTIONS[0].description,
  b: METHOD_OPTIONS[1].description,
  c: METHOD_OPTIONS[2].description,
  ç: METHOD_OPTIONS[3].description,
};

const CALCULATION_INTRO = `Ne zbatim te parashikimeve te percaktuara ne Vendimin e Keshillit te Ministrave Nr. 285 date 19.05.2021 "Per miratimin e Rregullave te Prokurimit Publik" te ndryshuar, neni 76 "Menyrat per perllogaritjen e vleres se prokurimit" ku citohet:

"1. Ne perllogaritjen e vleres limit te kontrates, autoriteti/enti kontraktor duhet t'i referohet nje ose me shume alternativave te renditura, si me poshte vijon:
a) cmimet e botuara nga Instituti i Statistikave (INSTAT) ose/dhe cmime te tjera zyrtare, te njohura nga institucionet perkatese; ose/dhe
b) studimit te tregut, bazuar ne mesataren e cmimeve te marra nga ky studim; ose/dhe
c) cmimet e kontratave te meparshme, te realizuara nga vete apo nga autoritete te tjera kontraktore; ose/dhe
cc) cmimet nderkombetar te shpallura publikisht.
2. Autoriteti/enti kontraktor, perpara nxjerrjes se urdherit te prokurimit, duhet te argumentoje dhe te dokumentoje perllogaritjen e vleres se kontrates.
3. Per perllogaritjen e vleres limit te kontrates, titullari i autoritetit/entit kontraktor mund te caktoje struktura te posacme."`;


/* ───────────────── Helpers ───────────────── */

const uid = () => Math.random().toString(36).slice(2, 9);

type CpvOption = { label: string; value: string; description: string };

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];
    if (ch === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (ch === '"') quoted = !quoted;
    else if (ch === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else cell += ch;
  }
  cells.push(cell.trim());
  return cells;
}

function parseCpvCsv(csv: string): CpvOption[] {
  return csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(1)
    .map((line) => {
      const cells = parseCsvLine(line);
      const code = cells.at(-1)?.trim() ?? "";
      const name = cells.at(-2)?.trim() ?? "";
      const group = cells.slice(0, -2).join(", ").trim();
      if (!name || !code) return null;
      return { label: name, value: code, description: group ? `${code} · ${group}` : code };
    })
    .filter((x): x is CpvOption => Boolean(x));
}

const parseNum = (v: string | undefined): number => {
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
const rowTotal = (r: Row) => fmtNum(parseNum(r.sasia) * parseNum(r.cmimi));
const sumTotals = (rows: Row[]) => {
  const s = rows.reduce((a, r) => a + parseNum(r.sasia) * parseNum(r.cmimi), 0);
  return s === 0 ? "0.00" : fmtNum(s);
};
const averageOfferPrice = (r: Row) =>
  (parseNum(r.oferta1) + parseNum(r.oferta2) + parseNum(r.oferta3)) / 3;
const averageOfferPriceText = (r: Row) => fmtNum(averageOfferPrice(r));
const rowTotalFromAverageOffers = (r: Row) => fmtNum(parseNum(r.sasia) * averageOfferPrice(r));
const sumTotalsFromAverageOffers = (rows: Row[]) => {
  const s = rows.reduce((a, r) => a + parseNum(r.sasia) * averageOfferPrice(r), 0);
  return s === 0 ? "0.00" : fmtNum(s);
};

function syncRowsFromSelection(selected: string[], options: PickerOption[], prev: Row[]): Row[] {
  const kept = prev.filter((r) => selected.includes(r._sourceId ?? ""));
  const existingIds = new Set(kept.map((r) => r._sourceId));
  const added = selected
    .filter((id) => !existingIds.has(id))
    .map<Row>((id) => {
      const opt = options.find((o) => o.id === id)!;
      return { id: uid(), _sourceId: id, zgjedhja: opt.label, ...(opt.defaults ?? {}) } as Row;
    });
  return [...kept, ...added];
}

function hasFilledRows(rows: Row[]) {
  return rows.some((row) =>
    Object.entries(row).some(
      ([k, v]) => !["id", "_sourceId", "vlera"].includes(k) && String(v ?? "").trim().length > 0,
    ),
  );
}

/* ───────────────── Component ───────────────── */

export function FormularCreatePage({ editId }: { editId?: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { create, get, update, generatePdf } = useFormulare();
  const existingFormular = editId ? get(editId) : undefined;
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [hydratedEditId, setHydratedEditId] = useState<string | null>(null);
  const [showGenerateShortcut, setShowGenerateShortcut] = useState(false);
  const [generatePulse, setGeneratePulse] = useState(false);
  const [cpvOptions, setCpvOptions] = useState<CpvOption[]>([]);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const has = (key: string) => errors.has(key);

  const [titulliProjekti, setTitulliProjekti] = useState("");
  const [adresaFooter, setAdresaFooter] = useState("");
  const [emertimiInst, setEmertimiInst] = useState("");

  // Auto-fill institution fields from user profile when creating a new form
  useEffect(() => {
    if (editId || !user) return;
    const inst = user.institucioni ?? "";
    const nipt = user.nipt ? `, NIPT: ${user.nipt}` : "";
    setEmertimiInst((prev) => prev || inst + nipt);
    setAdresaFooter((prev) => prev || (user.adresaInstitucioni ?? ""));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, editId]);
  const [objektiProkurimit, setObjektiProkurimit] = useState("");
  const [kodiCPV, setKodiCPV] = useState("");
  const [panoramaObjektivat, setPanoramaObjektivat] = useState("");

  const [bazaSelected, setBazaSelected] = useState<string[]>([]);
  const [bazaRows, setBazaRows] = useState<Row[]>(BASE_LEGAL_ROWS);

  const [tab1Rows, setTab1Rows] = useState<Row[]>([
    { id: uid(), emertimi: "", njesia: "", sasia: "", cpv: "" },
  ]);
  const [tab2Rows, setTab2Rows] = useState<Row[]>([
    { id: uid(), emertimi: "", njesia: "", specifikime: "", metodologjia: "", argumentimi: "" },
  ]);

  const [mallraSel, setMallraSel] = useState<string[]>([]);
  const [mallraRows, setMallraRows] = useState<Row[]>([]);
  const [puneSel, setPuneSel] = useState<string[]>([]);
  const [puneRows, setPuneRows] = useState<Row[]>([]);
  const [sherbimeSel, setSherbimeSel] = useState<string[]>([]);
  const [sherbimeRows, setSherbimeRows] = useState<Row[]>([]);
  const [neni76Open, setNeni76Open] = useState<"a" | "b" | "c" | "ç" | null>("a");
  const [neni76AOpen, setNeni76AOpen] = useState<"mallra" | "pune" | "sherbime" | null>(null);
  const [neni76BRows, setNeni76BRows] = useState<Row[]>([
    {
      id: uid(),
      emertimi: "",
      njesia: "",
      sasia: "",
      oferta1: "",
      oferta2: "",
      oferta3: "",
      cmimi: "",
    },
  ]);
  const [neni76CRows, setNeni76CRows] = useState<Row[]>([
    { id: uid(), emertimi: "", njesia: "", sasia: "", cmimi: "" },
  ]);
  const [neni76CcRows, setNeni76CcRows] = useState<Row[]>([
    { id: uid(), burimi: "", nrKodi: "", emertimi: "", njesia: "", sasia: "", cmimi: "" },
  ]);

  const [grafiku, setGrafiku] = useState("");
  const [grafikuFileName, setGrafikuFileName] = useState("");

  const [kontaktEmer, setKontaktEmer] = useState("");
  const [kontaktEmail, setKontaktEmail] = useState("");
  const [kontaktTel, setKontaktTel] = useState("");
  const [grupiPunes, setGrupiPunes] = useState("");

  const [tableHeaders, setTableHeaders] = useState<Record<string, Record<string, string>>>({});
  const setTH = (tableId: string) => (headers: Record<string, string>) =>
    setTableHeaders((prev) => ({ ...prev, [tableId]: headers }));

  const hasNeni76Mallra = hasFilledRows(mallraRows);
  const hasNeni76Pune = hasFilledRows(puneRows);
  const hasNeni76Sherbime = hasFilledRows(sherbimeRows);
  const hasNeni76A = hasNeni76Mallra || hasNeni76Pune || hasNeni76Sherbime;
  const hasNeni76B = hasFilledRows(neni76BRows);
  const hasNeni76C = hasFilledRows(neni76CRows);
  const hasNeni76Cc = hasFilledRows(neni76CcRows);

  useEffect(() => {
    fetch("/cpv-codes.csv")
      .then((r) => (r.ok ? r.text() : ""))
      .then((csv) => setCpvOptions(csv ? parseCpvCsv(csv) : []))
      .catch(() => setCpvOptions([]));
  }, []);

  useEffect(() => {
    if (!editId || !existingFormular || hydratedEditId === editId) return;
    const doc = existingFormular.document;
    setTitulliProjekti(doc?.titulliProjekti || existingFormular.emerFormulari);
    setAdresaFooter(doc?.adresaFooter || existingFormular.data.adresa);
    setEmertimiInst(doc?.emertimiInst || existingFormular.data.institucioni);
    setObjektiProkurimit(doc?.objektiProkurimit || existingFormular.emerFormulari);
    setKodiCPV(doc?.kodiCPV || "");
    setPanoramaObjektivat(doc?.panoramaObjektivat || existingFormular.data.arsyeja);
    setBazaRows(doc?.bazaRows?.length ? (doc.bazaRows as Row[]) : BASE_LEGAL_ROWS);
    setTab1Rows(
      (doc?.tab1Rows?.length
        ? doc.tab1Rows
        : [{ id: uid(), emertimi: "", njesia: "", sasia: "", cpv: "" }]) as Row[],
    );
    setTab2Rows(
      (doc?.tab2Rows?.length
        ? doc.tab2Rows
        : [
            {
              id: uid(),
              emertimi: "",
              njesia: "",
              specifikime: "",
              metodologjia: "",
              argumentimi: "",
            },
          ]) as Row[],
    );
    setMallraRows((doc?.mallraRows || []) as Row[]);
    setPuneRows((doc?.puneRows || []) as Row[]);
    setSherbimeRows((doc?.sherbimeRows || []) as Row[]);
    if (doc?.neni76BRows?.length) setNeni76BRows(doc.neni76BRows as Row[]);
    if (doc?.neni76CRows?.length) setNeni76CRows(doc.neni76CRows as Row[]);
    if (doc?.neni76CcRows?.length) setNeni76CcRows(doc.neni76CcRows as Row[]);
    if (doc?.tableHeaders) setTableHeaders(doc.tableHeaders);
    setGrafiku(doc?.grafiku || "");
    setGrafikuFileName(doc?.grafikuFileName || "");
    setKontaktEmer(
      doc?.kontaktEmer || `${existingFormular.data.emri} ${existingFormular.data.mbiemri}`.trim(),
    );
    setKontaktEmail(doc?.kontaktEmail || existingFormular.data.email);
    setKontaktTel(doc?.kontaktTel || existingFormular.data.telefon);
    setGrupiPunes(doc?.grupiPunes || "");
    setHydratedEditId(editId);
  }, [editId, existingFormular, hydratedEditId]);

  const onBazaChange = (ids: string[]) => {
    setBazaSelected(ids);
    setBazaRows((prev) => {
      const baseRows = prev.filter((r) => String(r._sourceId || "").startsWith("base-"));
      const selectedRows = syncRowsFromSelection(
        ids,
        AKTE_OPTIONS,
        prev.filter((r) => !String(r._sourceId || "").startsWith("base-")),
      );
      return [...(baseRows.length ? baseRows : BASE_LEGAL_ROWS), ...selectedRows];
    });
  };
  const onMallraChange = (ids: string[]) => {
    setMallraSel(ids);
    setMallraRows((p) => syncRowsFromSelection(ids, MALLRA_OPTIONS, p));
  };
  const onPuneChange = (ids: string[]) => {
    setPuneSel(ids);
    setPuneRows((p) => syncRowsFromSelection(ids, PUNE_OPTIONS, p));
  };
  const onSherbimeChange = (ids: string[]) => {
    setSherbimeSel(ids);
    setSherbimeRows((p) => syncRowsFromSelection(ids, SHERBIME_OPTIONS, p));
  };

  // Silence unused-var warnings for selection state (still used for UI source-of-truth)
  void bazaSelected;
  void mallraSel;
  void puneSel;
  void sherbimeSel;
  void hasNeni76C;

  const docTitle = useMemo(
    () => titulliProjekti.trim() || "Modeli i dokumentit për planifikimin e prokurimit",
    [titulliProjekti],
  );
  const hasGeneratedPdf = Boolean(existingFormular && existingFormular.status !== "draft");
  const generateButtonText = hasGeneratedPdf ? "Rigjenero PDF" : "Gjenero PDF";

  useEffect(() => {
    if (!generating) return;
    const timer = window.setInterval(() => {
      setGenerationProgress((c) => {
        if (c >= 100) return 100; // don't reset once API has responded
        return c >= 90 ? 90 : Math.min(c + Math.floor(Math.random() * 9) + 6, 90);
      });
    }, 180);
    return () => window.clearInterval(timer);
  }, [generating]);

  // Navigate when progress reaches 100% (set manually after API returns)
  useEffect(() => {
    if (!generating || generationProgress < 100) return;
    const t = window.setTimeout(() => {
      setGenerating(false);
      toast.success(hasGeneratedPdf ? "PDF u rigjenerua." : "PDF u gjenerua me sukses.");
      navigate({ to: "/forms" });
    }, 400);
    return () => window.clearTimeout(t);
  }, [generating, generationProgress, hasGeneratedPdf, navigate]);

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

  // (navigation handled by the generationProgress >= 100 effect above)

  const validate = (): { ok: boolean; missing: string[] } => {
    const errSet = new Set<string>();
    const missing: string[] = [];
    const req = (val: string, key: string, label: string) => {
      if (!val.trim()) {
        errSet.add(key);
        missing.push(label);
      }
    };
    req(titulliProjekti, "titulliProjekti", "Titulli i projektit");
    req(adresaFooter, "adresaFooter", "Adresa në footer");
    req(emertimiInst, "emertimiInst", "Emërtimi i institucionit");
    req(objektiProkurimit, "objektiProkurimit", "Objekti i prokurimit");
    req(kodiCPV, "kodiCPV", "Kodi CPV");
    if (kodiCPV.trim() && !/^\d{8}-\d$/.test(kodiCPV.trim())) {
      errSet.add("kodiCPV");
      missing.push("Kodi CPV duhet të jetë në formatin xxxxxxxx-x");
    }
    req(panoramaObjektivat, "panoramaObjektivat", "Panoramë e përgjithshme");
    if (!hasFilledRows(tab1Rows)) missing.push("Të paktën një rresht në Tabelën nr.1 (nevojat)");
    if (!hasFilledRows(tab2Rows))
      missing.push("Të paktën një rresht në Tabelën nr.2 (specifikimet)");
    if (!hasNeni76A && !hasNeni76B && !hasNeni76C && !hasNeni76Cc) {
      missing.push("Të paktën një metodë përllogaritjeje sipas nenit 76");
    }
    req(kontaktEmer, "kontaktEmer", "Emër Mbiemër i kontaktit");
    req(kontaktEmail, "kontaktEmail", "E-mail i kontaktit");
    if (kontaktEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(kontaktEmail.trim())) {
      errSet.add("kontaktEmail");
      missing.push("E-mail i pavlefshëm");
    }
    req(kontaktTel, "kontaktTel", "Numër telefoni");
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
        toast.error("Plotëso fushat e detyrueshme", {
          description: `${preview}${extra}`,
        });
        return;
      }
    }
    const document: FormularDocumentData = {
      adresaFooter,
      titulliProjekti,
      emertimiInst,
      objektiProkurimit,
      kodiCPV,
      panoramaObjektivat,
      bazaRows: bazaRows as Array<Record<string, string>>,
      nevojaArgument: "",
      nevojaPlanifikim: "",
      tab1Rows: tab1Rows as Array<Record<string, string>>,
      tab2Rows: tab2Rows as Array<Record<string, string>>,
      mallraRows: mallraRows as Array<Record<string, string>>,
      puneRows: puneRows as Array<Record<string, string>>,
      sherbimeRows: sherbimeRows as Array<Record<string, string>>,
      neni76BRows: neni76BRows as Array<Record<string, string>>,
      neni76CRows: neni76CRows as Array<Record<string, string>>,
      neni76CcRows: neni76CcRows as Array<Record<string, string>>,
      tableHeaders,
      grafiku,
      grafikuFileName,
      kontaktEmer,
      kontaktEmail,
      kontaktTel,
      grupiPunes,
    };
    const data = {
      emri: kontaktEmer.split(" ")[0] ?? "",
      mbiemri: kontaktEmer.split(" ").slice(1).join(" "),
      email: kontaktEmail,
      telefon: kontaktTel,
      institucioni: emertimiInst,
      arsyeja: panoramaObjektivat || objektiProkurimit,
      adresa: adresaFooter,
    };

    try {
      const f = editId && existingFormular ? existingFormular : await create(docTitle, data);
      await update(f.id, {
        ...data,
        emerFormulari: docTitle,
        document,
      });

      if (!generate) {
        toast.success("Drafti u ruajt.");
        navigate({ to: "/forms" });
        return;
      }

      // Start animation then call backend PDF generation
      setErrors(new Set());
      setGenerationProgress(0);
      setGenerating(true);

      generatePdf(f.id)
        .then(() => {
          setGenerationProgress(100); // triggers navigate via useEffect
        })
        .catch((genErr) => {
          setGenerating(false);
          setGenerationProgress(0);
          toast.error("Gabim gjatë gjenerimit të PDF.", {
            description: genErr instanceof Error ? genErr.message : "Provoni sërish.",
          });
        });
    } catch (err) {
      toast.error("Gabim gjatë ruajtjes.", {
        description: err instanceof Error ? err.message : "Provoni sërish.",
      });
    }
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
        {generating
          ? hasGeneratedPdf
            ? "Duke rigjeneruar..."
            : "Duke gjeneruar..."
          : generateButtonText}
      </Btn>
    </>
  );

  const jumpToGenerate = () => {
    setGeneratePulse(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => {
      document.getElementById("generate-pdf-action")?.focus({ preventScroll: true });
    }, 450);
    window.setTimeout(() => setGeneratePulse(false), 1100);
  };

  return (
    <AppShell
      title={docTitle}
      description="Plotëso me kujdes të gjitha fushat e detyrueshme përpara se të gjenerosh PDF-në."
      collapsedNav
      breadcrumbs={[
        { label: "Formularët", to: "/forms" },
        { label: editId ? "Edito" : "Krijo i ri" },
      ]}
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

      <div className="mx-auto flex max-w-[900px] flex-col gap-8 print:gap-0">
        <Page index={1} total={8} address={adresaFooter} onAddressChange={setAdresaFooter}>
          <div className="flex flex-col items-center justify-center" style={{ minHeight: "900px" }}>
            <EditableYellow
              invalid={has("titulliProjekti")}
              value={titulliProjekti}
              onChange={setTitulliProjekti}
              placeholder="Këtu shënohet vetëm titulli i projektit / objekti i procedurës së prokurimit"
              className="text-center"
              style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: "12pt" }}
            />
          </div>
        </Page>

        <Page index={2} total={8} address={adresaFooter} onAddressChange={setAdresaFooter}>
          <Section title="HYRJE">
            <p className="font-serif text-[14px] leading-relaxed text-foreground">
              Ky relacion, mbahet pranë autoritetit / enti kontraktor
              <InlineYellow
                invalid={has("emertimiInst")}
                value={emertimiInst}
                onChange={setEmertimiInst}
                placeholder="[emërtimi i plotë i institucionit dhe NIPT]"
                width="20rem"
              />
              , për identifikimin e nevojave, hartimin e specifikimeve teknike dhe përllogaritjen e
              vlerës së prokurimit për procedurën me objekt
              <InlineYellow
                invalid={has("objektiProkurimit")}
                value={objektiProkurimit}
                onChange={setObjektiProkurimit}
                placeholder="[objekti i prokurimit]"
                width="20rem"
              />
              . Kodi (CPV) sipas fjalorit të përbashkët të prokurimit:
              <InlineYellow
                invalid={has("kodiCPV")}
                value={kodiCPV}
                onChange={setKodiCPV}
                placeholder="[xxxxxxxx-x]"
                width="10rem"
              />
              .
            </p>
            <div className="mt-3">
              <EditableYellow
                invalid={has("panoramaObjektivat")}
                value={panoramaObjektivat}
                onChange={setPanoramaObjektivat}
                placeholder="[Panoramë e përgjithshme mbi situatën aktuale dhe objektivat e prokurimit]"
              />
            </div>
          </Section>
        </Page>

        <Page index={3} total={8} address={adresaFooter} onAddressChange={setAdresaFooter}>
          <Section title="BAZA LIGJORE">
            <p className="font-serif text-[14px] leading-relaxed">
              Ky relacion u hartua bazuar në:
            </p>
            <ul className="ml-8 list-['-_'] space-y-2 font-serif text-[14px] leading-relaxed">
              {LEGAL_BULLETS.map((item) => (
                <li key={item} className="pl-2">
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <DropdownPicker
                label="Zgjidh aktet shtesë ligjore"
                hint="Çdo akt i përzgjedhur shtohet si rresht në tabelën më poshtë."
                options={AKTE_OPTIONS}
                selected={bazaSelected}
                onChange={onBazaChange}
              />
            </div>
            <DataTable
              columns={[
                { key: "zgjedhja", header: "Zgjidh llojin e aktit", width: "30%", placeholder: "p.sh. Ligj, Vendim KM..." },
                { key: "numri", header: "Numri i aktit", placeholder: "p.sh. 162" },
                { key: "data", header: "Data / Viti", placeholder: "23.12.2020" },
                { key: "titulli", header: "Titulli" },
                { key: "konfirmo", header: "Konfirmo", choices: ["Po", "Jo"] },
              ]}
              rows={bazaRows}
              onChange={setBazaRows}
              customHeaders={tableHeaders.baza}
              onHeadersChange={setTH("baza")}
            />
          </Section>
        </Page>

        <Page index={4} total={8} address={adresaFooter} onAddressChange={setAdresaFooter}>
          <Section title="I. IDENTIFIKIMI I NEVOJAVE DHE SASIA">
            <p className="mt-3 font-serif text-[14px] italic">Tabela nr. 1</p>
            <DataTable
              showIndex
              columns={[
                { key: "emertimi", header: "Emërtimi i artikullit / Shërbimit" },
                { key: "njesia", header: "Njësia", width: "14%" },
                { key: "sasia", header: "Sasia", width: "14%", numeric: true },
                {
                  key: "cpv",
                  header: "Kodi CPV",
                  width: "28%",
                  placeholder: cpvOptions.length
                    ? "Kliko për të kërkuar kodin CPV"
                    : "Po ngarkohen kodet CPV...",
                  searchChoices: cpvOptions,
                  searchTitle: "Kërko kodin CPV",
                  searchPlaceholder: "Shkruaj emërtim ose kod...",
                  searchEmptyText: "Nuk u gjet asnjë kod CPV.",
                },
              ]}
              rows={tab1Rows}
              onChange={setTab1Rows}
              customHeaders={tableHeaders.tab1}
              onHeadersChange={setTH("tab1")}
            />
          </Section>
        </Page>

        <Page index={5} total={8} address={adresaFooter} onAddressChange={setAdresaFooter}>
          <Section title="II. HARTIMI I SPECIFIKIMEVE TEKNIKE">
            <p className="mt-3 font-serif text-[14px] italic">Tabela nr. 2</p>
            <DataTable
              showIndex
              columns={[
                { key: "emertimi", header: "Emërtimi i artikullit" },
                { key: "njesia", header: "Njësia", width: "10%" },
                { key: "specifikime", header: "Specifikimet teknike" },
                {
                  key: "metodologjia",
                  header: "Metodologjia",
                  placeholder: "Zgjidh metodën",
                  modalChoices: METHOD_OPTIONS,
                  modalTitle: "Metoda sipas nenit 36(3) të LPP",
                  modalDescription: "Kliko një nga alternativat për ta plotësuar automatikisht.",
                },
                { key: "argumentimi", header: "Argumentimi teknik" },
              ]}
              rows={tab2Rows}
              onChange={setTab2Rows}
              customHeaders={tableHeaders.tab2}
              onHeadersChange={setTH("tab2")}
            />
          </Section>
        </Page>

        <Page index={6} total={8} address={adresaFooter} onAddressChange={setAdresaFooter}>
          <Section title="III. PËRLLOGARITJA E VLERËS SË PARASHIKUAR">
            <div className="space-y-3 font-serif text-[14px] leading-relaxed">
              <p className="whitespace-pre-line">{CALCULATION_INTRO}</p>
            </div>

            <div className="mt-5 font-sans">
              <ToggleButton
                active={neni76Open === "a" || hasNeni76A}
                info={calculationMethodInfo.a}
                onClick={() => setNeni76Open(neni76Open === "a" ? null : "a")}
              >
                Përllogaritja sipas gërmës “a” të nenit 76
              </ToggleButton>
            </div>
            <SlidePanel open={neni76Open === "a" || hasNeni76A}>
              <ToggleButton
                active={neni76AOpen === "mallra" || hasNeni76Mallra}
                onClick={() => setNeni76AOpen(neni76AOpen === "mallra" ? null : "mallra")}
              >
                1.1. Manuale / katalogë për mallra
              </ToggleButton>
              <SlidePanel open={neni76AOpen === "mallra" || hasNeni76Mallra}>
                <DropdownPicker
                  label="Zgjidh manualet / katalogët për mallra"
                  options={MALLRA_OPTIONS}
                  selected={mallraSel}
                  onChange={onMallraChange}
                />
                <ValueReferenceTable
                  rows={mallraRows}
                  onChange={setMallraRows}
                  customHeaders={tableHeaders.mallra}
                  onHeadersChange={setTH("mallra")}
                />
              </SlidePanel>
              <ToggleButton
                active={neni76AOpen === "pune" || hasNeni76Pune}
                onClick={() => setNeni76AOpen(neni76AOpen === "pune" ? null : "pune")}
              >
                1.2. Manuale / katalogë për punë publike
              </ToggleButton>
              <SlidePanel open={neni76AOpen === "pune" || hasNeni76Pune}>
                <DropdownPicker
                  label="Zgjidh manualet për punë publike"
                  options={PUNE_OPTIONS}
                  selected={puneSel}
                  onChange={onPuneChange}
                />
                <ValueReferenceTable
                  rows={puneRows}
                  onChange={setPuneRows}
                  customHeaders={tableHeaders.pune}
                  onHeadersChange={setTH("pune")}
                />
              </SlidePanel>
              <ToggleButton
                active={neni76AOpen === "sherbime" || hasNeni76Sherbime}
                onClick={() => setNeni76AOpen(neni76AOpen === "sherbime" ? null : "sherbime")}
              >
                1.3. Manuale / katalogë për shërbime
              </ToggleButton>
              <SlidePanel open={neni76AOpen === "sherbime" || hasNeni76Sherbime}>
                <DropdownPicker
                  label="Zgjidh manualet për shërbime"
                  options={SHERBIME_OPTIONS}
                  selected={sherbimeSel}
                  onChange={onSherbimeChange}
                />
                <ValueReferenceTable
                  rows={sherbimeRows}
                  onChange={setSherbimeRows}
                  customHeaders={tableHeaders.sherbime}
                  onHeadersChange={setTH("sherbime")}
                />
              </SlidePanel>
            </SlidePanel>

            <div className="mt-2 space-y-2 font-sans">
              <ToggleButton
                active={neni76Open === "b" || hasNeni76B}
                info={calculationMethodInfo.b}
                onClick={() => setNeni76Open(neni76Open === "b" ? null : "b")}
              >
                Përllogaritja sipas gërmës “b” të nenit 76
              </ToggleButton>
              <SlidePanel open={neni76Open === "b" || hasNeni76B}>
                <DataTable
                  columns={[
                    { key: "emertimi", header: "Emërtimi i artikullit", width: "15%" },
                    { key: "njesia", header: "Njësia", width: "8%" },
                    { key: "sasia", header: "Sasia", width: "8%", numeric: true },
                    { key: "oferta1", header: "Oferta 1", width: "13%" },
                    { key: "oferta2", header: "Oferta 2", width: "13%" },
                    { key: "oferta3", header: "Oferta 3", width: "13%" },
                    {
                      key: "cmimi",
                      header: "Çmimi mesatar/njësi",
                      width: "16%",
                      numeric: true,
                      compute: averageOfferPriceText,
                    },
                    {
                      key: "vlera",
                      header: "Vlera totale",
                      width: "14%",
                      numeric: true,
                      compute: rowTotalFromAverageOffers,
                    },
                  ]}
                  rows={neni76BRows}
                  onChange={setNeni76BRows}
                  customHeaders={tableHeaders.neni76b}
                  onHeadersChange={setTH("neni76b")}
                  footerRow={{ label: "Totali (pa TVSH)", compute: sumTotalsFromAverageOffers }}
                />
              </SlidePanel>

              <ToggleButton
                active={neni76Open === "c" || hasNeni76C}
                info={calculationMethodInfo.c}
                onClick={() => setNeni76Open(neni76Open === "c" ? null : "c")}
              >
                Përllogaritja sipas gërmës “c” të nenit 76
              </ToggleButton>
              <SlidePanel open={neni76Open === "c" || hasNeni76C}>
                <DataTable
                  columns={[
                    { key: "emertimi", header: "Emërtimi i artikullit" },
                    { key: "njesia", header: "Njësia", width: "10%" },
                    { key: "sasia", header: "Sasia", width: "10%", numeric: true },
                    { key: "cmimi", header: "Çmimi/njësi (pa TVSH)", width: "16%", numeric: true },
                    {
                      key: "vlera",
                      header: "Vlera totale",
                      width: "14%",
                      numeric: true,
                      compute: rowTotal,
                    },
                  ]}
                  rows={neni76CRows}
                  onChange={setNeni76CRows}
                  customHeaders={tableHeaders.neni76c}
                  onHeadersChange={setTH("neni76c")}
                  footerRow={{ label: "Totali (pa TVSH)", compute: sumTotals }}
                />
              </SlidePanel>

              <ToggleButton
                active={neni76Open === "ç" || hasNeni76Cc}
                info={calculationMethodInfo.ç}
                onClick={() => setNeni76Open(neni76Open === "ç" ? null : "ç")}
              >
                Përllogaritja sipas gërmës “ç” të nenit 76
              </ToggleButton>
              <SlidePanel open={neni76Open === "ç" || hasNeni76Cc}>
                <DataTable
                  columns={[
                    { key: "burimi", header: "Burimi" },
                    { key: "nrKodi", header: "Nr. / Kodi" },
                    { key: "emertimi", header: "Emërtimi" },
                    { key: "njesia", header: "Njësia", width: "8%" },
                    { key: "sasia", header: "Sasia", width: "8%", numeric: true },
                    { key: "cmimi", header: "Çmimi/njësi", width: "14%", numeric: true },
                    {
                      key: "vlera",
                      header: "Vlera totale",
                      width: "14%",
                      numeric: true,
                      compute: rowTotal,
                    },
                  ]}
                  rows={neni76CcRows}
                  onChange={setNeni76CcRows}
                  customHeaders={tableHeaders.neni76cc}
                  onHeadersChange={setTH("neni76cc")}
                  footerRow={{ label: "Totali (pa TVSH)", compute: sumTotals }}
                />
              </SlidePanel>
            </div>
          </Section>
        </Page>

        <Page index={7} total={8} address={adresaFooter} onAddressChange={setAdresaFooter}>
          <Section title="IV. GRAFIKU I LËVRIMIT">
            <p className="font-serif text-[14px] leading-relaxed">
              Autoriteti / enti kontraktor duhet të përcaktojë grafikun e lëvrimit.
            </p>
            <EditableYellow
              value={grafiku}
              onChange={setGrafiku}
              placeholder="(Tekst i lirë ose upload grafikun)"
            />
            <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-navy/30 bg-white px-4 py-3 text-sm font-semibold text-navy transition-all duration-150 hover:-translate-y-0.5 hover:border-gold hover:bg-gold/10 hover:shadow-md print:hidden">
              <Upload className="h-4 w-4" />
              <span>{grafikuFileName || "Ngarko grafikun si PDF ose format tjetër"}</span>
              <input
                type="file"
                className="sr-only"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                onChange={(e) => setGrafikuFileName(e.target.files?.[0]?.name || "")}
              />
            </label>
          </Section>
        </Page>

        <Page index={8} total={8} address={adresaFooter} onAddressChange={setAdresaFooter}>
          <Section title="PERSONI I KONTAKTIT / KOORDINATORI">
            <div className="overflow-hidden rounded-md border border-navy/20">
              <table className="w-full font-serif text-[14px]">
                <tbody>
                  <ContactRow label="Emër Mbiemër" value={kontaktEmer} onChange={setKontaktEmer} />
                  <ContactRow label="E-mail" value={kontaktEmail} onChange={setKontaktEmail} />
                  <ContactRow label="Nr. telefoni" value={kontaktTel} onChange={setKontaktTel} />
                </tbody>
              </table>
            </div>
          </Section>
          <Section title="GRUPI I PUNËS / ZYRTARI PËRGJEGJËS">
            <EditableYellow
              value={grupiPunes}
              onChange={setGrupiPunes}
              placeholder="[Anëtarët e grupit të punës — Emër Mbiemër, pozicioni, nënshkrimi]"
            />
          </Section>
        </Page>
      </div>
    </AppShell>
  );
}

/* ───────────────── Helpers ───────────────── */

function Page({
  index,
  total,
  address,
  onAddressChange,
  children,
}: {
  index: number;
  total: number;
  address: string;
  onAddressChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative mx-auto w-full animate-[fade-in_280ms_ease-out] bg-white px-10 py-12 shadow-md ring-1 ring-border transition-shadow duration-200 hover:shadow-lg print:shadow-none sm:px-16"
      style={{ minHeight: "1123px", width: "794px" }}
    >
      {index === 1 && (
        <p className="font-serif text-[14px] font-bold text-navy">
          SHTOJCA 2 – Modeli i dokumentit për planifikimin e prokurimit
          <sup className="text-[9px]">1</sup>
        </p>
      )}
      <div className="pb-24">{children}</div>
      <div className="absolute inset-x-10 bottom-6 sm:inset-x-16">
        <div className="border-t border-foreground/20 pt-2 text-center">
          <input
            type="text"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="Adresa e autoritetit / entit kontraktor"
            className={
              "w-full text-center italic outline-none rounded-sm px-2 py-0.5 transition-all duration-200 focus:ring-2 focus:ring-yellow-300 placeholder:italic placeholder:text-navy/60 " +
              (address.trim()
                ? "bg-transparent text-foreground/80 hover:bg-yellow-50 focus:bg-yellow-100/80 focus:not-italic"
                : "border border-yellow-400/70 bg-yellow-100/80 text-navy animate-pulse")
            }
            style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: "10pt" }}
          />
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
    <section className="mt-10 animate-[field-slide-in_240ms_ease-out]">
      <h2 className="font-serif text-[15px] font-bold tracking-wide text-navy">{title}</h2>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

function ToggleButton({
  active,
  children,
  onClick,
  info,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  info?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full rounded-md border px-4 py-3 text-left text-sm font-semibold transition-all duration-200 active:scale-[0.997] ${
        active
          ? "border-gold bg-gold/15 text-navy shadow-sm"
          : "border-navy/20 bg-white text-navy hover:border-gold hover:bg-gold/10 hover:shadow-sm"
      }`}
    >
      <span className={info ? "block pr-9" : undefined}>{children}</span>
      {info && (
        <span
          className="group/info absolute right-3 top-3 inline-flex"
          onClick={(e) => e.stopPropagation()}
        >
          <span
            tabIndex={0}
            aria-label="Shpjegim"
            className="grid h-5 w-5 place-items-center rounded-full border border-navy/25 bg-white text-navy shadow-sm outline-none transition-all hover:scale-110 hover:border-gold hover:bg-gold/15"
          >
            <Info className="h-3.5 w-3.5" />
          </span>
          <span className="pointer-events-none absolute right-0 top-7 z-40 hidden w-80 origin-top-right rounded-md border border-navy/15 bg-white px-3 py-2 text-left text-xs font-normal leading-5 text-foreground shadow-lg group-hover/info:block group-focus-within/info:block">
            {info}
          </span>
        </span>
      )}
    </button>
  );
}

function SlidePanel({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
    >
      <div className="overflow-hidden">
        <div className="pt-3">{children}</div>
      </div>
    </div>
  );
}

function ValueReferenceTable({
  rows,
  onChange,
  customHeaders,
  onHeadersChange,
}: {
  rows: Row[];
  onChange: (rows: Row[]) => void;
  customHeaders?: Record<string, string>;
  onHeadersChange?: (headers: Record<string, string>) => void;
}) {
  return (
    <DataTable
      columns={[
        { key: "manuali", header: "Manuali / Katalogu", width: "22%", placeholder: "p.sh. OBP, AKSHI..." },
        { key: "nrRendor", header: "Nr. Rendor", width: "17%" },
        { key: "emertimi", header: "Emertimi", width: "15%" },
        { key: "njesia", header: "Njesia", width: "10%" },
        { key: "sasia", header: "Sasia", width: "10%", numeric: true },
        { key: "cmimi", header: "Cmimi/njesi", width: "14%", numeric: true },
        { key: "vlera", header: "Vlera totale", width: "14%", numeric: true, compute: rowTotal },
      ]}
      rows={rows}
      onChange={onChange}
      customHeaders={customHeaders}
      onHeadersChange={onHeadersChange}
      footerRow={{ label: "Totali (pa TVSH)", compute: sumTotals }}
    />
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
              {complete ? "PDF u gjenerua" : "Po gjenerohet dokumenti"}
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {complete ? "Po të çojmë te lista e formularëve." : "Ju lutem prisni disa sekonda."}
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

function ContactRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <tr className="border-b border-navy/15 last:border-b-0">
      <td className="w-44 border-r border-navy/15 bg-navy/5 px-3 py-2 font-semibold text-navy">
        {label}
      </td>
      <td className="p-0">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full bg-transparent px-3 text-foreground outline-none transition-colors focus:bg-yellow-50"
        />
      </td>
    </tr>
  );
}
