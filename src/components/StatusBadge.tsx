import { cn } from "@/lib/utils";
import { STATUS_META, type FormStatus } from "@/lib/forms-types";

const toneStyles: Record<string, string> = {
  neutral: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
  info: "bg-info/10 text-info ring-1 ring-inset ring-info/20",
  warning: "bg-accent/15 text-[oklch(0.42_0.12_60)] ring-1 ring-inset ring-accent/30",
  success: "bg-success/10 text-success ring-1 ring-inset ring-success/20",
  danger: "bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20",
};

const toneDot: Record<string, string> = {
  neutral: "bg-muted-foreground",
  info: "bg-info",
  warning: "bg-accent",
  success: "bg-success",
  danger: "bg-destructive",
};

export function StatusBadge({ status, className }: { status: FormStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        toneStyles[meta.tone],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", toneDot[meta.tone])} />
      {meta.label}
    </span>
  );
}
