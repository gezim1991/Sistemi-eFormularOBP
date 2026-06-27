import { createFileRoute } from "@tanstack/react-router";
import { AdminInstitutionsPage } from "@/features/ADMIN/AdminInstitutionsPage";

export const Route = createFileRoute("/admin/institutions")({
  head: () => ({
    meta: [
      { title: "e-Formular OBP · Institucionet" },
      { name: "description", content: "Menaxho Autoritetet Kontraktore në sistem." },
    ],
  }),
  component: AdminInstitutionsPage,
});
