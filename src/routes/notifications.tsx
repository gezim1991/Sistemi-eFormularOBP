import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/features/Notifications/NotificationsPage";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [{ title: "e-Formular OBP · Njoftimet" }],
  }),
  component: NotificationsPage,
});
