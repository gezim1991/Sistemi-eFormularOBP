import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { notificationsApi, type NotificationItem } from "@/lib/api/notifications";
import { useAuth } from "@/lib/auth-store";

const POLL_MS = 30_000;

interface NotificationsContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  totalCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: number) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = useCallback(async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        notificationsApi.list({ page_size: 10 }),
        notificationsApi.unreadCount(),
      ]);
      setNotifications(listRes.results);
      setTotalCount(listRes.count);
      setUnreadCount(countRes.unread_count);
    } catch {
      // silently ignore — network errors or logged-out state
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setTotalCount(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setLoading(true);
    fetch().finally(() => setLoading(false));

    timerRef.current = setInterval(fetch, POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") fetch();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user, fetch]);

  const refresh = useCallback(async () => {
    await fetch();
  }, [fetch]);

  const markRead = useCallback(async (id: number) => {
    await notificationsApi.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  const remove = useCallback(async (id: number) => {
    const target = notifications.find((n) => n.id === id);
    await notificationsApi.remove(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setTotalCount((c) => Math.max(0, c - 1));
    if (target && !target.is_read) setUnreadCount((c) => Math.max(0, c - 1));
  }, [notifications]);

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, totalCount, loading, refresh, markRead, markAllRead, remove }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be within NotificationsProvider");
  return ctx;
}
