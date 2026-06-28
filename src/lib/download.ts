/**
 * Triggers a direct file download by creating a temporary <a> element.
 * Works for same-origin URLs with session-cookie auth — the browser
 * includes cookies automatically, so no extra headers needed.
 */
export function triggerDownload(url: string, filename?: string) {
  const a = document.createElement("a");
  a.href = url;
  if (filename) a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
