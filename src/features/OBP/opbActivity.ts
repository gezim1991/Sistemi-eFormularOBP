/**
 * OPB activity helpers — now backed by server-side data from the API.
 * The `isNewForMe`, `opbViewedAt`, `opbDownloadedAt` fields come from FormRecord.
 * localStorage keys are kept for backward compatibility during migration but
 * are no longer the source of truth.
 */
import type { FormRecord } from "@/lib/forms-types";

/** @deprecated — activity is now tracked server-side via FormRecord.isNewForMe */
export const OPB_VIEWED_KEY = "lov.opb.viewedForms.v1";
/** @deprecated */
export const OPB_DOWNLOADED_KEY = "lov.opb.downloadedForms.v1";
/** Custom event kept for compat; no longer fired */
export const OPB_ACTIVITY_EVENT = "lov:opb-activity-changed";

/** @deprecated Use form.isNewForMe instead */
export function readSet(_key: string): Set<string> {
  return new Set<string>();
}

/** @deprecated No-op — activity tracked server-side */
export function writeSet(_key: string, _value: Set<string>): void {}

/** A form is visible to OPB only when submitted_to_opb. */
export function canBeSeenByOpb(form: FormRecord): boolean {
  return form.status === "submitted_to_opb";
}

/**
 * Count of forms that have not yet been viewed or downloaded by this OPB user.
 * Uses server-side `isNewForMe` flag if present, falls back to canBeSeenByOpb.
 */
export function getOpbFreshCount(forms: FormRecord[]): number {
  return forms.filter((f) => canBeSeenByOpb(f) && f.isNewForMe !== false).length;
}
