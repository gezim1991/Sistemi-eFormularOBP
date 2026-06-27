import { createFileRoute } from "@tanstack/react-router";
import { ALL_STATUSES, FormsListPage, type FormsSearch } from "@/features/AK/FormsListPage";
import type { FormStatus } from "@/lib/forms-types";

export const Route = createFileRoute("/forms/")({
  validateSearch: (s: Record<string, unknown>): FormsSearch => {
    const raw = typeof s.status === "string" ? (s.status as FormStatus) : undefined;
    return { status: raw && ALL_STATUSES.includes(raw) ? raw : undefined };
  },
  head: () => ({
    meta: [
      { title: "e-Formular OBP · Formularët" },
      {
        name: "description",
        content: "Lista e të gjithë formularëve elektronikë dhe statusi i tyre.",
      },
    ],
  }),
  component: FormsRoute,
});

function FormsRoute() {
  const search = Route.useSearch();
  return <FormsListPage search={search} />;
}
