import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  Building2,
  ChevronDown,
  CheckCircle2,
  KeyRound,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Power,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { EmptyStateMotion } from "@/components/EmptyStateMotion";
import { AppShell } from "@/components/layout/AppShell";
import { Pager, usePaged, DEFAULT_PAGE_SIZE } from "@/components/Pager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-store";
import { institutionsApi, type ApiInstitution } from "@/lib/api/institutions";
import { useManagedUsers, type ManagedUser, type ManagedUserRole } from "@/lib/managed-users-store";
import { cn } from "@/lib/utils";

import { AdminGuard } from "./AdminShared";

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

export function AdminUsersPage() {
  const { user } = useAuth();
  const { users, addUser, toggleUser, removeUser } = useManagedUsers();
  const { institutions } = useInstitutions();
  const navigate = useNavigate();
  const [tab, setTab] = useState("add");
  const [role, setRole] = useState<ManagedUserRole>("opb");

  if (user?.role !== "superadmin") return <AdminGuard />;

  return (
    <AppShell
      title="Përdoruesit & Institucionet"
      description="Shto operatorë OPB dhe përdorues të Autoriteteve Kontraktore me një rrjedhë të qartë administrimi."
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Përdoruesit" }]}
    >
      <div className="space-y-6">
        <Tabs value={tab} onValueChange={setTab} className="space-y-5">
          <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/60 p-1">
            <TabsTrigger value="add" className="data-[state=active]:shadow-sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Shto përdorues
            </TabsTrigger>
            <TabsTrigger value="list" className="data-[state=active]:shadow-sm">
              <Users className="mr-2 h-4 w-4" />
              Lista ({users.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="animate-[fade-in_220ms_ease-out]">
            <div className="grid gap-5 xl:grid-cols-[0.95fr_1.35fr]">
              <section className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Zgjidh rolin
                    </p>
                    <h2 className="mt-1 text-xl font-semibold tracking-tight">Krijo akses të ri</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Formulari përshtatet automatikisht sipas rolit që zgjedh.
                    </p>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent/15 text-[oklch(0.45_0.13_65)]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  <RoleChoice
                    active={role === "opb"}
                    icon={ShieldCheck}
                    title="Operator OPB"
                    description="Shikon formularët e dorëzuar dhe shkarkon dokumentet PDF."
                    badge="Lexim & shkarkim"
                    onClick={() => setRole("opb")}
                  />
                  <RoleChoice
                    active={role === "ak"}
                    icon={Building2}
                    title="Autoritet Kontraktor"
                    description="Krijon formularë, gjeneron PDF dhe dorëzon aplikime."
                    badge="Krijim formulari"
                    onClick={() => setRole("ak")}
                  />
                </div>

                <div className="mt-5 rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm font-semibold">Rrjedha e krijimit</p>
                  <div className="mt-4 space-y-3">
                    {[
                      "Zgjidh rolin",
                      role === "ak" ? "Lidh institucionin AK" : "Vendos njësinë OPB",
                      "Vendos email dhe fjalëkalim",
                    ].map((step, index) => (
                      <div key={step} className="flex items-center gap-3 text-sm">
                        <span className="grid h-7 w-7 place-items-center rounded-full border bg-background text-xs font-semibold shadow-sm">
                          {index + 1}
                        </span>
                        <span className="text-muted-foreground">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <AddUserForm
                key={role}
                role={role}
                institutions={institutions}
                onOpenInstitutions={() => navigate({ to: "/admin/institutions" })}
                onAdded={async (data) => {
                  await addUser(data);
                  toast.success(
                    data.role === "opb" ? "Operatori OPB u shtua" : "Përdoruesi AK u shtua",
                    { description: data.email },
                  );
                  setTab("list");
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="list" className="animate-[fade-in_220ms_ease-out]">
            <UsersTable users={users} onToggle={toggleUser} onRemove={removeUser} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function AdminUserMetric({
  label,
  value,
  icon: Icon,
  tone = "navy",
}: {
  label: string;
  value: number;
  icon: typeof Users;
  tone?: "navy" | "sky" | "gold" | "green";
}) {
  const tones = {
    navy: "bg-primary/5 text-primary ring-primary/10",
    sky: "bg-sky-50 text-sky-700 ring-sky-200",
    gold: "bg-accent/15 text-[oklch(0.45_0.13_65)] ring-accent/30",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
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

function RoleChoice({
  active,
  icon: Icon,
  title,
  description,
  badge,
  onClick,
}: {
  active: boolean;
  icon: typeof Users;
  title: string;
  description: string;
  badge: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-all duration-200 active:scale-[0.99]",
        active
          ? "border-accent bg-accent/10 shadow-[0_14px_34px_-28px_oklch(0.55_0.14_65)]"
          : "bg-background hover:border-accent/50 hover:bg-muted/40",
      )}
    >
      <span
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-lg border transition-all duration-200 group-hover:scale-105",
          active ? "border-accent/40 bg-background text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className="font-semibold">{title}</span>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
              active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {active ? "Zgjedhur" : badge}
          </span>
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}

function AddUserForm({
  role,
  institutions,
  onOpenInstitutions,
  onAdded,
}: {
  role: ManagedUserRole;
  institutions: ApiInstitution[];
  onOpenInstitutions: () => void;
  onAdded: (data: {
    email: string;
    name: string;
    role: ManagedUserRole;
    institucioni: string;
    password: string;
    institutionId?: number;
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [institutionId, setInstitutionId] = useState<number | "">("");
  const [opbUnit, setOpbUnit] = useState("Zyra e Pranimit të Formularëve");
  const [submitting, setSubmitting] = useState(false);

  const isAk = role === "ak";
  const activeInstitutions = institutions.filter((i) => i.is_active);
  const selectedInstitution = institutions.find((i) => i.id === Number(institutionId));
  const canSubmit =
    name.trim() &&
    email.trim() &&
    password.trim() &&
    (!isAk || institutionId) &&
    (!isAk || activeInstitutions.length > 0);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Plotëso të gjitha fushat e detyrueshme");
      return;
    }
    if (isAk && !institutionId) {
      toast.error("Zgjidh institucionin për përdoruesin AK");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Email i pavlefshëm");
      return;
    }
    if (password.length < 8) {
      toast.error("Fjalëkalimi duhet të ketë së paku 8 karaktere");
      return;
    }

    setSubmitting(true);
    try {
      await onAdded({
        name: name.trim(),
        email: email.trim(),
        role,
        institucioni: isAk ? (selectedInstitution?.name ?? "") : opbUnit.trim(),
        password,
        institutionId: isAk ? Number(institutionId) : undefined,
      });
      setName("");
      setEmail("");
      setPassword("");
      setInstitutionId("");
      setOpbUnit("Zyra e Pranimit të Formularëve");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Ndodhi një gabim");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border bg-card shadow-[var(--shadow-card)]">
      <div className="border-b bg-muted/25 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isAk ? "Autoritet Kontraktor" : "Operator OPB"}
            </p>
            <h2 className="mt-1 text-lg font-semibold">
              {isAk ? "Shto përdorues AK" : "Shto operator OPB"}
            </h2>
          </div>
          <Badge variant={isAk ? "secondary" : "default"} className="w-fit">
            {isAk ? "AK" : "OPB"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_0.8fr]">
        <div className="grid gap-4">
          <FloatingField icon={Users} label="Emër mbiemër *">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="p.sh. Blerina Hoxha"
            />
          </FloatingField>

          <FloatingField icon={Mail} label="Email zyrtar *">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="emer@institucion.gov.al"
            />
          </FloatingField>

          {isAk ? (
            <FloatingField icon={Building2} label="Autoriteti Kontraktor *">
              {activeInstitutions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-accent bg-accent/10 p-3 text-sm">
                  <p className="font-medium">Nuk ka institucione aktive.</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Shto fillimisht Autoritetin Kontraktor, pastaj krijo përdoruesin.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 transition-transform active:scale-[0.98]"
                    onClick={onOpenInstitutions}
                  >
                    <Plus className="h-4 w-4" />
                    Shto institucion
                  </Button>
                </div>
              ) : (
                <InstitutionSearchSelect
                  institutions={activeInstitutions}
                  value={institutionId}
                  onChange={setInstitutionId}
                />
              )}
            </FloatingField>
          ) : (
            <FloatingField icon={ShieldCheck} label="Njësia OPB">
              <Input
                value={opbUnit}
                onChange={(e) => setOpbUnit(e.target.value)}
                placeholder="Zyra e Pranimit të Formularëve"
              />
            </FloatingField>
          )}

          <FloatingField icon={KeyRound} label="Fjalëkalim fillestar *">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 karaktere"
            />
          </FloatingField>
        </div>

        <aside className="rounded-lg border bg-muted/25 p-4">
          <p className="text-sm font-semibold">Përmbledhje</p>
          <div className="mt-4 space-y-3 text-sm">
            <PreviewRow label="Roli" value={isAk ? "Përdorues AK" : "Operator OPB"} />
            <PreviewRow label="Emri" value={name || "Ende pa emër"} />
            <PreviewRow label="Email" value={email || "Ende pa email"} />
            <PreviewRow
              label={isAk ? "Institucioni" : "Njësia"}
              value={isAk ? selectedInstitution?.name || "Pa zgjedhur" : opbUnit}
            />
          </div>
          <div className="mt-5 rounded-lg bg-background p-3 text-xs text-muted-foreground">
            <CheckCircle2 className="mb-2 h-4 w-4 text-emerald-600" />
            Përdoruesi krijohet aktiv dhe mund të hyjë menjëherë në platformë.
          </div>
        </aside>
      </div>

      <div className="flex flex-col gap-3 border-t bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Fushat me yll janë të detyrueshme. Email-i duhet të jetë unik në sistem.
        </p>
        <Button
          type="submit"
          disabled={submitting || !canSubmit}
          className="group transition-transform active:scale-[0.98]"
        >
          <UserPlus className="h-4 w-4" />
          {submitting ? "Po shtohet..." : "Shto përdoruesin"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>
    </form>
  );
}

function FloatingField({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Users;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="group grid gap-2 rounded-lg border bg-background p-3 transition-all duration-200 focus-within:border-accent focus-within:shadow-[0_12px_28px_-24px_oklch(0.55_0.14_65)]">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-4 w-4 transition-transform duration-200 group-focus-within:scale-110" />
        {label}
      </span>
      {children}
    </div>
  );
}

function InstitutionSearchSelect({
  institutions,
  value,
  onChange,
}: {
  institutions: ApiInstitution[];
  value: number | "";
  onChange: (value: number | "") => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = institutions.find((institution) => institution.id === Number(value));
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return institutions.filter((institution) =>
      term
        ? [institution.name, institution.type, institution.address]
            .join(" ")
            .toLowerCase()
            .includes(term)
        : true,
    );
  }, [institutions, query]);

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);
          setQuery("");
        }}
        className={cn(
          "group/select flex min-h-10 w-full items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 text-left text-sm shadow-sm outline-none transition-all duration-200 active:scale-[0.995]",
          open
            ? "border-accent ring-2 ring-accent/20"
            : "border-input hover:border-accent/60 hover:bg-muted/30",
        )}
      >
        <span className="min-w-0">
          <span className={cn("block truncate", !selected && "text-muted-foreground")}>
            {selected?.name ?? "Zgjidh institucionin"}
          </span>
          {selected?.address && (
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {selected.address}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover/select:text-foreground",
            open && "rotate-180 text-foreground",
          )}
        />
      </button>

      {open && (
        <div className="mt-2 animate-[scale-in_160ms_ease-out] rounded-lg border bg-popover p-2 shadow-xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Kërko institucion..."
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div className="mt-2 max-h-[15rem] overflow-y-auto pr-1">
            {filtered.slice(0, 5).map((institution, index) => {
              const active = institution.id === Number(value);
              return (
                <button
                  key={institution.id}
                  type="button"
                  style={{ animationDelay: `${index * 28}ms` }}
                  onClick={() => {
                    onChange(institution.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-all duration-150 animate-[fade-in_180ms_ease-out] active:scale-[0.99]",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-muted hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 h-2 w-2 shrink-0 rounded-full transition-transform duration-150",
                      active ? "scale-125 bg-accent" : "bg-muted-foreground/35",
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{institution.name}</span>
                    <span
                      className={cn(
                        "mt-0.5 block truncate text-xs",
                        active ? "text-primary-foreground/75" : "text-muted-foreground",
                      )}
                    >
                      {[institution.type, institution.address].filter(Boolean).join(" - ") ||
                        "Pa detaje shtesë"}
                    </span>
                  </span>
                </button>
              );
            })}

            {filtered.length === 0 && (
              <div className="px-3 py-5 text-center text-xs text-muted-foreground">
                Asnjë institucion nuk u gjet.
              </div>
            )}
          </div>

          {filtered.length > 5 && (
            <p className="px-3 pt-2 text-[11px] text-muted-foreground">
              Shfaqen 5 rezultatet e para. Përdor kërkimin për të ngushtuar listën.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[62%] break-all text-right font-medium">{value}</span>
    </div>
  );
}

function UsersTable({
  users,
  onToggle,
  onRemove,
}: {
  users: ManagedUser[];
  onToggle: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "opb" | "ak">("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return users.filter((u) => {
      if (filter !== "all" && u.role !== filter) return false;
      if (term && !`${u.name} ${u.email} ${u.institucioni}`.toLowerCase().includes(term)) {
        return false;
      }
      return true;
    });
  }, [users, q, filter]);

  const paged = usePaged(filtered, page, DEFAULT_PAGE_SIZE);

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-3 border-b px-5 py-4 lg:flex-row lg:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Kërko emër, email, institucion..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {(["all", "opb", "ak"] as const).map((f) => (
            <Button
              key={f}
              type="button"
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
              className="transition-transform active:scale-[0.98]"
            >
              {f === "all" ? "Të gjithë" : f.toUpperCase()}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground lg:ml-auto">{filtered.length} përdorues</p>
      </div>

      <ul className="divide-y">
        {paged.slice.map((u) => (
          <li
            key={u.id}
            className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/30 lg:flex-row lg:items-center"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold transition-transform duration-200 group-hover:scale-105">
                {u.name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{u.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {u.email}
                  {u.institucioni ? ` - ${u.institucioni}` : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <Badge variant={u.role === "opb" ? "default" : "secondary"}>
                {u.role.toUpperCase()}
              </Badge>
              <Badge variant={u.active ? "outline" : "destructive"}>
                {u.active ? "Aktiv" : "Çaktivizuar"}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title={u.active ? "Çaktivizo" : "Aktivizo"}
                onClick={() => onToggle(u.id).catch(() => toast.error("Gabim gjatë ndryshimit"))}
              >
                <Power className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  if (confirm(`Fshi përdoruesin ${u.name}?`)) {
                    onRemove(u.id)
                      .then(() => toast.success("Përdoruesi u fshi"))
                      .catch(() => toast.error("Gabim gjatë fshirjes"));
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
        {paged.slice.length === 0 && (
          <li className="px-5 py-14">
            <EmptyStateMotion
              variant="inbox"
              title="Asnjë përdorues"
              description="Përdoruesit OPB dhe AK do të shfaqen këtu sapo të krijohen."
            />
          </li>
        )}
      </ul>

      <Pager
        page={paged.page}
        pageCount={paged.pageCount}
        total={paged.total}
        pageSize={DEFAULT_PAGE_SIZE}
        onPageChange={setPage}
        label="përdorues"
      />
    </div>
  );
}

const INSTITUTION_TYPES = [
  "Ministri",
  "Njësi vendore",
  "Agjenci qendrore",
  "Institucion arsimor",
  "Institucion social",
  "Spital",
  "Tjetër",
];

export function InstitutionsManager({
  institutions,
  loading,
  onRefresh,
}: {
  institutions: ApiInstitution[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editInst, setEditInst] = useState<ApiInstitution | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return institutions.filter((i) =>
      term ? [i.name, i.type, i.address].join(" ").toLowerCase().includes(term) : true,
    );
  }, [institutions, q]);

  const paged = usePaged(filtered, page, DEFAULT_PAGE_SIZE);

  async function handleToggle(inst: ApiInstitution) {
    try {
      await institutionsApi.update(inst.id, { is_active: !inst.is_active });
      toast.success(inst.is_active ? "Institucioni u çaktivizua" : "Institucioni u aktivizua");
      onRefresh();
    } catch {
      toast.error("Gabim gjatë ndryshimit");
    }
  }

  async function handleDelete(inst: ApiInstitution) {
    if (!confirm(`Fshi institucionin "${inst.name}"?`)) return;
    try {
      await institutionsApi.delete(inst.id);
      toast.success("Institucioni u fshi");
      onRefresh();
    } catch {
      toast.error("Gabim gjatë fshirjes");
    }
  }

  return (
    <div className="space-y-4">
      {(showForm || editInst) && (
        <InstitutionForm
          initial={editInst ?? undefined}
          onSaved={() => {
            setShowForm(false);
            setEditInst(null);
            onRefresh();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditInst(null);
          }}
        />
      )}

      <div className="overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-3 border-b px-5 py-4 lg:flex-row lg:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Kërko institucion, lloj, adresë..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground">{filtered.length} institucione</p>
          <Button
            data-admin-add-institution
            size="sm"
            className="group lg:ml-auto"
            onClick={() => {
              setEditInst(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            Shto institucion
          </Button>
        </div>

        {loading ? (
          <div className="px-5 py-14">
            <EmptyStateMotion
              variant="inbox"
              title="Po ngarkohen institucionet"
              description="Lista po përditësohet nga sistemi."
            />
          </div>
        ) : (
          <ul className="divide-y">
            {paged.slice.map((inst) => (
              <li
                key={inst.id}
                className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/30 lg:flex-row lg:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/5 text-primary ring-1 ring-inset ring-primary/10 transition-transform duration-200 group-hover:scale-105">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{inst.name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="rounded-full bg-muted px-2 py-0.5">{inst.type || "-"}</span>
                      {inst.address && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {inst.address}
                        </span>
                      )}
                      {inst.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {inst.email}
                        </span>
                      )}
                      {inst.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {inst.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <Badge variant={inst.is_active ? "outline" : "destructive"}>
                    {inst.is_active ? "Aktiv" : "Çaktivizuar"}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Edito"
                    onClick={() => {
                      setShowForm(false);
                      setEditInst(inst);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title={inst.is_active ? "Çaktivizo" : "Aktivizo"}
                    onClick={() => handleToggle(inst)}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(inst)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
            {paged.slice.length === 0 && (
              <li className="px-5 py-14">
                <EmptyStateMotion
                  variant="inbox"
                  title="Asnjë institucion i regjistruar"
                  description="Shto Autoritetet Kontraktore që do të lidhen me përdoruesit AK."
                  action={
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setEditInst(null);
                        setShowForm(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Shto institucion
                    </Button>
                  }
                />
              </li>
            )}
          </ul>
        )}

        <Pager
          page={paged.page}
          pageCount={paged.pageCount}
          total={paged.total}
          pageSize={DEFAULT_PAGE_SIZE}
          onPageChange={setPage}
          label="institucione"
        />
      </div>
    </div>
  );
}

function InstitutionForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: ApiInstitution;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [nipt, setNipt] = useState(initial?.nipt ?? "");
  const [type, setType] = useState(initial?.type ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Emri i institucionit është i detyrueshëm");
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit && initial) {
        await institutionsApi.update(initial.id, {
          name: name.trim(),
          nipt: nipt.trim(),
          type: type.trim(),
          address: address.trim(),
          email: email.trim(),
          phone: phone.trim(),
        });
        toast.success("Institucioni u përditësua");
      } else {
        await institutionsApi.create({
          name: name.trim(),
          nipt: nipt.trim(),
          type: type.trim(),
          address: address.trim(),
          email: email.trim(),
          phone: phone.trim(),
        });
        toast.success("Institucioni u shtua");
      }
      onSaved();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Ndodhi një gabim");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)] animate-[fade-in_220ms_ease-out]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Autoritet Kontraktor
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            {isEdit ? `Edito: ${initial?.name}` : "Shto institucion të ri"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Institucioni do të jetë i disponueshëm për përdoruesit AK.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="i-name">Emri i institucionit *</Label>
          <Input
            id="i-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="p.sh. Drejtoria e Përgjithshme e Policisë së Shtetit"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="i-nipt">NIPT</Label>
          <Input
            id="i-nipt"
            value={nipt}
            onChange={(e) => setNipt(e.target.value)}
            placeholder="p.sh. K12345678A"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="i-type">Lloji</Label>
          <select
            id="i-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-ring/40"
          >
            <option value="">Zgjidh llojin</option>
            {INSTITUTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="i-address">Adresa e plotë</Label>
          <Input
            id="i-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="p.sh. Rruga Dëshmorët e Kombit, Tiranë"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="i-email">Email institucional</Label>
          <Input
            id="i-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="info@bashkia.gov.al"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="i-phone">Telefon</Label>
          <Input
            id="i-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+355 4 ..."
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Anulo
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Po ruhet..." : isEdit ? "Ruaj ndryshimet" : "Shto institucionin"}
        </Button>
      </div>
    </form>
  );
}
