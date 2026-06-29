import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import {
  Building2,
  CalendarDays,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Inbox,
  Search,
  ShieldCheck,
} from "lucide-react";
import { EmptyStateMotion } from "@/components/EmptyStateMotion";
import { AppShell } from "@/components/layout/AppShell";
import { Pager, usePaged, DEFAULT_PAGE_SIZE } from "@/components/Pager";
import { Button } from "@/components/ui/button";
import { useForms } from "@/lib/forms-store";
import type { FormRecord } from "@/lib/forms-types";
import { formsApi } from "@/lib/api/forms";
import { useFormPdfDownload } from "@/lib/use-form-pdf-download";

const TABS = [
  { value: "all", label: "Të gjithë" },
  { value: "new", label: "Të rinj" },
  { value: "viewed", label: "Të parë" },
  { value: "downloaded", label: "Të shkarkuar" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("sq-AL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ObpPanelPage() {
  const { forms, refresh } = useForms();
  const { download: downloadPdf, pdfState } = useFormPdfDownload();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabValue>("all");
  const [q, setQ] = useState("");

  // Use server-side activity flags from the API (isNewForMe, opbViewedAt, opbDownloadedAt)
  const opbForms = useMemo(
    () =>
      forms
        .filter((f) => f.status === "submitted_to_opb")
        .sort((a, b) => {
          // Unread (isNewForMe) first, then by date
          if (a.isNewForMe && !b.isNewForMe) return -1;
          if (!a.isNewForMe && b.isNewForMe) return 1;
          return a.updatedAt < b.updatedAt ? 1 : -1;
        }),
    [forms],
  );

  const stats = useMemo(() => {
    const authorities = new Set(opbForms.map((f) => f.institucioni).filter(Boolean));
    const newCount = opbForms.filter((f) => f.isNewForMe).length;
    const downloadable = opbForms.filter((f) => f.pdfGeneratedAt || f.document).length;
    return {
      total: opbForms.length,
      newCount,
      downloaded: opbForms.filter((f) => Boolean(f.opbDownloadedAt)).length,
      downloadable,
      authorities: authorities.size,
    };
  }, [opbForms]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return opbForms
      .filter((f) => {
        const viewed = Boolean(f.opbViewedAt);
        const downloaded = Boolean(f.opbDownloadedAt);
        if (tab === "new") return f.isNewForMe;
        if (tab === "viewed") return viewed && !downloaded;
        if (tab === "downloaded") return downloaded;
        return true;
      })
      .filter((f) =>
        term
          ? [
              f.id,
              f.emerFormulari,
              f.emri,
              f.mbiemri,
              f.nid,
              f.institucioni,
              (f.document as import("@/lib/mock-data").FormularDocumentData | undefined)?.kodiCPV,
              (f.document as import("@/lib/mock-data").FormularDocumentData | undefined)?.objektiProkurimit,
            ]
              .join(" ")
              .toLowerCase()
              .includes(term)
          : true,
      );
  }, [opbForms, q, tab]);

  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [tab, q]);
  const paged = usePaged(list, page, DEFAULT_PAGE_SIZE);
  const pageRows = paged.slice;

  function markViewed(id: string) {
    formsApi
      .markViewed(id)
      .then(() => refresh())
      .catch(() => null);
  }

  async function markDownloaded(form: FormRecord) {
    setDownloadingId(form.id);
    try {
      await downloadPdf(form);
    } catch (err) {
      toast.error("Shkarkimi dështoi.", {
        description: err instanceof Error ? err.message : "Provoni sërish.",
      });
    }
    setDownloadingId(null);
    refresh().catch(() => null);
  }

  const statCards = [
    {
      label: "Formularë të marrë",
      value: stats.total,
      icon: Inbox,
      tone: "bg-primary/5 text-primary ring-primary/10",
    },
    {
      label: "Të rinj",
      value: stats.newCount,
      icon: FileText,
      tone: "bg-accent/15 text-[oklch(0.42_0.12_60)] ring-accent/30",
      pulse: stats.newCount > 0,
    },
    {
      label: "PDF të disponueshme",
      value: stats.downloadable,
      icon: FileCheck2,
      tone: "bg-info/10 text-info ring-info/20",
    },
    {
      label: "Autoritete aktive",
      value: stats.authorities,
      icon: Building2,
      tone: "bg-success/10 text-success ring-success/20",
    },
  ];

  return (
    <AppShell
      title="Paneli OPB"
      description="Shiko formularët e dorëzuar nga Autoritetet Kontraktore dhe shkarko dokumentet PDF."
      breadcrumbs={[{ label: "Paneli", to: "/" }, { label: "OPB" }]}
      actions={
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
          <ShieldCheck className="h-3.5 w-3.5" />
          Akses vetëm për lexim
        </span>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="group/stat relative overflow-hidden rounded-xl border bg-card p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
          >
            <div
              className={`grid h-10 w-10 place-items-center rounded-lg ring-1 ring-inset transition-transform duration-200 group-hover/stat:scale-105 ${s.tone}`}
            >
              <s.icon className="h-5 w-5" />
            </div>
            {s.pulse && (
              <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_0_6px_var(--color-accent)/0.12] animate-[login-success-pulse_1.6s_ease-out_infinite]" />
            )}
            <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border bg-card shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-3 border-b px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold">Formularët e dorëzuar</h2>
            <p className="text-xs text-muted-foreground">
              Panel konsultimi: OPB mund të shikojë dhe shkarkojë formularët, pa ndryshuar statusin.
            </p>
          </div>
          <div className="relative max-w-sm flex-1 lg:flex-none lg:w-96">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Kërko institucion, objekt, CPV, ID..."
              className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/40"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto border-b px-3 py-2">
          {TABS.map((t) => {
            const count =
              t.value === "new"
                ? stats.newCount
                : t.value === "viewed"
                  ? opbForms.filter((f) => Boolean(f.opbViewedAt) && !f.opbDownloadedAt).length
                  : t.value === "downloaded"
                    ? stats.downloaded
                    : opbForms.length;
            const active = tab === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-[0.98] ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:-translate-y-px hover:bg-muted hover:text-foreground"
                }`}
              >
                {t.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    active
                      ? "bg-primary-foreground/15 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <ul className="divide-y">
          {pageRows.map((f, idx) => {
            const viewed = Boolean(f.opbViewedAt);
            const downloaded = Boolean(f.opbDownloadedAt);
            const fresh = Boolean(f.isNewForMe);
            const fDoc = f.document as import("@/lib/mock-data").FormularDocumentData | undefined;
            const title =
              fDoc?.titulliProjekti?.trim() ||
              f.emerFormulari ||
              fDoc?.objektiProkurimit ||
              `${f.emri} ${f.mbiemri}`.trim() ||
              f.id;

            return (
              <li
                key={f.id}
                className="group/row px-5 py-4 transition-all duration-200 hover:bg-muted/30"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ring-1 ring-inset transition-transform duration-200 group-hover/row:scale-105 ${
                        fresh
                          ? "bg-accent/15 text-[oklch(0.42_0.12_60)] ring-accent/30"
                          : downloaded
                            ? "bg-success/10 text-success ring-success/20"
                            : "bg-primary/5 text-primary ring-primary/10"
                      }`}
                    >
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold">{title}</p>
                        <span className="font-mono text-[11px] text-muted-foreground">{f.id}</span>
                        {fresh && (
                          <span className="inline-flex items-center rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.42_0.12_60)]">
                            I ri
                          </span>
                        )}
                        {downloaded ? (
                          <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success">
                            I shkarkuar
                          </span>
                        ) : viewed ? (
                          <span className="inline-flex items-center rounded-full bg-primary/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                            I parë
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {f.institucioni}
                        </span>
                        {fDoc?.kodiCPV && (
                          <span className="font-mono">CPV: {fDoc.kodiCPV}</span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          Dorëzuar: {fmt(f.signedUploadedAt ?? f.pdfGeneratedAt ?? f.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:text-primary hover:shadow-sm"
                      onClick={() => markViewed(f.id)}
                    >
                      <Link to="/forms/$id" params={{ id: f.id }}>
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> Shiko
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      disabled={downloadingId === f.id && pdfState !== "idle"}
                      className="group/download bg-primary text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[var(--shadow-elevated)]"
                      onClick={() => markDownloaded(f)}
                    >
                      {downloadingId === f.id && pdfState === "downloading" ? (
                        <>
                          <span className="mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Duke shkarkuar...
                        </>
                      ) : (
                        <>
                          <Download className="mr-1.5 h-3.5 w-3.5 transition-transform duration-200 group-hover/download:translate-y-0.5" />
                          {downloaded ? "Shkarko sërish" : "Shkarko PDF"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
          {list.length === 0 && (
            <li className="px-5 py-16 text-center">
              <EmptyStateMotion
                variant="inbox"
                title="Asnjë formular nuk u gjet"
                description="Provoni një filtër tjetër ose ndryshoni kërkimin."
              />
            </li>
          )}
        </ul>

        <Pager
          page={paged.page}
          pageCount={paged.pageCount}
          total={paged.total}
          pageSize={DEFAULT_PAGE_SIZE}
          onPageChange={setPage}
          label="formularë"
        />
      </div>
    </AppShell>
  );
}
