import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, CircleOff, Landmark } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth-store";
import { institutionsApi, type ApiInstitution } from "@/lib/api/institutions";
import { cn } from "@/lib/utils";

import { AdminGuard } from "./AdminShared";
import { InstitutionsManager } from "./AdminUsersPage";

function useInstitutions() {
  const [institutions, setInstitutions] = useState<ApiInstitution[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    institutionsApi
      .list()
      .then((r) => setInstitutions(r.results))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(reload, [reload]);

  return { institutions, loading, reload };
}

export function AdminInstitutionsPage() {
  const { user } = useAuth();
  const { institutions, loading, reload } = useInstitutions();

  const stats = useMemo(
    () => ({
      total: institutions.length,
      active: institutions.filter((i) => i.is_active).length,
      inactive: institutions.filter((i) => !i.is_active).length,
      typed: institutions.filter((i) => i.type?.trim()).length,
    }),
    [institutions],
  );

  if (user?.role !== "superadmin") return <AdminGuard />;

  return (
    <AppShell
      title="Institucionet"
      description="Menaxho Autoritetet Kontraktore që lidhen me përdoruesit AK dhe formularët."
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Institucione" }]}
    >
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InstitutionMetric label="Institucione total" value={stats.total} icon={Landmark} />
          <InstitutionMetric label="Aktive" value={stats.active} icon={CheckCircle2} tone="green" />
          <InstitutionMetric
            label="Çaktivizuara"
            value={stats.inactive}
            icon={CircleOff}
            tone="red"
          />
          <InstitutionMetric label="Me kategori" value={stats.typed} icon={Building2} tone="gold" />
        </div>

        <InstitutionsManager institutions={institutions} loading={loading} onRefresh={reload} />
      </div>
    </AppShell>
  );
}

function InstitutionMetric({
  label,
  value,
  icon: Icon,
  tone = "navy",
}: {
  label: string;
  value: number;
  icon: typeof Building2;
  tone?: "navy" | "green" | "red" | "gold";
}) {
  const tones = {
    navy: "bg-primary/5 text-primary ring-primary/10",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    gold: "bg-accent/15 text-[oklch(0.45_0.13_65)] ring-accent/30",
  };

  return (
    <div className="group rounded-xl border bg-card p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={cn(
          "grid h-11 w-11 place-items-center rounded-lg ring-1 ring-inset transition-transform duration-200 group-hover:scale-105",
          tones[tone],
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
