import { createFileRoute } from "@tanstack/react-router";
import { FormularCreatePage } from "@/features/AK/FormularCreatePage";

export const Route = createFileRoute("/formulare/new")({
  head: () => ({
    meta: [
      { title: "e-Formular OBP · Krijo formular planifikimi" },
      { name: "description", content: "Formulari elektronik për planifikimin e prokurimit." },
    ],
  }),
  component: () => <FormularCreatePage />,
});
