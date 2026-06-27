import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/forms/new")({
  beforeLoad: () => {
    throw redirect({ to: "/formulare/new" });
  },
});
