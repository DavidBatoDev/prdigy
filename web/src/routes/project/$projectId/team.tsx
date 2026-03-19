import { createFileRoute } from "@tanstack/react-router";
import { TeamPage } from "@/components/project/team";

export const Route = createFileRoute("/project/$projectId/team")({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId } = Route.useParams();
  return <TeamPage projectId={projectId} />;
}
