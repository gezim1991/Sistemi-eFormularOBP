import type { AuthUser } from "@/lib/auth-store";
import { apiJson, apiFetch } from "./client";

export const authApi = {
  /** Fetch CSRF token (call once on app startup). */
  fetchCsrf: () => apiJson<{ csrfToken: string }>("/auth/csrf/"),

  /** Login — sets HttpOnly session cookie, returns user profile. */
  login: (email: string, password: string) =>
    apiJson<{ user: AuthUser }>("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  /** Logout — clears session cookie. */
  logout: () => apiFetch("/auth/logout/", { method: "POST" }),

  /** Return the currently authenticated user (or 403 if not logged in). */
  me: () => apiJson<{ user: AuthUser }>("/auth/me/"),
};
