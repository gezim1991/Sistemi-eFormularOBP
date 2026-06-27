import { createFileRoute } from "@tanstack/react-router";
import { AdminSystemPage } from "@/features/ADMIN/AdminSystemPage";

export const Route = createFileRoute("/admin/system")({
  head: () => ({
    meta: [
      { title: "e-Formular OBP · Sistemi & Storage" },
      { name: "description", content: "Mbushja e storage, performanca dhe të dhënat teknike." },
    ],
  }),
  component: AdminSystemPage,
});
