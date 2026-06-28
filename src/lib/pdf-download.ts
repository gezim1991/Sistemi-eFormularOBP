/**
 * Captures an HTML element and downloads it as a PDF file.
 * Uses html2pdf.js (html2canvas + jsPDF) so the output matches
 * the browser's visual rendering exactly — no print dialog shown.
 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  filename: string,
  onProgress?: (phase: "rendering" | "done") => void,
): Promise<void> {
  // Dynamic import keeps the bundle lean — only loaded on demand
  const html2pdf = (await import("html2pdf.js")).default;

  onProgress?.("rendering");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opt: any = {
    margin: 0,
    filename,
    image: { type: "jpeg", quality: 0.97 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
      // html2canvas crashes on oklch() colors used by Tailwind v4.
      // FormularDocumentPdf uses only inline styles, so stripping all
      // external/embedded stylesheets from the clone is safe.
      onclone: (_cloneDoc: Document, element: HTMLElement) => {
        const root = element.getRootNode() as Document;
        root.querySelectorAll<HTMLElement>('link[rel="stylesheet"], style').forEach((s) => s.remove());
      },
    },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["avoid-all", "css"], before: ".doc-page-break" },
  };

  await html2pdf().set(opt).from(element).save();
  onProgress?.("done");
}
