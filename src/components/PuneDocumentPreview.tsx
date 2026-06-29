import type { PunePublikeDocumentData } from "@/lib/mock-data"
import { buildPuneDoc } from "@/lib/document-builder"
import { DocumentPreview } from "@/components/DocumentPreview"

export function PuneDocumentPreview({
  document,
  adresa,
}: {
  document: Partial<PunePublikeDocumentData>
  adresa?: string
}) {
  return <DocumentPreview doc={buildPuneDoc(document, adresa)} />
}
