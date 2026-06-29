import { useCallback, useState } from "react";
import { formsApi } from "@/lib/api/forms";
import type { FormRecord } from "@/lib/forms-types";

export type PdfState = "idle" | "downloading" | "done";

export function useFormPdfDownload() {
  const [pdfState, setPdfState] = useState<PdfState>("idle");

  const download = useCallback(
    async (form: FormRecord) => {
      if (pdfState !== "idle") return;
      setPdfState("downloading");
      try {
        await formsApi.downloadPdf(form.id, `${form.id}.pdf`);
        setPdfState("done");
        setTimeout(() => setPdfState("idle"), 2500);
      } catch (err) {
        setPdfState("idle");
        throw err;
      }
    },
    [pdfState],
  );

  return { download, pdfState };
}
