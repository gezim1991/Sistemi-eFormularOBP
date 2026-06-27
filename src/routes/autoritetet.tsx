import { createFileRoute } from "@tanstack/react-router";
import { AutoritetetPage } from "@/features/OBP/AutoritetetPage";

export const Route = createFileRoute("/autoritetet")({
  head: () => ({
    meta: [
      { title: "e-Formular OBP · Autoritetet" },
      {
        name: "description",
        content: "Lista e të gjitha Autoriteteve Kontraktore që dorëzojnë formularë në OBP.",
      },
    ],
  }),
  component: AutoritetetPage,
});
