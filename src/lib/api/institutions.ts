import { apiJson, apiFetch } from "./client";

export interface ApiInstitution {
  id: number;
  name: string;
  nipt: string;
  type: string;
  address: string;
  email: string;
  phone: string;
  is_active: boolean;
}

export const institutionsApi = {
  list: () => apiJson<{ count: number; results: ApiInstitution[] }>("/institutions/"),

  create: (data: Omit<ApiInstitution, "id" | "is_active">) =>
    apiJson<ApiInstitution>("/institutions/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<ApiInstitution>) =>
    apiJson<ApiInstitution>(`/institutions/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: async (id: number) => {
    const res = await apiFetch(`/institutions/${id}/`, { method: "DELETE" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  },
};
