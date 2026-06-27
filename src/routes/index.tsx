import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/AK/DashboardPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "e-Formular OBP · Dashboard" },
      {
        name: "description",
        content: "Pasqyrë e formularëve, PDF-ve dhe dokumenteve të firmosura.",
      },
    ],
  }),
  component: DashboardPage,
});
