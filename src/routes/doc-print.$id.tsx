import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { formsApi } from "@/lib/api/forms";
import { FormularDocumentPreview } from "@/components/FormularDocumentPreview";
import type { FormRecord } from "@/lib/forms-types";

export const Route = createFileRoute("/doc-print/$id")({
  head: () => ({
    meta: [{ title: "e-Formular OBP · Shtyp dokument" }],
  }),
  component: DocPrintRoute,
});

function DocPrintRoute() {
  const { id } = Route.useParams();
  const [form, setForm] = useState<FormRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    formsApi
      .get(id)
      .then((f) => setForm(f))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [id]);

  // Auto-trigger print after fonts and layout settle
  useEffect(() => {
    if (!form) return;
    const timer = window.setTimeout(() => window.print(), 900);
    return () => window.clearTimeout(timer);
  }, [form]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-muted-foreground">Duke ngarkuar dokumentin...</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-destructive">Dokumenti nuk u gjet.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <div className="mb-6 flex items-center justify-center gap-3 print:hidden">
        <p className="text-sm text-muted-foreground">
          Klikoni butonin ose shtypni{" "}
          <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-xs">Ctrl+P</kbd>{" "}
          për të ruajtur si PDF.
        </p>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-navy/90"
        >
          <Printer className="h-3.5 w-3.5" /> Shtyp / Ruaj si PDF
        </button>
      </div>
      <FormularDocumentPreview document={form.document} />
    </div>
  );
}
