import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Cpu,
  Database,
  HardDrive,
  Landmark,
  ShieldAlert,
  UserPlus,
  Users,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { institutionsApi, type ApiInstitution } from "@/lib/api/institutions";
import { useAuth } from "@/lib/auth-store";
import { useForms } from "@/lib/forms-store";
import { useManagedUsers } from "@/lib/managed-users-store";

import { AdminGuard, MetricRow, StatCard, TechRow, computeSystemMetrics } from "./AdminShared";

function useInstitutionsCount() {
  const [institutions, setInstitutions] = useState<ApiInstitution[]>([]);

  const reload = useCallback(() => {
    institutionsApi
      .list()
      .then((r) => setInstitutions(r.results))
      .catch(() => {});
  }, []);

  useEffect(reload, [reload]);

  return institutions.length;
}

export function AdminOverviewPage() {
  const { user } = useAuth();
  const { users } = useManagedUsers();
  const { forms } = useForms();
  const institutionsCount = useInstitutionsCount();

  if (user?.role !== "superadmin") return <AdminGuard />;

  const opbCount = users.filter((u) => u.role === "opb").length;
  const akCount = users.filter((u) => u.role === "ak").length;
  const activeCount = users.filter((u) => u.active).length;
  const m = computeSystemMetrics(users.length, forms.length);
  const systemStatus =
    m.storagePct > 90 || m.cpuLoad > 85
      ? { label: "Kritik", tone: "text-destructive", icon: AlertTriangle }
      : m.storagePct > 70 || m.cpuLoad > 60
        ? { label: "Vëmendje", tone: "text-amber-600", icon: AlertTriangle }
        : { label: "Operacional", tone: "text-success", icon: CheckCircle2 };

  return (
    <AppShell
      title="Paneli i Superadministratorit"
      description="Pasqyrë e shpejtë e përdoruesve, institucioneve dhe gjendjes së sistemit."
      breadcrumbs={[{ label: "Admin" }]}
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Përdorues totalë"
          value={users.length}
          icon={Users}
          tone="bg-primary/5 text-primary ring-primary/10"
        />
        <StatCard
          label="Operatorë OBP"
          value={opbCount}
          icon={UserPlus}
          tone="bg-info/10 text-info ring-info/20"
        />
        <StatCard
          label="Përdorues AK"
          value={akCount}
          icon={Building2}
          tone="bg-accent/15 text-[oklch(0.42_0.12_60)] ring-accent/30"
        />
        <StatCard
          label="Institucione"
          value={institutionsCount}
          icon={Landmark}
          tone="bg-indigo-50 text-indigo-700 ring-indigo-200"
        />
        <StatCard
          label="Aktivë"
          value={activeCount}
          icon={CheckCircle2}
          tone="bg-success/10 text-success ring-success/20"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Gjendja e sistemit</h2>
              <p className="text-xs text-muted-foreground">Përmbledhje në kohë reale</p>
            </div>
            <div className={`flex items-center gap-2 text-sm font-medium ${systemStatus.tone}`}>
              <systemStatus.icon className="h-4 w-4" />
              {systemStatus.label}
            </div>
          </div>
          <div className="mt-5 space-y-4">
            <MetricRow
              label="Storage"
              used={`${m.storageUsedGB} GB / ${m.storageTotalGB} GB`}
              pct={m.storagePct}
            />
            <MetricRow label="CPU" used={`${m.cpuLoad}%`} pct={m.cpuLoad} />
            <MetricRow label="Memorie" used={`${m.memLoad}%`} pct={m.memLoad} />
          </div>
          <Button asChild variant="ghost" size="sm" className="mt-4">
            <Link to="/admin/system">
              Hap Sistemi & Storage <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-base font-semibold">Të dhëna teknike</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <TechRow icon={Cpu} k="Versioni" v="v2.4.1" />
            <TechRow icon={Activity} k="Uptime" v={`${m.uptimeDays} ditë`} />
            <TechRow icon={Database} k="Rreshta DB" v={m.dbRows.toLocaleString("sq")} />
            <TechRow icon={HardDrive} k="Backup i fundit" v="Sot, 03:00" />
            <TechRow icon={ShieldAlert} k="Mjedisi" v="Production" />
          </dl>
          <Button asChild variant="ghost" size="sm" className="mt-4">
            <Link to="/admin/users">
              Menaxho përdoruesit <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
