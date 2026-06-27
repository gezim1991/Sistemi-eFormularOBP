// Adapter around forms-store that exposes the richer `useFormulare` shape
// expected by the procurement-planning form (FormularCreatePage).
import { useMemo } from "react";
import { useForms } from "./forms-store";
import { formsApi } from "./api/forms";
import type { FormRecord } from "./forms-types";

export interface FormularRecord extends FormRecord {
  emerFormulari: string;
  /** Convenience accessor — the flat record fields surfaced as `data.*` */
  data: FormRecord;
}

function enrich(f: FormRecord | undefined): FormularRecord | undefined {
  if (!f) return undefined;
  return { ...f, emerFormulari: f.emerFormulari ?? f.id, data: f };
}

export function useFormulare() {
  const { forms, getById, create, update, setStatus, remove, refresh } = useForms();

  return useMemo(
    () => ({
      formulare: forms.map((f) => enrich(f)!) as FormularRecord[],

      get: (id: string) => enrich(getById(id)),

      // Now async — returns Promise<FormularRecord>
      create: async (title: string, partial: Partial<FormRecord>): Promise<FormularRecord> => {
        const form = await create({
          emri: partial.emri ?? "",
          mbiemri: partial.mbiemri ?? "",
          atesia: partial.atesia ?? "",
          nid: partial.nid ?? "",
          datelindja: partial.datelindja || null,
          email: partial.email ?? "",
          telefon: partial.telefon ?? "",
          adresa: partial.adresa ?? "",
          institucioni: partial.institucioni ?? "",
          arsyeja: partial.arsyeja ?? "",
          emerFormulari: title,
        });
        return enrich(form)!;
      },

      update: (id: string, patch: Partial<FormRecord>) => update(id, patch),
      updateData: (id: string, patch: Partial<FormRecord>) => update(id, patch),

      generatePdf: async (id: string): Promise<FormularRecord> => {
        const form = await formsApi.generatePdf(id);
        // Sync store so the list shows pdf_generated status immediately
        refresh().catch(() => null);
        return enrich(form)!;
      },

      setStatus,
      remove,
    }),
    [forms, getById, create, update, setStatus, remove, refresh],
  );
}
