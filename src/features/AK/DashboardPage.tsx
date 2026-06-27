import { Link } from "@tanstack/react-router";
import {
  FileText,
  FileEdit,
  FileSignature,
  FileClock,
  ArrowRight,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { EmptyStateMotion } from "@/components/EmptyStateMotion";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useForms } from "@/lib/forms-store";
import type { FormStatus } from "@/lib/forms-types";

export function DashboardPage() {
  const { forms } = useForms();

  const count = (s: FormStatus | "all") =>
    s === "all" ? forms.length : forms.filter((f) => f.status === s).length;

  const stats = [
    {
      label: "Formularë total",
      value: count("all"),
      icon: FileText,
      tone: "bg-primary/5 text-primary ring-primary/10",
    },
    {
      label: "Draft",
      value: count("draft"),
      icon: FileEdit,
      tone: "bg-muted text-muted-foreground ring-border",
    },
    {
      label: "PDF të gjeneruara",
      value: count("pdf_generated"),
      icon: FileClock,
      tone: "bg-info/10 text-info ring-info/20",
    },
    {
      label: "Të firmosura / ngarkuara",
      value: count("signed_uploaded"),
      icon: FileSignature,
      tone: "bg-accent/15 text-[oklch(0.42_0.12_60)] ring-accent/30",
    },
  ];

  const recent = [...forms].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, 5);

  const steps = [
    "Plotëso formularin",
    "Gjenero PDF",
    "Shkarko PDF",
    "Firmos dokumentin",
    "Ngarko PDF-në e firmosur",
    "Dërgo në OPB",
  ];

  return (
    <AppShell
      title="Mirëseerdhe sërish"
      description="Menaxho aplikimet elektronike, gjenero PDF zyrtare dhe ndiq statusin e dokumenteve të firmosura."
      breadcrumbs={[{ label: "Paneli" }]}
      actions={
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link to="/formulare/new">
            <Plus className="mr-2 h-4 w-4" />
            Krijo Formular të Ri
          </Link>
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]"
          >
            <div className="flex items-start justify-between">
              <div
                className={`grid h-10 w-10 place-items-center rounded-lg ring-1 ring-inset ${s.tone}`}
              >
                <s.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border bg-card shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="text-base font-semibold">Aktiviteti i fundit</h2>
              <p className="text-xs text-muted-foreground">5 formularët më të përditësuar</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/forms">
                Shiko të gjithë
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <ul className="divide-y">
            {recent.map((f) => (
              <li key={f.id}>
                <Link
                  to="/forms/$id"
                  params={{ id: f.id }}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {f.emri} {f.mbiemri}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      <span className="font-mono">{f.id}</span> · {f.institucioni}
                    </p>
                  </div>
                  <StatusBadge status={f.status} />
                </Link>
              </li>
            ))}
            {recent.length === 0 && (
              <li className="px-5 py-14">
                <EmptyStateMotion
                  title="Asnjë aplikim ende"
                  description="Kur krijohet ose përditësohet një formular, aktiviteti do të shfaqet këtu."
                  action={
                    <Button
                      asChild
                      size="sm"
                      className="bg-primary text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[var(--shadow-elevated)]"
                    >
                      <Link to="/formulare/new">
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> Krijo formular
                      </Link>
                    </Button>
                  }
                />
              </li>
            )}
          </ul>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-base font-semibold">Rrjedha e aplikimit</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Hapat që ndjek aplikuesi nga fillimi në fund.
          </p>
          <ol className="mt-5 space-y-3">
            {steps.map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/5 text-[11px] font-semibold text-primary ring-1 ring-inset ring-primary/10">
                  {i + 1}
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-sm font-medium">{step}</p>
                </div>
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-success/40" />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </AppShell>
  );
}
