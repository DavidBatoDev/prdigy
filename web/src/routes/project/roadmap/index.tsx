import { createFileRoute } from "@tanstack/react-router";
import { RoadmapBuilder } from "@/components/roadmap/RoadmapBuilder";

export const Route = createFileRoute("/project/roadmap/")({
  validateSearch: (search: Record<string, unknown>): { projectId?: string } => {
    return {
      projectId: search.projectId as string | undefined,
    };
  },
  component: RoadmapBuilderPage,
});

function RoadmapBuilderPage() {
  const { projectId } = Route.useSearch();
  return <RoadmapBuilder projectId={projectId} />;
}
