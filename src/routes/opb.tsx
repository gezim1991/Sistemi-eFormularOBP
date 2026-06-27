import { createFileRoute } from "@tanstack/react-router";
import { ObpPanelPage } from "@/features/OBP/ObpPanelPage";

export const Route = createFileRoute("/opb")({
  head: () => ({
    meta: [
      { title: "e-Formular OBP · Paneli OPB" },
      {
        name: "description",
        content:
          "Paneli i Zyrës së Pranimit të Formularëve – pranimi, verifikimi dhe refuzimi i aplikimeve.",
      },
    ],
  }),
  component: ObpPanelPage,
});
