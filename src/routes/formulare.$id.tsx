import { createFileRoute } from "@tanstack/react-router";
import { FormularCreatePage } from "@/features/AK/FormularCreatePage";

export const Route = createFileRoute("/formulare/$id")({
  component: EditFormularRoute,
});

function EditFormularRoute() {
  const { id } = Route.useParams();
  return <FormularCreatePage editId={id} />;
}
