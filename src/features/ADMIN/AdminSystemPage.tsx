import {
  HardDrive,
  Cpu,
  Database,
  Activity,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FileSignature,
  Paperclip,
  ScrollText,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth-store";
import { useManagedUsers } from "@/lib/managed-users-store";
import { useForms } from "@/lib/forms-store";
import { MetricRow, TechRow, StatCard, AdminGuard, computeSystemMetrics } from "./AdminShared";

export function AdminSystemPage() {
  const { user } = useAuth();
  const { users } = useManagedUsers();
  const { forms } = useForms();

  if (user?.role !== "superadmin") return <AdminGuard />;

  const m = computeSystemMetrics(users.length, forms.length);
  const systemStatus =
    m.storagePct > 90 || m.cpuLoad > 85
      ? { label: "Kritik", tone: "text-destructive", icon: AlertTriangle }
      : m.storagePct > 70 || m.cpuLoad > 60
        ? { label: "Vëmendje", tone: "text-amber-600", icon: AlertTriangle }
        : { label: "Operacional", tone: "text-success", icon: CheckCircle2 };

  const breakdown = [
    { label: "PDF të gjeneruara", icon: FileText, gb: +(m.storageUsedGB * 0.45).toFixed(1) },
    {
      label: "Dokumente të firmosura",
      icon: FileSignature,
      gb: +(m.storageUsedGB * 0.28).toFixed(1),
    },
    { label: "Bashkëngjitje", icon: Paperclip, gb: +(m.storageUsedGB * 0.18).toFixed(1) },
    { label: "Logs & backup", icon: ScrollText, gb: +(m.storageUsedGB * 0.09).toFixed(1) },
  ];

  return (
    <AppShell
      title="Sistemi & Storage"
      description="Monitoro mbushjen e storage-it, performancën dhe konfigurimin teknik."
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Sistemi & Storage" }]}
      actions={
        <div
          className={`inline-flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm font-medium ${systemStatus.tone}`}
        >
          <systemStatus.icon className="h-4 w-4" />
          {systemStatus.label}
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Storage"
          value={`${m.storagePct}%`}
          icon={HardDrive}
          tone="bg-primary/5 text-primary ring-primary/10"
        />
        <StatCard
          label="CPU"
          value={`${m.cpuLoad}%`}
          icon={Cpu}
          tone="bg-info/10 text-info ring-info/20"
        />
        <StatCard
          label="Memorie"
          value={`${m.memLoad}%`}
          icon={Activity}
          tone="bg-accent/15 text-[oklch(0.42_0.12_60)] ring-accent/30"
        />
        <StatCard
          label="Uptime"
          value={`${m.uptimeDays}d`}
          icon={ShieldAlert}
          tone="bg-success/10 text-success ring-success/20"
        />
      </div>

      <div className="mt-6 rounded-xl border bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-base font-semibold">Mbushja e storage-it</h2>
        <p className="text-xs text-muted-foreground">
          Hapësira e përdorur për PDF, dokumente të firmosura, bashkëngjitje dhe regjistra.
        </p>
        <div className="mt-5">
          <div className="flex items-end justify-between">
            <p className="text-3xl font-semibold tracking-tight">{m.storageUsedGB} GB</p>
            <p className="text-sm text-muted-foreground">nga {m.storageTotalGB} GB</p>
          </div>
          <Progress value={m.storagePct} className="mt-3 h-3" />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{m.storagePct}% e përdorur</span>
            <span>{(m.storageTotalGB - m.storageUsedGB).toFixed(1)} GB të lira</span>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {breakdown.map((b) => (
            <div key={b.label} className="rounded-lg border bg-background p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <b.icon className="h-3.5 w-3.5" /> {b.label}
              </div>
              <p className="mt-1.5 text-xl font-semibold tabular-nums">{b.gb} GB</p>
              <Progress value={(b.gb / m.storageUsedGB) * 100} className="mt-2 h-1.5" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-base font-semibold">Performanca</h2>
          <div className="mt-4 space-y-4">
            <MetricRow label="CPU" used={`${m.cpuLoad}%`} pct={m.cpuLoad} />
            <MetricRow label="Memorie" used={`${m.memLoad}%`} pct={m.memLoad} />
            <MetricRow label="Disk I/O" used="12 MB/s" pct={24} />
            <MetricRow
              label="Lidhje aktive"
              used={`${m.activeConnections}`}
              pct={Math.min(100, m.activeConnections * 2)}
            />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-base font-semibold">Të dhëna teknike</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <TechRow icon={Cpu} k="Versioni i sistemit" v="v2.4.1" />
            <TechRow icon={Activity} k="Uptime" v={`${m.uptimeDays} ditë, 14 orë`} />
            <TechRow icon={Database} k="Baza e të dhënave" v="PostgreSQL 16.2" />
            <TechRow icon={Database} k="Rreshta totale" v={m.dbRows.toLocaleString("sq")} />
            <TechRow icon={HardDrive} k="Backup i fundit" v="Sot, 03:00 (sukses)" />
            <TechRow icon={ShieldAlert} k="Çertifikatë SSL" v="E vlefshme deri 2027" />
            <TechRow icon={ShieldAlert} k="Mjedisi" v="Production" />
          </dl>
        </div>
      </div>
    </AppShell>
  );
}
