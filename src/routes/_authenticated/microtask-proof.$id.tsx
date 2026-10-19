import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/microtask-proof/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/microtask/$id", params: { id: params.id } });
  },
});
