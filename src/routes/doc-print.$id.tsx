import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, Printer } from "lucide-react";
import { formsApi } from "@/lib/api/forms";
import { FormularDocumentPreview } from "@/components/FormularDocumentPreview";
import { PuneDocumentPreview } from "@/components/PuneDocumentPreview";
import { DocumentPreview } from "@/components/DocumentPreview";
import type { FormDoc } from "@/lib/document-types";
import type { FormRecord } from "@/lib/forms-types";
import type { FormularDocumentData, PunePublikeDocumentData } from "@/lib/mock-data";

export const Route = createFileRoute("/doc-print/$id")({
  head: () => ({
    meta: [{ title: "e-Formular OBP · Shtyp dokument" }],
  }),
  component: DocPrintRoute,
});

function DocPrintRoute() {
  const { id } = Route.useParams();
  const [form, setForm] = useState<FormRecord | null>(null);
  const [documentPreview, setDocumentPreview] = useState<FormDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    Promise.allSettled([formsApi.get(id), formsApi.documentPreview(id)])
      .then(([formResult, docResult]) => {
        if (formResult.status === "fulfilled") setForm(formResult.value);
        if (docResult.status === "fulfilled") setDocumentPreview(docResult.value);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDownload() {
    if (!form) return;
    setDownloading(true);
    try {
      await formsApi.downloadPdf(form.id, `${form.id}.pdf`);
    } catch {
      alert("Shkarkimi dështoi. Sigurohuni që PDF është gjeneruar.");
    } finally {
      setDownloading(false);
    }
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

  const isPune =
    form.document != null &&
    "formType" in form.document &&
    (form.document as PunePublikeDocumentData).formType === "pune";

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
              Duke shkarkuar...
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

      {documentPreview ? (
        <DocumentPreview doc={documentPreview} />
      ) : isPune ? (
        <PuneDocumentPreview
          document={form.document as PunePublikeDocumentData}
          adresa={form.adresa || form.institucioni}
        />
      ) : (
        <FormularDocumentPreview document={form.document as FormularDocumentData | undefined} />
      )}
    </div>
  );
}
