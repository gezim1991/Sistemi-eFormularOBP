import { useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import { FormularDocumentPdf } from "@/components/FormularDocumentPdf";
import { downloadElementAsPdf } from "@/lib/pdf-download";
import type { FormRecord } from "@/lib/forms-types";

export type PdfState = "idle" | "rendering" | "done";

/**
 * Returns a `download(form)` function that renders FormularDocumentPreview
 * into a hidden off-screen element and exports it as PDF — no print dialog,
 * no new tab. The output matches exactly what the user sees in the preview.
 */
export function useFormPdfDownload() {
  const [pdfState, setPdfState] = useState<PdfState>("idle");

  const download = useCallback(async (form: FormRecord) => {
    if (pdfState !== "idle") return;
    setPdfState("rendering");

    // Mount a hidden container — must be in the DOM so Tailwind CSS applies
    const wrapper = document.createElement("div");
    wrapper.style.cssText =
      "position:fixed;top:0;left:0;width:794px;visibility:hidden;pointer-events:none;z-index:-9999;overflow:hidden;";
    document.body.appendChild(wrapper);

    const root = createRoot(wrapper);
    root.render(<FormularDocumentPdf document={form.document} />);

    // Give React and fonts time to paint
    await new Promise<void>((resolve) => setTimeout(resolve, 800));

    const el = wrapper.firstElementChild as HTMLElement | null;
    if (el) {
      await downloadElementAsPdf(el, `${form.id}.pdf`);
    }

    // Cleanup
    root.unmount();
    document.body.removeChild(wrapper);

    setPdfState("done");
    setTimeout(() => setPdfState("idle"), 2500);
  }, [pdfState]);

  return { download, pdfState };
}
