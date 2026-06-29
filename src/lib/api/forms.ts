import type { FormRecord } from "@/lib/forms-types";
import { apiJson, apiFetch, API_BASE } from "./client";

interface FormsListResponse {
  count: number;
  results: FormRecord[];
}

export const formsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiJson<FormsListResponse>(`/forms/${qs}`);
  },

  get: (id: string) => apiJson<FormRecord>(`/forms/${id}/`),

  create: (data: Partial<FormRecord>) =>
    apiJson<FormRecord>("/forms/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<FormRecord>) =>
    apiJson<FormRecord>(`/forms/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) => apiFetch(`/forms/${id}/`, { method: "DELETE" }),

  generatePdf: (id: string) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);
    return apiJson<FormRecord>(`/forms/${id}/generate-pdf/`, {
      method: "POST",
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));
  },

  /** Returns a direct-download URL (opens file response). */
  downloadPdfUrl: (id: string) => `${API_BASE}/forms/${id}/download-pdf/`,

  uploadSigned: (id: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiJson<FormRecord>(`/forms/${id}/upload-signed/`, {
      method: "POST",
      body: fd,
    });
  },

  uploadAttachment: (id: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiJson<FormRecord>(`/forms/${id}/upload-attachment/`, { method: "POST", body: fd });
  },

  deleteAttachment: (id: string, attachmentId: number) =>
    apiJson<FormRecord>(`/forms/${id}/attachments/${attachmentId}/`, { method: "DELETE" }),

  downloadAttachmentUrl: (id: string, attachmentId: number) =>
    `${API_BASE}/forms/${id}/attachments/${attachmentId}/download/`,

  submitToOpb: (id: string) =>
    apiJson<FormRecord>(`/forms/${id}/submit-to-opb/`, { method: "POST" }),

  markViewed: (id: string) => apiFetch(`/forms/${id}/mark-viewed/`, { method: "POST" }),

  opbSummary: () =>
    apiJson<{ total: number; new_count: number; viewed_count: number; downloaded_count: number }>(
      "/forms/opb-summary/",
    ),
};
