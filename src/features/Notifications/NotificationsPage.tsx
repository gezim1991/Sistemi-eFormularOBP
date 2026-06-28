import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Check,
  CheckCheck,
  Download,
  Eye,
  Send,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
import { Pager, usePaged, DEFAULT_PAGE_SIZE } from "@/components/Pager";
import { notificationsApi, type NotificationItem, type NotificationType } from "@/lib/api/notifications";
import { useNotifications } from "@/lib/notifications-store";

const PAGE_SIZE = 20;

const TYPE_META: Record<NotificationType, { icon: typeof Bell; color: string; bg: string; label: string }> = {
  form_submitted: {
    icon: Send,
    color: "text-[oklch(0.42_0.12_60)]",
    bg: "bg-accent/15 ring-accent/30",
    label: "Formular i dorëzuar",
  },
  form_viewed: {
    icon: Eye,
    color: "text-primary",
    bg: "bg-primary/5 ring-primary/10",
    label: "Formular i parë",
  },
  form_downloaded: {
    icon: Download,
    color: "text-success",
    bg: "bg-success/10 ring-success/20",
    label: "PDF i shkarkuar",
  },
  generic: {
    icon: Bell,
    color: "text-muted-foreground",
    bg: "bg-muted ring-border",
    label: "Njoftim",
  },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("sq-AL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Tab = "all" | "unread";

export function NotificationsPage() {
  const navigate = useNavigate();
  const { refresh: refreshStore } = useNotifications();

  const [tab, setTab] = useState<Tab>("all");
  const [allItems, setAllItems] = useState<NotificationItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingPage, setLoadingPage] = useState(false);

  const loadPage = useCallback(
    async (p: number, currentTab: Tab) => {
      setLoadingPage(true);
      try {
        const params: Parameters<typeof notificationsApi.list>[0] = {
          page: p,
          page_size: PAGE_SIZE,
        };
        if (currentTab === "unread") params.is_read = false;
        const res = await notificationsApi.list(params);
        setAllItems(res.results);
        setTotalCount(res.count);
      } catch {
        // ignore
      } finally {
        setLoadingPage(false);
      }
    },
    [],
  );

  useEffect(() => {
    setPage(1);
    loadPage(1, tab);
  }, [tab, loadPage]);

  function handlePageChange(p: number) {
    setPage(p);
    loadPage(p, tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleMarkRead(id: number) {
    await notificationsApi.markRead(id);
    setAllItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    refreshStore();
  }

  async function handleMarkAllRead() {
    await notificationsApi.markAllRead();
    setAllItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    if (tab === "unread") {
      setAllItems([]);
      setTotalCount(0);
    }
    refreshStore();
  }

  async function handleDelete(id: number) {
    await notificationsApi.remove(id);
    setAllItems((prev) => prev.filter((n) => n.id !== id));
    setTotalCount((c) => Math.max(0, c - 1));
    refreshStore();
  }

  async function handleClick(n: NotificationItem) {
    if (!n.is_read) await handleMarkRead(n.id);
    if (n.form) {
      navigate({ to: "/forms/$id", params: { id: n.form_public_id ?? n.form } });
    }
  }

  const unreadInPage = allItems.filter((n) => !n.is_read).length;
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <AppShell
      title="Njoftimet"
      description="Të gjitha njoftimet tuaja të sistemit."
      breadcrumbs={[{ label: "Paneli", to: "/" }, { label: "Njoftimet" }]}
      actions={
        unreadInPage > 0 ? (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-muted"
          >
            <CheckCheck className="h-4 w-4" />
            Shëno të gjitha lexuar
          </button>
        ) : undefined
      }
    >
      {/* Tabs */}
      <div className="mb-4 flex items-center gap-1 rounded-lg border bg-card p-1 w-fit">
        {(["all", "unread"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-all",
              tab === t
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "all" ? "Të gjitha" : "Të palexuara"}
            {t === "all" && totalCount > 0 && tab === "all" && (
              <span className="ml-2 rounded-full bg-primary-foreground/15 px-1.5 py-0.5 text-[10px] font-semibold">
                {totalCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-card shadow-[var(--shadow-card)]">
        {loadingPage ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : allItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-muted">
              <Bell className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">
                {tab === "unread" ? "Asnjë njoftim i palexuar" : "Asnjë njoftim"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {tab === "unread"
                  ? "Të gjitha njoftimet janë lexuar."
                  : "Njoftimet do të shfaqen këtu kur të ndodhin ngjarje."}
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y">
            {allItems.map((n) => {
              const meta = TYPE_META[n.type] ?? TYPE_META.generic;
              const Icon = meta.icon;
              return (
                <li
                  key={n.id}
                  className={cn(
                    "group relative flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/30",
                    !n.is_read && "bg-primary/[0.025]",
                  )}
                >
                  {!n.is_read && (
                    <span className="absolute left-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary" />
                  )}

                  <div
                    className={cn(
                      "mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-lg ring-1 ring-inset",
                      meta.bg,
                    )}
                  >
                    <Icon className={cn("h-5 w-5", meta.color)} />
                  </div>

                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => handleClick(n)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "text-sm leading-snug",
                          !n.is_read && "font-medium",
                        )}
                      >
                        {n.message}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {meta.label}
                      </span>
                      {n.form_public_id && (
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {n.form_public_id}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{fmt(n.created_at)}</p>
                  </button>

                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {!n.is_read && (
                      <button
                        title="Shëno si lexuar"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRead(n.id);
                        }}
                        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      title="Fshi"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(n.id);
                      }}
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {!loadingPage && allItems.length > 0 && (
          <Pager
            page={page}
            pageCount={pageCount}
            total={totalCount}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
            label="njoftime"
          />
        )}
      </div>
    </AppShell>
  );
}
