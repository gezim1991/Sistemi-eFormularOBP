import type { FormularDocumentData } from "@/lib/mock-data"
import { buildMallraDoc } from "@/lib/document-builder"
import { DocumentPreview } from "@/components/DocumentPreview"

export function FormularDocumentPreview({
  document,
}: {
  document: Partial<FormularDocumentData> | undefined
}) {
  return <DocumentPreview doc={buildMallraDoc(document)} />
}
