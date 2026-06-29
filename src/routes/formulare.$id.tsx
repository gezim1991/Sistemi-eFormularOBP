import { createFileRoute } from "@tanstack/react-router";
import { FormularCreatePage } from "@/features/AK/FormularCreatePage";
import { PuneFormularCreatePage } from "@/features/AK/PuneFormularCreatePage";
import { useForms } from "@/lib/forms-store";

export const Route = createFileRoute("/formulare/$id")({
  component: EditFormularRoute,
});

function EditFormularRoute() {
  const { id } = Route.useParams();
  const { getById } = useForms();
  const form = getById(id);
  const isPune = form?.document && "formType" in form.document && form.document.formType === "pune";

  if (isPune) {
    return <PuneFormularCreatePage editId={id} />;
  }
  return <FormularCreatePage editId={id} />;
}
