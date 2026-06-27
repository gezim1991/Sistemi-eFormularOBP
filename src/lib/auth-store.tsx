import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "@/lib/api/auth";

export type UserRole = "aplikues" | "opb" | "superadmin";

export interface AuthUser {
  email: string;
  name: string;
  role: UserRole;
  institucioni?: string;
  nipt?: string;
  adresaInstitucioni?: string;
  initials: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap: check if session is active
  useEffect(() => {
    authApi
      .me()
      .then(({ user: u }) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    // Ensure we have a valid CSRF token before the POST
    await authApi.fetchCsrf().catch(() => null);
    const { user: u } = await authApi.login(email, password);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    authApi
      .logout()
      .catch(() => null)
      .finally(() => setUser(null));
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
