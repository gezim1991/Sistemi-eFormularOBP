import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  FileDown,
  Upload,
  FileText,
  MoreHorizontal,
  Filter,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyStateMotion } from "@/components/EmptyStateMotion";
import { Pager, usePaged, DEFAULT_PAGE_SIZE } from "@/components/Pager";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  { value: "archived", label: STATUS_META.archived.label },
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
  const { forms, setStatus, unseenCount, markFormsSeen, refresh } = useForms();
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
  const [introPlaying, setIntroPlaying] = useState(false);
  const [introVectors, setIntroVectors] = useState<
    { id: number; fromX: number; fromY: number; toX: number; toY: number; delay: number }[]
  >([]);

  const playIntroAnimation = useCallback(() => {
    if (introIconCount === 0) {
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

    const vectors = Array.from({ length: introIconCount }, (_, i) => {
      const jitterX = (Math.random() - 0.5) * 80;
      const jitterY = (Math.random() - 0.5) * 120;
      return {
        id: i,
        fromX: sourceX,
        fromY: sourceY,
        toX: targetX + jitterX,
        toY: targetY + jitterY,
        delay: i * INTRO_STAGGER_MS,
      };
    });
    setIntroVectors(vectors);
    setIntroPlaying(true);

    const totalMs = INTRO_FLY_MS + (introIconCount - 1) * INTRO_STAGGER_MS;
    const t = window.setTimeout(() => setIntroPlaying(false), totalMs);
    if (!isOpb) {
      // Mark all current forms as seen so the badge resets to 0 and the
      // animation does not replay on the next visit.
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
      const timer = playIntroAnimation();
      if (timer) window.setTimeout(() => window.clearTimeout(timer), INTRO_FLY_MS + 250);
    };
    window.addEventListener("lov:forms-intro-requested", replayFromSidebar);
    return () => window.removeEventListener("lov:forms-intro-requested", replayFromSidebar);
  }, [playIntroAnimation]);

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
      window.open(formsApi.downloadPdfUrl(id), "_blank", "noopener,noreferrer");
      refresh().catch(() => null);
      toast.success("PDF-ja po shkarkohet.");
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
            <tbody className="divide-y">
              {pageRows.map((f, idx) => {
                const fresh = isOpbFresh(f);
                return (
                  <tr
                    key={f.id}
                    className={[
                      introIconCount > 0 ? "forms-row-rise" : "",
                      "transition-colors",
                      fresh
                        ? "bg-accent/5 shadow-[inset_3px_0_0_var(--color-gold)] hover:bg-accent/10"
                        : "hover:bg-muted/30",
                    ].join(" ")}
                    style={
                      introIconCount > 0
                        ? { animationDelay: `${1000 + idx * INTRO_ROW_DELAY_MS}ms` }
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
                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className={[
                            "h-8 px-2 transition-all duration-200",
                            fresh
                              ? "text-primary hover:-translate-y-0.5 hover:bg-primary/5 hover:text-primary"
                              : "text-muted-foreground hover:text-foreground",
                          ].join(" ")}
                        >
                          <Link
                            to="/forms/$id"
                            params={{ id: f.id }}
                            onClick={() => {
                              if (isOpb) markOpbViewed(f.id);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {isOpb ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markOpbDownloaded(f.id)}
                            className="group/download h-8 px-2 text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:text-primary"
                            aria-label="Shkarko PDF"
                          >
                            <FileDown className="h-4 w-4 transition-transform duration-200 group-hover/download:translate-y-0.5" />
                          </Button>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem
                                onClick={() => navigate({ to: "/forms/$id", params: { id: f.id } })}
                              >
                                <Eye className="mr-2 h-4 w-4" /> Shiko detajet
                              </DropdownMenuItem>
                              {f.status === "draft" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate({ to: "/forms/$id", params: { id: f.id } })
                                  }
                                >
                                  <Pencil className="mr-2 h-4 w-4" /> Vazhdo plotësimin
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => {
                                  setStatus(f.id, "pdf_generated");
                                  toast.success("PDF u gjenerua me sukses.");
                                }}
                              >
                                <FileText className="mr-2 h-4 w-4" /> Gjenero PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.success("PDF-ja u shkarkua.")}>
                                <FileDown className="mr-2 h-4 w-4" /> Shkarko PDF
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => navigate({ to: "/forms/$id", params: { id: f.id } })}
                              >
                                <Upload className="mr-2 h-4 w-4" /> Ngarko të firmosur
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
  );
}
