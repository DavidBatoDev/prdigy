import { createFileRoute } from "@tanstack/react-router";
import { RoadmapBuilder } from "@/components/roadmap/RoadmapBuilder";

export const Route = createFileRoute("/project/$projectId/roadmap/create")({
  component: ProjectRoadmapCreatePage,
});

function ProjectRoadmapCreatePage() {
  const { projectId } = Route.useParams();

  return <RoadmapBuilder projectId={projectId} embedded />;
}
