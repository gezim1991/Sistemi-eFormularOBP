import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  FileDown,
  FileText,
  Filter,
  Trash2,
  Upload,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyStateMotion } from "@/components/EmptyStateMotion";
import { Pager, usePaged, DEFAULT_PAGE_SIZE } from "@/components/Pager";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useForms } from "@/lib/forms-store";
import { useAuth } from "@/lib/auth-store";
import { STATUS_META, type FormStatus } from "@/lib/forms-types";
import { canBeSeenByOpb, getOpbFreshCount } from "@/features/OBP/opbActivity";
import { formsApi } from "@/lib/api/forms";
import { toast } from "sonner";

export const ALL_STATUSES: FormStatus[] = [
  "draft",
  "pdf_generated",
  "signed_uploaded",
  "submitted_to_opb",
  "archived",
  "verified",
  "rejected",
];

export type FormsSearch = { status?: FormStatus };

const FILTERS: { value: FormStatus | "all"; label: string }[] = [
  { value: "all", label: "Të gjithë" },
  { value: "draft", label: STATUS_META.draft.label },
  { value: "pdf_generated", label: STATUS_META.pdf_generated.label },
  { value: "signed_uploaded", label: STATUS_META.signed_uploaded.label },
  { value: "submitted_to_opb", label: STATUS_META.submitted_to_opb.label },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("sq-AL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const INTRO_MAX_ICONS = 6;
const INTRO_FLY_MS = 1700;
const INTRO_STAGGER_MS = 110;
const INTRO_ROW_DELAY_MS = 90;

export function FormsListPage({ search }: { search: FormsSearch }) {
  const { forms, remove, unseenCount, markFormsSeen, refresh } = useForms();

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm("A jeni i sigurt që doni ta fshini këtë formular?")) return;
      try {
        await remove(id);
        toast.success("Formulari u fshi.");
      } catch {
        toast.error("Gabim gjatë fshirjes.");
      }
    },
    [remove],
  );

  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadPending, setUploadPending] = useState(false);

  const handleUploadClick = useCallback((id: string) => {
    setUploadingId(id);
    uploadInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !uploadingId) return;
      setUploadPending(true);
      try {
        await formsApi.uploadSigned(uploadingId, file);
        await refresh();
        toast.success("Dokumenti i firmosur u ngarkua me sukses.");
      } catch (err) {
        toast.error("Gabim gjatë ngarkimit.", {
          description: err instanceof Error ? err.message : "Provoni sërish.",
        });
      } finally {
        setUploadPending(false);
        setUploadingId(null);
      }
    },
    [uploadingId, refresh],
  );
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOpb = user?.role === "opb";
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<FormStatus | "all">(search.status ?? "all");
  // OPB activity now comes from server-side FormRecord fields (isNewForMe, opbViewedAt, opbDownloadedAt)

  // Intro animation: form icons fly from sidebar source to the list area,
  // ONE icon per unseen form. Skipped entirely when there are no new forms.
  const listCardRef = useRef<HTMLDivElement | null>(null);
  const introSourceCount = isOpb ? getOpbFreshCount(forms) : unseenCount;
  const introIconCount = Math.min(introSourceCount, INTRO_MAX_ICONS);
  // For OPB sidebar click: always animate with total submitted count
  const opbTotalIconCount = isOpb
    ? Math.min(forms.filter((f) => f.status === "submitted_to_opb").length, INTRO_MAX_ICONS)
    : 0;
  const [introPlaying, setIntroPlaying] = useState(false);
  const [introVectors, setIntroVectors] = useState<
    { id: number; fromX: number; fromY: number; toX: number; toY: number; delay: number }[]
  >([]);
  // Rows animation state — remount tbody on replay so rows re-enter
  const [rowsKey, setRowsKey] = useState(0);
  const [rowsBaseDelay, setRowsBaseDelay] = useState(introIconCount > 0 ? 1000 : 0);
  const [rowsAnimate, setRowsAnimate] = useState(introIconCount > 0);

  const playIntroAnimation = useCallback((overrideCount?: number) => {
    const count = overrideCount ?? introIconCount;
    if (count === 0) {
      setIntroPlaying(false);
      return;
    }
    const sourceEl = document.querySelector<HTMLElement>('[data-nav-key="forms-all"]');
    const targetEl = listCardRef.current;
    if (!targetEl) return;
    const targetRect = targetEl.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + Math.min(targetRect.height / 2, 220);
    const sourceRect = sourceEl?.getBoundingClientRect();
    const sourceX = sourceRect ? sourceRect.left + sourceRect.width / 2 : targetX - 320;
    const sourceY = sourceRect ? sourceRect.top + sourceRect.height / 2 : targetY;

    const vectors = Array.from({ length: count }, (_, i) => ({
      id: i,
      fromX: sourceX,
      fromY: sourceY,
      toX: targetX + (Math.random() - 0.5) * 80,
      toY: targetY + (Math.random() - 0.5) * 120,
      delay: i * INTRO_STAGGER_MS,
    }));
    setIntroVectors(vectors);
    setIntroPlaying(true);

    const totalMs = INTRO_FLY_MS + (count - 1) * INTRO_STAGGER_MS;
    const t = window.setTimeout(() => setIntroPlaying(false), totalMs);
    if (!isOpb) {
      markFormsSeen();
    }
    window.sessionStorage.removeItem("lov.forms.playIntro.v1");
    return t;
  }, [introIconCount, isOpb, markFormsSeen]);

  useEffect(() => {
    const timer = playIntroAnimation();
    return () => {
      if (timer) window.clearTimeout(timer);
    };
    // Run only on mount — do not replay on filter/search changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const replayFromSidebar = () => {
      const count = isOpb ? opbTotalIconCount : introIconCount;
      if (count === 0) return;
      // Hide rows immediately — they will reappear after icons land
      setRowsKey((k) => k + 1);
      setRowsBaseDelay(INTRO_FLY_MS);
      setRowsAnimate(true);
      // Play the icon fly animation
      const timer = playIntroAnimation(isOpb ? opbTotalIconCount : undefined);
      if (timer) window.setTimeout(() => window.clearTimeout(timer), INTRO_FLY_MS + 250);
    };
    window.addEventListener("lov:forms-intro-requested", replayFromSidebar);
    return () => window.removeEventListener("lov:forms-intro-requested", replayFromSidebar);
  }, [playIntroAnimation, isOpb, opbTotalIconCount, introIconCount]);

  // Keep local filter chip in sync when sidebar nav changes the URL.
  useEffect(() => {
    setFilter(search.status ?? "all");
  }, [search.status]);

  const setFilterAndUrl = (next: FormStatus | "all") => {
    setFilter(next);
    navigate({
      to: "/forms",
      search: next === "all" ? {} : { status: next },
      replace: true,
    });
  };

  const isOpbFresh = useCallback(
    (form: (typeof forms)[number]) => isOpb && Boolean(form.isNewForMe),
    [isOpb],
  );

  const markOpbViewed = useCallback(
    (id: string) => {
      formsApi
        .markViewed(id)
        .then(() => refresh())
        .catch(() => null);
    },
    [refresh],
  );

  const markOpbDownloaded = useCallback(
    (id: string) => {
      window.open(`/doc-print/${id}`, "_blank", "noopener,noreferrer");
      refresh().catch(() => null);
    },
    [refresh],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return forms
      .filter((f) => (isOpb ? canBeSeenByOpb(f) : true))
      .filter((f) => (isOpb || filter === "all" ? true : f.status === filter))
      .filter((f) =>
        term
          ? [f.emri, f.mbiemri, f.nid, f.id, f.institucioni].join(" ").toLowerCase().includes(term)
          : true,
      )
      .sort((a, b) => {
        if (isOpb) {
          const aFresh = isOpbFresh(a);
          const bFresh = isOpbFresh(b);
          if (aFresh !== bFresh) return aFresh ? -1 : 1;
        }
        return a.createdAt < b.createdAt ? 1 : -1;
      });
  }, [forms, q, filter, isOpb, isOpbFresh]);

  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [q, filter]);
  const paged = usePaged(filtered, page, DEFAULT_PAGE_SIZE);
  const pageRows = paged.slice;

  return (
    <>
      {/* Hidden file input for signed PDF upload */}
      <input
        ref={uploadInputRef}
        type="file"
        accept=".pdf"
        className="sr-only"
        onChange={handleFileChange}
      />
    <AppShell
      title="Formularët"
      description={
        isOpb
          ? "Formularët e dorëzuar për lexim dhe shkarkim."
          : "Të gjitha aplikimet elektronike, statuset dhe veprimet përkatëse."
      }
      breadcrumbs={[{ label: "Paneli", to: "/" }, { label: "Formularët" }]}
      actions={
        isOpb ? undefined : (
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/formulare/new">
              <Plus className="mr-2 h-4 w-4" /> Krijo Formular të Ri
            </Link>
          </Button>
        )
      }
    >
      {/* Flying form icons overlay — plays once on entry */}
      {introPlaying && introVectors.length > 0 && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[60]">
          {introVectors.map((v) => (
            <div
              key={v.id}
              className="forms-fly-icon absolute"
              style={{
                left: 0,
                top: 0,
                animationDelay: `${v.delay}ms`,
                ["--fx-from-x" as never]: `${v.fromX}px`,
                ["--fx-from-y" as never]: `${v.fromY}px`,
                ["--fx-to-x" as never]: `${v.toX}px`,
                ["--fx-to-y" as never]: `${v.toY}px`,
              }}
            >
              <div className="grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-lg bg-primary text-primary-foreground shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)] ring-1 ring-primary/40">
                <FileText className="h-5 w-5" />
              </div>
            </div>
          ))}
        </div>
      )}

      <div ref={listCardRef} className="rounded-xl border bg-card shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-3 border-b px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Kërko sipas emri, NID, institucioni..."
              className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          {!isOpb && (
            <div className="flex items-center gap-2 overflow-x-auto">
              <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilterAndUrl(f.value)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors ${
                    filter === f.value
                      ? "bg-primary text-primary-foreground ring-primary"
                      : "bg-background text-muted-foreground ring-border hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-medium">Formulari</th>
                <th className="px-5 py-3 font-medium">Aplikuesi</th>
                <th className="px-5 py-3 font-medium">NID</th>
                <th className="px-5 py-3 font-medium">Krijuar</th>
                {!isOpb && <th className="px-5 py-3 font-medium">Statusi</th>}
                <th className="px-5 py-3 text-right font-medium">Veprime</th>
              </tr>
            </thead>
            <tbody key={rowsKey} className="divide-y">
              {pageRows.map((f, idx) => {
                const fresh = isOpbFresh(f);
                return (
                  <tr
                    key={f.id}
                    className={[
                      rowsAnimate ? "forms-row-rise" : "",
                      "transition-colors",
                      fresh
                        ? "bg-accent/5 shadow-[inset_3px_0_0_var(--color-gold)] hover:bg-accent/10"
                        : "hover:bg-muted/30",
                    ].join(" ")}
                    style={
                      rowsAnimate
                        ? { animationDelay: `${rowsBaseDelay + idx * INTRO_ROW_DELAY_MS}ms` }
                        : undefined
                    }
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={[
                            "grid h-9 w-9 place-items-center rounded-md ring-1 ring-inset transition-transform duration-200",
                            fresh
                              ? "bg-accent/15 text-[oklch(0.42_0.12_60)] ring-accent/30"
                              : "bg-primary/5 text-primary ring-primary/10",
                          ].join(" ")}
                        >
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            <p
                              className={fresh ? "truncate font-semibold" : "truncate font-medium"}
                            >
                              Aplikim Zyrtar
                            </p>
                            {fresh && (
                              <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.42_0.12_60)]">
                                I ri
                              </span>
                            )}
                          </div>
                          <p className="truncate font-mono text-xs text-muted-foreground">{f.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium">
                        {f.emri} {f.mbiemri}
                      </p>
                      <p className="text-xs text-muted-foreground">{f.institucioni}</p>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs">{f.nid}</td>
                    <td className="px-5 py-4 text-muted-foreground">{fmtDate(f.createdAt)}</td>
                    {!isOpb && (
                      <td className="px-5 py-4">
                        <StatusBadge status={f.status} />
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Shiko — visible for all */}
                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-muted-foreground hover:text-foreground"
                          title="Shiko"
                        >
                          <Link
                            to="/forms/$id"
                            params={{ id: f.id }}
                            onClick={() => { if (isOpb) markOpbViewed(f.id); }}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>

                        {isOpb ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markOpbDownloaded(f.id)}
                            className="group/download h-8 px-2 text-muted-foreground hover:text-primary"
                            title="Shkarko PDF"
                          >
                            <FileDown className="h-4 w-4 transition-transform group-hover/download:translate-y-0.5" />
                          </Button>
                        ) : (
                          <>
                            {/* Edit — vetëm për draft */}
                            {f.status === "draft" && (
                              <Button
                                asChild
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                                title="Ndrysho"
                              >
                                <Link to="/formulare/$id" params={{ id: f.id }}>
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}

                            {/* Ngarko i firmosur — vetëm për pdf_generated */}
                            {f.status === "pdf_generated" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUploadClick(f.id)}
                                disabled={uploadPending && uploadingId === f.id}
                                className="h-8 px-2 text-muted-foreground hover:text-primary"
                                title="Ngarko formularin e firmosur"
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                            )}

                            {/* Fshi — për të gjitha */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(f.id)}
                              className="h-8 px-2 text-muted-foreground hover:text-destructive"
                              title="Fshi"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={isOpb ? 5 : 6} className="px-5 py-16">
                    <EmptyStateMotion
                      title="Asnjë formular nuk u gjet"
                      description={
                        isOpb
                          ? "Nuk ka formularë të dorëzuar për lexim ose kërkimi nuk gjeti rezultat."
                          : "Provoni të ndryshoni filtrat ose krijoni një formular të ri."
                      }
                      action={
                        !isOpb ? (
                          <Button
                            asChild
                            size="sm"
                            className="bg-primary text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[var(--shadow-elevated)]"
                          >
                            <Link to="/formulare/new">
                              <Plus className="mr-1.5 h-3.5 w-3.5" /> Krijo formular
                            </Link>
                          </Button>
                        ) : undefined
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
    </>
  );
}
