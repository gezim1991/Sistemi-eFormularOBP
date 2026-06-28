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
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = useCallback(async () => {
    try {
      const { results } = await notificationsApi.list();
      setNotifications(results);
    } catch {
      // silently ignore — network errors or logged-out state
    }
  }, []);

  // Start / stop polling based on auth
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setLoading(true);
    fetch().finally(() => setLoading(false));

    timerRef.current = setInterval(fetch, POLL_MS);

    // Re-fetch when the tab becomes visible again
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
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, []);

  const remove = useCallback(async (id: number) => {
    await notificationsApi.remove(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, loading, refresh, markRead, markAllRead, remove }}
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
