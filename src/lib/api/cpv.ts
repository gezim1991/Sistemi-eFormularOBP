import { apiJson, apiFetch } from "./client";

export interface ApiCpvCode {
  id: number;
  group: string;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export interface CpvCodeLite {
  group: string;
  name: string;
  code: string;
}

export const cpvApi = {
  list: (params: { search?: string; page?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    const query = qs.toString();
    return apiJson<{ count: number; results: ApiCpvCode[] }>(
      `/cpv-codes/${query ? `?${query}` : ""}`,
    );
  },

  all: () => apiJson<CpvCodeLite[]>("/cpv-codes/all/"),

  create: (data: { group: string; name: string; code: string }) =>
    apiJson<ApiCpvCode>("/cpv-codes/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<{ group: string; name: string; code: string }>) =>
    apiJson<ApiCpvCode>(`/cpv-codes/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: async (id: number) => {
    const res = await apiFetch(`/cpv-codes/${id}/`, { method: "DELETE" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  },

  importCsv: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiJson<{ created: number; updated: number; skipped: number }>(
      "/cpv-codes/import_csv/",
      { method: "POST", body: formData },
    );
  },
};
