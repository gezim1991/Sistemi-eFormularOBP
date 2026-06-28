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
  list: () => apiJson<ListResponse>("/notifications/"),
  markRead: (id: number) =>
    apiFetch(`/notifications/${id}/read/`, { method: "POST" }),
  markAllRead: () =>
    apiFetch("/notifications/read-all/", { method: "POST" }),
  unreadCount: () =>
    apiJson<{ unread_count: number }>("/notifications/unread-count/"),
  remove: (id: number) =>
    apiFetch(`/notifications/${id}/`, { method: "DELETE" }),
};
