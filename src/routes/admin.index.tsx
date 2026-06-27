import { createFileRoute } from "@tanstack/react-router";
import { AdminOverviewPage } from "@/features/ADMIN/AdminOverviewPage";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "e-Formular OBP · Paneli Admin" },
      { name: "description", content: "Paneli i superadministratorit për menaxhimin e sistemit." },
    ],
  }),
  component: AdminOverviewPage,
});
