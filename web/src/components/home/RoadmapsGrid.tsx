import { CheckCircle2, Loader, Inbox, Briefcase } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { getRoadmapsPreview } from "@/api";
import type { RoadmapPreview } from "@/api/endpoints/roadmap";

interface Template {
  id: string;
  title: string;
  category: string;
  milestones: string;
  budget: string;
  tag: string;
  preview: RoadmapPreview;
}

const EpicOverview = ({ preview }: { preview: RoadmapPreview }) => {
  const MAX_EPICS = 5;

  const allEpics = [...(preview.epics || [])].sort(
    (a, b) => a.position - b.position,
  );

  const displayedEpics = allEpics.slice(0, MAX_EPICS);
  const remainingCount = allEpics.length - MAX_EPICS;

  if (allEpics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 px-4">
        <div className="bg-gray-100 rounded-full p-3 mb-3">
          <Inbox className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-600 mb-1">No epics yet</p>
        <p className="text-xs text-gray-500 text-center">
          This roadmap is empty
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg h-full flex flex-col">
      <div className="flex-1 py-2">
        {displayedEpics.map((epic, index) => {
          const featureCount = epic.features?.length || 0;
          const isLast = index === displayedEpics.length - 1;
          return (
            <div
              key={epic.id}
              className="flex items-start gap-3 px-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex flex-col items-center shrink-0 pt-1">
                <div className="w-2 h-2 rounded-full bg-primary" />
                {!isLast && <div className="w-0.5 h-5 bg-gray-200 mt-1" />}
              </div>
              <div className="flex items-start justify-between flex-1 min-w-0 pb-1">
                <span className="text-sm font-medium text-gray-900 truncate pt-0.5">
                  {epic.title}
                </span>
                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap ml-2">
                  {featureCount} {featureCount === 1 ? "feature" : "features"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {remainingCount > 0 && (
        <div className="py-2 px-3 text-center border-t border-gray-100">
          <span className="text-xs text-gray-500">
            +{remainingCount} more {remainingCount === 1 ? "epic" : "epics"}
          </span>
        </div>
      )}
    </div>
  );
};

export function RoadmapsGrid() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        setLoading(true);
        setError(null);

        const roadmaps = await getRoadmapsPreview();

        const transformedTemplates: Template[] = roadmaps.map(
          (roadmap: RoadmapPreview, index: number) => ({
            id: roadmap.id,
            title: roadmap.name,
            category: roadmap.description || "Project Roadmap",
            milestones: "View plan",
            budget: "Custom",
            tag:
              index === 0
                ? "Active"
                : roadmap.status === "completed"
                  ? "Completed"
                  : "Draft",
            preview: roadmap,
          }),
        );

        setTemplates(transformedTemplates);
      } catch (err) {
        console.error("Error fetching roadmaps:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load roadmaps",
        );
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmaps();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Roadmaps</h2>
        <p className="text-sm text-gray-600 mt-1">
          View and manage your project roadmaps
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-600">
            Unable to load roadmaps. Please try again later.
          </p>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-base">
            No roadmaps yet. Create your first roadmap to get started!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Link
              key={template.id}
              to="/project/roadmap/$roadmapId"
              params={{ roadmapId: template.id }}
              className="group relative bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary hover:shadow-xl transition-all block"
            >
              <div className="aspect-4/3 overflow-hidden bg-linear-to-br from-blue-50 to-indigo-50 p-4">
                <EpicOverview preview={template.preview} />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {template.title}
                  </h3>
                  <span className="px-2 py-0.5 bg-primary text-white text-xs font-semibold rounded-full">
                    {template.tag}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {template.category}
                </p>
                {template.preview.project_id && (
                  <div className="mb-2 flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md w-fit">
                    <Briefcase className="w-3 h-3" />
                    <span>Linked to Project</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {template.milestones}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
