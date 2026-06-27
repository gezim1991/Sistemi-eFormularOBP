import type { ReactNode } from "react";
import { Cpu, ShieldAlert, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AppShell } from "@/components/layout/AppShell";

export function AdminGuard() {
  return (
    <AppShell title="Akses i ndaluar" breadcrumbs={[{ label: "Admin" }]}>
      <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
        <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-destructive" />
        Nuk keni leje për të hyrë në këtë faqe.
      </div>
    </AppShell>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: typeof Users;
  tone: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className={`grid h-10 w-10 place-items-center rounded-lg ring-1 ring-inset ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export function MetricRow({ label, used, pct }: { label: string; used: string; pct: number }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{used}</span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}

export function TechRow({ icon: Icon, k, v }: { icon: typeof Cpu; k: string; v: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" /> {k}
      </dt>
      <dd className="font-medium tabular-nums">{v}</dd>
    </div>
  );
}

export function computeSystemMetrics(userCount: number, formCount: number) {
  const storageTotalGB = 100;
  const storageUsedGB = Math.min(storageTotalGB, +(formCount * 0.42 + 23.5).toFixed(1));
  const storagePct = Math.round((storageUsedGB / storageTotalGB) * 100);
  const dbRows = userCount + formCount * 7 + 412;
  const uptimeDays = 47;
  const cpuLoad = 18 + (formCount % 12);
  const memLoad = 42 + (userCount % 10);
  const activeConnections = 12 + userCount;
  return {
    storageTotalGB,
    storageUsedGB,
    storagePct,
    dbRows,
    uptimeDays,
    cpuLoad,
    memLoad,
    activeConnections,
  };
}
