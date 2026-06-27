import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { formsApi } from "@/lib/api/forms";
import { type FormRecord, type FormStatus } from "./forms-types";

interface FormsContextValue {
  forms: FormRecord[];
  loading: boolean;
  getById: (id: string) => FormRecord | undefined;
  refresh: () => Promise<void>;
  create: (
    data: Omit<FormRecord, "id" | "status" | "createdAt" | "updatedAt">,
  ) => Promise<FormRecord>;
  update: (id: string, patch: Partial<FormRecord>) => Promise<void>;
  setStatus: (id: string, status: FormStatus) => Promise<void>;
  remove: (id: string) => Promise<void>;
  unseenCount: number;
  markFormsSeen: () => void;
}

const FormsContext = createContext<FormsContextValue | null>(null);

export function FormsProvider({ children }: { children: ReactNode }) {
  const [forms, setForms] = useState<FormRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [seenCount, setSeenCount] = useState(0);

  const fetchForms = useCallback(async () => {
    try {
      const { results } = await formsApi.list();
      setForms(results);
      setSeenCount((prev) => (prev === 0 ? results.length : prev));
    } catch {
      // Unauthenticated or network error — leave empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const refresh = useCallback(() => fetchForms(), [fetchForms]);

  const getById = useCallback((id: string) => forms.find((f) => f.id === id), [forms]);

  const create = useCallback(
    async (data: Omit<FormRecord, "id" | "status" | "createdAt" | "updatedAt">) => {
      const form = await formsApi.create(data);
      setForms((prev) => [form, ...prev]);
      return form;
    },
    [],
  );

  const update = useCallback(async (id: string, patch: Partial<FormRecord>) => {
    const updated = await formsApi.update(id, patch);
    setForms((prev) => prev.map((f) => (f.id === id ? updated : f)));
  }, []);

  const setStatus = useCallback(async (id: string, _status: FormStatus) => {
    // Status changes happen via dedicated action endpoints (generate-pdf, submit-to-opb, etc.)
    // This thin wrapper refreshes the form from the server.
    try {
      const updated = await formsApi.get(id);
      setForms((prev) => prev.map((f) => (f.id === id ? updated : f)));
    } catch {
      // If the form was deleted or not accessible, just ignore
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    await formsApi.delete(id);
    setForms((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const unseenCount = Math.max(0, forms.length - seenCount);
  const markFormsSeen = useCallback(() => setSeenCount(forms.length), [forms.length]);

  const value = useMemo(
    () => ({
      forms,
      loading,
      getById,
      refresh,
      create,
      update,
      setStatus,
      remove,
      unseenCount,
      markFormsSeen,
    }),
    [
      forms,
      loading,
      getById,
      refresh,
      create,
      update,
      setStatus,
      remove,
      unseenCount,
      markFormsSeen,
    ],
  );

  return <FormsContext.Provider value={value}>{children}</FormsContext.Provider>;
}

export function useForms() {
  const ctx = useContext(FormsContext);
  if (!ctx) throw new Error("useForms must be used within FormsProvider");
  return ctx;
}
