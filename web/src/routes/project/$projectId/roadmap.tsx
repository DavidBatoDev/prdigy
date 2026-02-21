import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Map, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { projectService, type Project } from "@/services/project.service";
import { roadmapService } from "@/services/roadmap.service";

export const Route = createFileRoute("/project/$projectId/roadmap")({
  component: RoadmapPage,
});

function RoadmapPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [linkedRoadmapId, setLinkedRoadmapId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [data, roadmaps] = await Promise.all([
          projectService.get(projectId),
          roadmapService.getAll(),
        ]);

        setProject(data);

        const projectRoadmapId = (
          data as Project & { roadmap_id?: string | null }
        ).roadmap_id;

        const linkedByProject = roadmaps.find(
          (roadmap) => roadmap.project_id === projectId,
        );

        setLinkedRoadmapId(projectRoadmapId ?? linkedByProject?.id ?? null);
      } catch {
        // silently handled
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [projectId]);

  useEffect(() => {
    if (!linkedRoadmapId) return;

    navigate({
      to: "/project/roadmap/$roadmapId",
      params: { roadmapId: linkedRoadmapId },
      replace: true,
    });
  }, [linkedRoadmapId, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff9933]" />
      </div>
    );
  }

  if (linkedRoadmapId) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff9933]" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto w-full">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Map className="w-5 h-5 text-[#ff9933]" />
          <h1 className="text-2xl font-bold text-gray-900">Roadmap</h1>
        </div>
        <p className="text-gray-500 text-sm">
          View and manage this project's roadmap, milestones, and epics.
        </p>
      </div>

      {/* No roadmap state */}
      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff9933]/10 flex items-center justify-center">
          <Map className="w-8 h-8 text-[#ff9933]" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          No roadmap linked
        </h2>
        <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
          This project doesn't have a roadmap yet. Create a new roadmap to start
          planning milestones, epics, and features.
        </p>
        <div className="flex items-center justify-center gap-3">
          <a
            href="/project/roadmap"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ff9933] text-white rounded-lg text-sm font-semibold hover:bg-[#e68829] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Create a Roadmap
          </a>
        </div>
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <AlertCircle className="w-3.5 h-3.5" />
          Linking an existing roadmap to a project is coming soon.
        </div>
      </div>
    </div>
  );
}
