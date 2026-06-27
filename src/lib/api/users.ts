import { apiJson, apiFetch } from "./client";

export interface ApiUser {
  id: number;
  email: string;
  full_name: string;
  role: string; // AK | OPB | ADMIN
  frontend_role: string; // aplikues | opb | superadmin
  institution: number | null;
  institution_name: string | null;
  initials: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const usersApi = {
  list: () => apiJson<{ count: number; results: ApiUser[] }>("/users/"),

  create: (data: {
    email: string;
    full_name: string;
    role: string;
    institution?: number | null;
    password: string;
  }) =>
    apiJson<ApiUser>("/users/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<ApiUser & { password?: string }>) =>
    apiJson<ApiUser>(`/users/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: async (id: number) => {
    const res = await apiFetch(`/users/${id}/`, { method: "DELETE" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  },
};
