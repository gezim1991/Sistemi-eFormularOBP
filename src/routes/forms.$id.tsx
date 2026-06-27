import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { FormDetailsPage } from "@/features/AK/FormDetailsPage";

export const Route = createFileRoute("/forms/$id")({
  head: () => ({
    meta: [{ title: "e-Formular OBP · Detaje aplikimi" }],
  }),
  component: FormDetailsRoute,
  notFoundComponent: () => (
    <AppShell title="Aplikim i pagjetur">
      <p className="text-sm text-muted-foreground">Aplikimi nuk ekziston ose është fshirë.</p>
    </AppShell>
  ),
});

function FormDetailsRoute() {
  const { id } = Route.useParams();
  return <FormDetailsPage id={id} />;
}
