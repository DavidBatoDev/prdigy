import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/project/$projectId/settings/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/project/$projectId/settings/general",
      params: { projectId: params.projectId },
      replace: true,
    });
  },
  component: () => null,
});
