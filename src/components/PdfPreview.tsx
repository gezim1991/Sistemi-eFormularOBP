import type { FormRecord } from "@/lib/forms-types";

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("sq-AL", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function PdfPreview({ form }: { form: FormRecord }) {
  return (
    <div className="mx-auto w-full max-w-[820px] rounded-md border bg-white shadow-[var(--shadow-elevated)]">
      <div
        className="aspect-[1/1.414] w-full overflow-hidden px-12 py-14 text-[oklch(0.22_0.05_260)]"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        <div className="mb-10 border-b border-[oklch(0.85_0.01_255)] pb-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Republika e Shqipërisë
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">FORMULAR APLIKIMI ZYRTAR</h1>
          <p className="mt-2 text-xs text-muted-foreground">
            Nr. i aplikimit: <span className="font-mono">{form.id}</span>
          </p>
        </div>

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[oklch(0.24_0.07_262)]">
            Të dhënat personale
          </h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <Row label="Emri" value={form.emri} />
            <Row label="Mbiemri" value={form.mbiemri} />
            <Row label="Atësia" value={form.atesia} />
            <Row label="NID" value={form.nid} mono />
            <Row label="Datëlindja" value={fmtDate(form.datelindja)} />
          </dl>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[oklch(0.24_0.07_262)]">
            Kontakti
          </h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <Row label="Email" value={form.email} />
            <Row label="Telefon" value={form.telefon} />
            <Row label="Adresa" value={form.adresa} full />
          </dl>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[oklch(0.24_0.07_262)]">
            Institucioni dhe arsyeja
          </h2>
          <dl className="grid grid-cols-1 gap-y-2 text-sm">
            <Row label="Institucioni" value={form.institucioni} />
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Arsyeja e aplikimit
              </dt>
              <dd className="mt-1 whitespace-pre-line leading-relaxed">{form.arsyeja}</dd>
            </div>
          </dl>
        </section>

        <div className="mt-16 flex items-end justify-between text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Data</p>
            <p className="mt-1 font-medium">{fmtDate(form.updatedAt)}</p>
          </div>
          <div className="text-right">
            <div className="h-14 w-64 border-b border-[oklch(0.3_0.05_260)]" />
            <p className="mt-2 text-xs text-muted-foreground">
              Firma e aplikuesit: __________________
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  full,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={"mt-0.5 " + (mono ? "font-mono" : "font-medium")}>{value || "—"}</dd>
    </div>
  );
}
