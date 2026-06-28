import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usersApi, type ApiUser } from "./api/users";
import { useAuth } from "@/lib/auth-store";

export type ManagedUserRole = "opb" | "ak";

export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: ManagedUserRole;
  institucioni: string;
  createdAt: string;
  active: boolean;
}

function toManagedUser(u: ApiUser): ManagedUser {
  return {
    id: String(u.id),
    email: u.email,
    name: u.full_name,
    role: u.role === "OPB" ? "opb" : "ak",
    institucioni: u.institution_name ?? "",
    createdAt: u.created_at,
    active: u.is_active,
  };
}

interface Ctx {
  users: ManagedUser[];
  loading: boolean;
  addUser: (
    u: Omit<ManagedUser, "id" | "createdAt" | "active"> & {
      password: string;
      institutionId?: number;
    },
  ) => Promise<ManagedUser>;
  toggleUser: (id: string) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
}

const ManagedUsersContext = createContext<Ctx | null>(null);

export function ManagedUsersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "superadmin") {
      setUsers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    usersApi
      .list()
      .then((res) => setUsers(res.results.map(toManagedUser)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const addUser = useCallback(
    async (
      u: Omit<ManagedUser, "id" | "createdAt" | "active"> & {
        password: string;
        institutionId?: number;
      },
    ): Promise<ManagedUser> => {
      const created = await usersApi.create({
        email: u.email,
        full_name: u.name,
        role: u.role === "opb" ? "OPB" : "AK",
        password: u.password,
        institution: u.institutionId ?? null,
      });
      const managed = toManagedUser(created);
      setUsers((prev) => [managed, ...prev]);
      return managed;
    },
    [],
  );

  const toggleUser = useCallback(
    async (id: string) => {
      const target = users.find((u) => u.id === id);
      if (!target) return;
      const updated = await usersApi.update(Number(id), { is_active: !target.active });
      setUsers((prev) => prev.map((u) => (u.id === id ? toManagedUser(updated) : u)));
    },
    [users],
  );

  const removeUser = useCallback(async (id: string) => {
    await usersApi.delete(Number(id));
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const value = useMemo(
    () => ({ users, loading, addUser, toggleUser, removeUser }),
    [users, loading, addUser, toggleUser, removeUser],
  );

  return <ManagedUsersContext.Provider value={value}>{children}</ManagedUsersContext.Provider>;
}

export function useManagedUsers() {
  const ctx = useContext(ManagedUsersContext);
  if (!ctx) throw new Error("useManagedUsers must be used within ManagedUsersProvider");
  return ctx;
}
