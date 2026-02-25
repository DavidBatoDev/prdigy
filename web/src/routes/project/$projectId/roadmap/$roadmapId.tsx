import { createFileRoute } from "@tanstack/react-router";
import { RoadmapViewContent } from "@/components/roadmap";

export const Route = createFileRoute("/project/$projectId/roadmap/$roadmapId")({
  component: RoadmapViewPage,
});

function RoadmapViewPage() {
  const { roadmapId } = Route.useParams();
  return <RoadmapViewContent roadmapId={roadmapId} />;
}
