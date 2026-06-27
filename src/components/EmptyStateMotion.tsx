import { FileText, Inbox } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateMotionProps = {
  title: string;
  description: string;
  variant?: "document" | "inbox";
  action?: ReactNode;
  className?: string;
};

export function EmptyStateMotion({
  title,
  description,
  variant = "document",
  action,
  className,
}: EmptyStateMotionProps) {
  const Icon = variant === "inbox" ? Inbox : FileText;

  return (
    <div
      className={cn(
        "mx-auto flex max-w-sm flex-col items-center text-center animate-[empty-state-in_520ms_cubic-bezier(0.22,1,0.36,1)_both]",
        className,
      )}
    >
      <div className="empty-state-orbit relative grid h-20 w-20 place-items-center">
        <span className="absolute inset-0 rounded-full bg-primary/5" />
        <span className="absolute h-14 w-14 rounded-full border border-primary/10 bg-card shadow-[0_12px_28px_-18px_oklch(0.22_0.06_260/0.45)]" />
        <span className="empty-state-ping absolute h-14 w-14 rounded-full border border-accent/35" />
        <div className="empty-state-icon relative grid h-11 w-11 place-items-center overflow-hidden rounded-xl border bg-muted text-muted-foreground shadow-sm">
          <Icon className="h-5 w-5" />
          <span className="empty-state-scan absolute inset-x-1 top-0 h-px bg-accent/80 shadow-[0_0_12px_var(--color-accent)]" />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>

      <div aria-hidden className="mt-5 w-44 space-y-2">
        <span className="empty-state-line block h-1.5 rounded-full bg-muted" />
        <span className="empty-state-line block h-1.5 w-4/5 rounded-full bg-muted [animation-delay:160ms]" />
        <span className="empty-state-line block h-1.5 w-2/3 rounded-full bg-muted [animation-delay:320ms]" />
      </div>

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
