import {
  createFileRoute,
  Outlet,
  useNavigate,
  useChildMatches,
  Link,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ListChecks, ExternalLink } from "lucide-react";
import { RoadmapPageSkeleton } from "@/components/roadmap/views/RoadmapPageSkeleton";
import { LinkRoadmapModal } from "@/components/roadmap/modals/LinkRoadmapModal";
import {
  useInvalidateProjectQueries,
  useLinkedRoadmapQuery,
} from "@/hooks/useProjectQueries";

export const Route = createFileRoute("/project/$projectId/work-items")({
  component: WorkItemsLayout,
});

function WorkItemsLayout() {
  const childMatches = useChildMatches();
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const linkedRoadmapQuery = useLinkedRoadmapQuery(projectId);
  const { invalidateLinkedRoadmap } = useInvalidateProjectQueries(projectId);

  useEffect(() => {
    if (childMatches.length > 0) return;
    const linkedRoadmapId = linkedRoadmapQuery.data?.id;
    if (!linkedRoadmapId) return;
    void navigate({
      to: "/project/$projectId/work-items/$roadmapId",
      params: { projectId, roadmapId: linkedRoadmapId },
      replace: true,
    });
  }, [childMatches.length, linkedRoadmapQuery.data?.id, navigate, projectId]);

  if (childMatches.length > 0) {
    return <Outlet />;
  }

  if (linkedRoadmapQuery.isPending) {
    return <RoadmapPageSkeleton />;
  }

  return (
    <div className="p-8 max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <ListChecks className="w-5 h-5 text-[#ff9933]" />
          <h1 className="text-2xl font-bold text-gray-900">Work Items</h1>
        </div>
        <p className="text-gray-500 text-sm">
          View and manage this project's epics, features, and tasks.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff9933]/10 flex items-center justify-center">
          <ListChecks className="w-8 h-8 text-[#ff9933]" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          No roadmap linked
        </h2>
        <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
          This project doesn't have a roadmap yet. Link or create a roadmap to
          start tracking epics, features, and tasks.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/project/$projectId/roadmap/create"
            params={{ projectId }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ff9933] text-white rounded-lg text-sm font-semibold hover:bg-[#e68829] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Create a Roadmap
          </Link>
          <button
            onClick={() => setIsLinkModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Link Existing Roadmap
          </button>
        </div>
      </div>

      <LinkRoadmapModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        projectId={projectId}
        onLinked={() => {
          setIsLinkModalOpen(false);
          void invalidateLinkedRoadmap();
        }}
      />
    </div>
  );
}

