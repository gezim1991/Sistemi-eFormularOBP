import { createFileRoute } from "@tanstack/react-router";
import { AdminCpvCodesPage } from "@/features/ADMIN/AdminCpvCodesPage";

export const Route = createFileRoute("/admin/cpv-codes")({
  head: () => ({
    meta: [
      { title: "e-Formular OBP · Kodet CPV" },
      { name: "description", content: "Menaxho kodet CPV të përdorura në formularë." },
    ],
  }),
  component: AdminCpvCodesPage,
});
