import { apiFetch, apiJson } from "./client";

export type NotificationType =
  | "form_submitted"
  | "form_viewed"
  | "form_downloaded"
  | "generic";

export interface NotificationItem {
  id: number;
  form: string | null;
  form_public_id: string | null;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

interface ListResponse {
  count: number;
  results: NotificationItem[];
}

export const notificationsApi = {
  list: (params?: { page?: number; page_size?: number; is_read?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    if (params?.is_read !== undefined) qs.set("is_read", String(params.is_read));
    const q = qs.toString();
    return apiJson<ListResponse>(`/notifications/${q ? `?${q}` : ""}`);
  },
  markRead: (id: number) =>
    apiFetch(`/notifications/${id}/read/`, { method: "POST" }),
  markAllRead: () =>
    apiFetch("/notifications/read-all/", { method: "POST" }),
  unreadCount: () =>
    apiJson<{ unread_count: number }>("/notifications/unread-count/"),
  remove: (id: number) =>
    apiFetch(`/notifications/${id}/`, { method: "DELETE" }),
};
