import { createFileRoute } from "@tanstack/react-router";
import { AdminUsersPage } from "@/features/ADMIN/AdminUsersPage";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "e-Formular OBP · Përdoruesit" },
      { name: "description", content: "Menaxho operatorët OBP dhe përdoruesit AK." },
    ],
  }),
  component: AdminUsersPage,
});
