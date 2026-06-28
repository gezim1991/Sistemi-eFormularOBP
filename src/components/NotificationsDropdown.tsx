import { useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  Download,
  Eye,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/lib/notifications-store";
import type { NotificationItem, NotificationType } from "@/lib/api/notifications";
import { useOnClickOutside } from "@/lib/use-on-click-outside";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (m < 1) return "tani";
  if (m < 60) return `${m} min`;
  if (h < 24) return `${h}h`;
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString("sq-AL", { day: "2-digit", month: "short" });
}

const TYPE_META: Record<
  NotificationType,
  { icon: typeof Bell; color: string; bg: string }
> = {
  form_submitted: {
    icon: Send,
    color: "text-[oklch(0.42_0.12_60)]",
    bg: "bg-accent/15 ring-accent/30",
  },
  form_viewed: {
    icon: Eye,
    color: "text-primary",
    bg: "bg-primary/5 ring-primary/10",
  },
  form_downloaded: {
    icon: Download,
    color: "text-success",
    bg: "bg-success/10 ring-success/20",
  },
  generic: {
    icon: Bell,
    color: "text-muted-foreground",
    bg: "bg-muted ring-border",
  },
};

function NotifRow({
  n,
  onRead,
  onDelete,
  onClick,
}: {
  n: NotificationItem;
  onRead: () => void;
  onDelete: () => void;
  onClick: () => void;
}) {
  const meta = TYPE_META[n.type] ?? TYPE_META.generic;
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        "group relative flex gap-3 px-4 py-3 transition-colors hover:bg-muted/40",
        !n.is_read && "bg-primary/[0.03]",
      )}
    >
      {!n.is_read && (
        <span className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary" />
      )}

      {/* icon */}
      <div
        className={cn(
          "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1 ring-inset",
          meta.bg,
        )}
      >
        <Icon className={cn("h-4 w-4", meta.color)} />
      </div>

      {/* body — clicking navigates + marks read */}
      <button
        className="min-w-0 flex-1 text-left"
        onClick={() => {
          onClick();
          if (!n.is_read) onRead();
        }}
      >
        <p className={cn("text-sm leading-snug", !n.is_read && "font-medium")}>
          {n.message}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{timeAgo(n.created_at)}</p>
      </button>

      {/* actions */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        {!n.is_read && (
          <button
            title="Shëno si lexuar"
            onClick={(e) => {
              e.stopPropagation();
              onRead();
            }}
            className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          title="Fshi njoftimin"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, totalCount, loading, markRead, markAllRead, remove } =
    useNotifications();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useOnClickOutside(ref, () => setOpen(false));

  function handleNotifClick(n: NotificationItem) {
    setOpen(false);
    if (n.form) {
      navigate({ to: "/forms/$id", params: { id: n.form_public_id ?? n.form } });
    }
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Njoftimet"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[10px] font-bold text-primary-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-[360px] overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-elevated)] animate-[scale-in_150ms_ease-out] origin-top-right">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Njoftimet</h3>
              {unreadCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  title="Shëno të gjitha si lexuar"
                  className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Të gjitha lexuar
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
                  <Bell className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Asnjë njoftim</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Njoftimet do të shfaqen këtu.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((n) => (
                  <NotifRow
                    key={n.id}
                    n={n}
                    onRead={() => markRead(n.id)}
                    onDelete={() => remove(n.id)}
                    onClick={() => handleNotifClick(n)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer — "Shiko të gjitha" */}
          <div className="border-t">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/5"
            >
              Shiko të gjitha njoftimet
              {totalCount > 10 && (
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {totalCount}
                </span>
              )}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
