import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Hash, Layers, Loader2, Pencil, Plus, Search, Tags, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { EmptyStateMotion } from "@/components/EmptyStateMotion";
import { AppShell } from "@/components/layout/AppShell";
import { Pager } from "@/components/Pager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-store";
import { cpvApi, type ApiCpvCode } from "@/lib/api/cpv";
import { cn } from "@/lib/utils";

import { AdminGuard } from "./AdminShared";

const PAGE_SIZE = 20;

function useCpvCodes(search: string, page: number) {
  const [codes, setCodes] = useState<ApiCpvCode[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    cpvApi
      .list({ search: search || undefined, page })
      .then((r) => {
        setCodes(r.results);
        setCount(r.count);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(reload, [reload]);

  return { codes, count, loading, reload };
}

export function AdminCpvCodesPage() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(q.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const { codes, count, loading, reload } = useCpvCodes(search, page);

  if (user?.role !== "superadmin") return <AdminGuard />;

  return (
    <AppShell
      title="Kodet CPV"
      description="Menaxho kodet e fjalorit të përbashkët të prokurimit (CPV) të përdorura në formularë."
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Kodet CPV" }]}
    >
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="group rounded-xl border bg-card p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/5 text-primary ring-1 ring-inset ring-primary/10 transition-transform duration-200 group-hover:scale-105">
              <Tags className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Kode CPV total
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">{count}</p>
          </div>
          <div className="group rounded-xl border bg-card p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-accent/15 text-[oklch(0.45_0.13_65)] ring-1 ring-inset ring-accent/30 transition-transform duration-200 group-hover:scale-105">
              <Hash className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Përdoren në Tabelën 1
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">Identifikimi i nevojave</p>
          </div>
        </div>

        <CpvCodesManager
          codes={codes}
          count={count}
          loading={loading}
          page={page}
          q={q}
          onQChange={setQ}
          onPageChange={setPage}
          onRefresh={reload}
        />
      </div>
    </AppShell>
  );
}

function CpvCodesManager({
  codes,
  count,
  loading,
  page,
  q,
  onQChange,
  onPageChange,
  onRefresh,
}: {
  codes: ApiCpvCode[];
  count: number;
  loading: boolean;
  page: number;
  q: string;
  onQChange: (v: string) => void;
  onPageChange: (p: number) => void;
  onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editCode, setEditCode] = useState<ApiCpvCode | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(count / PAGE_SIZE)), [count]);

  async function handleDelete(code: ApiCpvCode) {
    if (!confirm(`Fshi kodin CPV "${code.code} — ${code.name}"?`)) return;
    try {
      await cpvApi.delete(code.id);
      toast.success("Kodi CPV u fshi");
      onRefresh();
    } catch {
      toast.error("Gabim gjatë fshirjes");
    }
  }

  async function handleImportFile(file: File) {
    setImporting(true);
    try {
      const r = await cpvApi.importCsv(file);
      toast.success(
        `Importi përfundoi: ${r.created} shtuar, ${r.updated} përditësuar${r.skipped ? `, ${r.skipped} anashkaluar` : ""}`,
      );
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gabim gjatë importit të CSV-së");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-4">
      {(showForm || editCode) && (
        <CpvCodeForm
          initial={editCode ?? undefined}
          onSaved={() => {
            setShowForm(false);
            setEditCode(null);
            onRefresh();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditCode(null);
          }}
        />
      )}

      <div className="overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-3 border-b px-5 py-4 lg:flex-row lg:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Kërko sipas kodit, emrit, grupit..."
              value={q}
              onChange={(e) => onQChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground">{count} kode CPV</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) handleImportFile(file);
            }}
          />
          <Button
            size="sm"
            variant="outline"
            className="lg:ml-auto"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
            title="Importo grup kodesh nga një file CSV (kolonat: group, name, code)"
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Importo CSV
          </Button>
          <Button
            size="sm"
            className="group"
            onClick={() => {
              setEditCode(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            Shto kod CPV
          </Button>
        </div>

        {loading ? (
          <div className="px-5 py-14">
            <EmptyStateMotion
              variant="inbox"
              title="Po ngarkohen kodet CPV"
              description="Lista po përditësohet nga sistemi."
            />
          </div>
        ) : (
          <ul className="divide-y">
            {codes.map((c) => (
              <li
                key={c.id}
                className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/30 lg:flex-row lg:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/5 text-primary ring-1 ring-inset ring-primary/10 transition-transform duration-200 group-hover:scale-105">
                    <Tags className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="rounded-full bg-muted px-2 py-0.5 font-mono">{c.code}</span>
                      {c.group && (
                        <span className="inline-flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          {c.group}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Edito"
                    onClick={() => {
                      setShowForm(false);
                      setEditCode(c);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(c)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
            {codes.length === 0 && (
              <li className="px-5 py-14">
                <EmptyStateMotion
                  variant="inbox"
                  title="Asnjë kod CPV i gjetur"
                  description="Shto kode CPV që do të jenë të disponueshme në formularë."
                  action={
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setEditCode(null);
                        setShowForm(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Shto kod CPV
                    </Button>
                  }
                />
              </li>
            )}
          </ul>
        )}

        <Pager
          page={page}
          pageCount={pageCount}
          total={count}
          pageSize={PAGE_SIZE}
          onPageChange={onPageChange}
          label="kode CPV"
        />
      </div>
    </div>
  );
}

function CpvCodeForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: ApiCpvCode;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [group, setGroup] = useState(initial?.group ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.error("Emri dhe kodi janë të detyrueshëm");
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit && initial) {
        await cpvApi.update(initial.id, {
          name: name.trim(),
          code: code.trim(),
          group: group.trim(),
        });
        toast.success("Kodi CPV u përditësua");
      } else {
        await cpvApi.create({ name: name.trim(), code: code.trim(), group: group.trim() });
        toast.success("Kodi CPV u shtua");
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
      className={cn(
        "rounded-xl border bg-card p-5 shadow-[var(--shadow-card)] animate-[fade-in_220ms_ease-out]",
      )}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Kod CPV
        </p>
        <h2 className="mt-1 text-lg font-semibold">
          {isEdit ? `Edito: ${initial?.code}` : "Shto kod CPV të ri"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Kodi do të jetë i disponueshëm në fushën "Kodi CPV" të formularëve.
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="cpv-name">Emri i kodit *</Label>
          <Input
            id="cpv-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="p.sh. Lëkurë dhe pëlhura tekstile"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="cpv-code">Kodi *</Label>
          <Input
            id="cpv-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="p.sh. 19000000-6"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="cpv-group">Grupi</Label>
          <Input
            id="cpv-group"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            placeholder="p.sh. Coha lëkure dhe tekstile"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Anulo
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Po ruhet..." : isEdit ? "Ruaj ndryshimet" : "Shto kodin"}
        </Button>
      </div>
    </form>
  );
}
