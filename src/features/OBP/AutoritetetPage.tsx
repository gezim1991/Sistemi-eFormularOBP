import { useEffect, useMemo, useState } from "react";
import { Building2, Search, MapPin, FileText } from "lucide-react";
import { EmptyStateMotion } from "@/components/EmptyStateMotion";
import { AppShell } from "@/components/layout/AppShell";
import { Pager, usePaged, DEFAULT_PAGE_SIZE } from "@/components/Pager";
import { useForms } from "@/lib/forms-store";
import { institutionsApi, type ApiInstitution } from "@/lib/api/institutions";

export function AutoritetetPage() {
  const { forms } = useForms();
  const [q, setQ] = useState("");
  const [institutions, setInstitutions] = useState<ApiInstitution[]>([]);

  useEffect(() => {
    institutionsApi
      .list()
      .then((res) => setInstitutions(res.results))
      .catch(() => {});
  }, []);

  const list = useMemo(() => {
    // Count submitted forms per institution name
    const formCount = new Map<string, number>();
    for (const f of forms) {
      const name = f.institucioni?.trim();
      if (!name) continue;
      formCount.set(name, (formCount.get(name) ?? 0) + 1);
    }

    const term = q.trim().toLowerCase();
    return institutions
      .filter((inst) => inst.is_active)
      .filter((inst) =>
        term ? [inst.name, inst.type, inst.address].join(" ").toLowerCase().includes(term) : true,
      )
      .map((inst) => ({
        emri: inst.name,
        lloji: inst.type || "—",
        qyteti: inst.address || "—",
        numForms: formCount.get(inst.name) ?? 0,
      }))
      .sort((a, b) => a.emri.localeCompare(b.emri, "sq"));
  }, [institutions, forms, q]);

  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [q]);
  const paged = usePaged(list, page, DEFAULT_PAGE_SIZE);
  const pageRows = paged.slice;

  return (
    <AppShell
      title="Autoritetet Kontraktore"
      description="Të gjitha autoritetet që dorëzojnë aplikime në Zyrën e Pranimit të Formularëve."
      breadcrumbs={[{ label: "Paneli", to: "/" }, { label: "Autoritetet" }]}
    >
      <div className="rounded-xl border bg-card shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-3 border-b px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold">Lista e Autoriteteve ({list.length})</h2>
            <p className="text-xs text-muted-foreground">
              Institucionet aktive që janë regjistruar në platformë.
            </p>
          </div>
          <div className="relative max-w-sm flex-1 lg:flex-none lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Kërko autoritet, qytet, lloj..."
              className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
        </div>

        <ul className="divide-y">
          {pageRows.map((a) => (
            <li
              key={a.emri}
              className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/5 text-primary ring-1 ring-inset ring-primary/10">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{a.emri}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-0.5">{a.lloji}</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {a.qyteti}
                    </span>
                  </div>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-[oklch(0.42_0.12_60)] sm:self-auto">
                <FileText className="h-3.5 w-3.5" />
                {a.numForms} formularë
              </div>
            </li>
          ))}
          {list.length === 0 && (
            <li className="px-5 py-16">
              <EmptyStateMotion
                variant="inbox"
                title="Asnjë autoritet i regjistruar"
                description="Autoritetet shfaqen këtu pasi admini i shton në sistem."
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
          label="autoritete"
        />
      </div>
    </AppShell>
  );
}
