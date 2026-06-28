import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Download, Printer } from "lucide-react";
import { formsApi } from "@/lib/api/forms";
import { FormularDocumentPreview } from "@/components/FormularDocumentPreview";
import { FormularDocumentPdf } from "@/components/FormularDocumentPdf";
import { downloadElementAsPdf } from "@/lib/pdf-download";
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
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    formsApi
      .get(id)
      .then((f) => setForm(f))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDownload() {
    if (!form) return;
    setDownloading(true);

    // Render the clean PDF version off-screen and capture it
    const wrapper = document.createElement("div");
    wrapper.style.cssText =
      "position:fixed;top:0;left:0;width:794px;visibility:hidden;pointer-events:none;z-index:-9999;overflow:hidden;";
    document.body.appendChild(wrapper);
    const root = createRoot(wrapper);
    root.render(<FormularDocumentPdf document={form.document} />);
    await new Promise<void>((resolve) => setTimeout(resolve, 900));
    const el = wrapper.firstElementChild as HTMLElement | null;
    if (el) await downloadElementAsPdf(el, `${form.id}.pdf`);
    root.unmount();
    document.body.removeChild(wrapper);

    setDownloading(false);
  }

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
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-navy/90 disabled:opacity-60"
        >
          {downloading ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Duke gjeneruar...
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5" /> Shkarko PDF
            </>
          )}
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-md border border-navy/20 bg-white px-3 py-1.5 text-sm font-medium text-navy transition-colors hover:bg-navy/5"
        >
          <Printer className="h-3.5 w-3.5" /> Shtyp
        </button>
      </div>
      {/* On-screen preview keeps its visual styling */}
      <FormularDocumentPreview document={form.document} />
    </div>
  );
}
