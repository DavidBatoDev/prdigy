import { CheckCircle2, DollarSign, Loader } from "lucide-react";
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

const RoadmapMiniMap = ({ preview }: { preview: RoadmapPreview }) => {
  const EPIC_WIDTH = 68;
  const EPIC_HEIGHT = 40;
  const FEATURE_WIDTH = 70;
  const FEATURE_HEIGHT = 22;
  const TASK_WIDTH = 42;
  const TASK_HEIGHT = 8;
  const GAP_Y = 8;
  const GAP_X = 18;
  const TASK_GAP = 4;
  const MAX_EPICS = 3;
  const MAX_FEATURES = 3;
  const MAX_TASKS = 4;

  const epics = [...(preview.epics || [])]
    .sort((a, b) => a.position - b.position)
    .slice(0, MAX_EPICS);

  const groups = epics.map((epic) => {
    const features = [...(epic.features || [])]
      .sort((a, b) => a.position - b.position)
      .slice(0, MAX_FEATURES);
    const groupHeight = Math.max(
      EPIC_HEIGHT,
      features.length * FEATURE_HEIGHT + Math.max(0, features.length - 1) * GAP_Y,
    );
    return { epic, features, groupHeight };
  });

  const totalHeight =
    groups.reduce((sum, group) => sum + group.groupHeight, 0) +
    Math.max(0, groups.length - 1) * GAP_Y;

  const viewWidth = 260;
  const viewHeight = 150;
  const scale = totalHeight > 0 ? Math.min(1, viewHeight / totalHeight) : 1;

  let currentY = 0;

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      className="w-full h-full"
      aria-hidden="true"
    >
      <rect
        x="0"
        y="0"
        width={viewWidth}
        height={viewHeight}
        rx="10"
        fill="rgba(255,255,255,0.75)"
        stroke="rgba(148,163,184,0.4)"
      />
      <g transform={`scale(${scale})`}>
        {groups.map((group) => {
          const groupY = currentY;
          const featureStartY =
            groupY + group.groupHeight / 2 -
            (group.features.length * FEATURE_HEIGHT +
              Math.max(0, group.features.length - 1) * GAP_Y) /
              2;

          const epicY = groupY + group.groupHeight / 2 - EPIC_HEIGHT / 2;

          currentY += group.groupHeight + GAP_Y;

          return (
            <g key={group.epic.id}>
              <rect
                x={16}
                y={epicY}
                width={EPIC_WIDTH}
                height={EPIC_HEIGHT}
                rx={8}
                fill="#f8fafc"
                stroke="#cbd5f5"
              />

              {group.features.map((feature, index) => {
                const featureY = featureStartY + index * (FEATURE_HEIGHT + GAP_Y);
                const tasks = (feature.tasks || []).slice(0, MAX_TASKS);
                return (
                  <g key={feature.id}>
                    <path
                      d={`M ${16 + EPIC_WIDTH} ${epicY + EPIC_HEIGHT / 2} H ${16 + EPIC_WIDTH + GAP_X}`}
                      stroke="#cbd5f5"
                      strokeWidth="1"
                      fill="none"
                    />
                    <rect
                      x={16 + EPIC_WIDTH + GAP_X}
                      y={featureY}
                      width={FEATURE_WIDTH}
                      height={FEATURE_HEIGHT}
                      rx={6}
                      fill="#fff7ed"
                      stroke="#f5b86b"
                    />

                    {tasks.map((task, taskIndex) => {
                      const taskX =
                        16 + EPIC_WIDTH + GAP_X + FEATURE_WIDTH + 12;
                      const taskY = featureY + taskIndex * (TASK_HEIGHT + TASK_GAP);
                      let taskFill = "#9ca3af";
                      switch (task.status) {
                        case "done":
                          taskFill = "#10b981";
                          break;
                        case "in_progress":
                          taskFill = "#3b82f6";
                          break;
                        case "in_review":
                          taskFill = "#a855f7";
                          break;
                        case "blocked":
                          taskFill = "#ef4444";
                          break;
                        default:
                          taskFill = "#9ca3af";
                      }
                      return (
                        <rect
                          key={task.id}
                          x={taskX}
                          y={taskY}
                          width={TASK_WIDTH}
                          height={TASK_HEIGHT}
                          rx={4}
                          fill={taskFill}
                        />
                      );
                    })}
                  </g>
                );
              })}
            </g>
          );
        })}
      </g>
    </svg>
  );
};

export const TemplatesSection = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use centralized API from apiClient with automatic auth headers
        const roadmaps = await getRoadmapsPreview();

        // Transform roadmaps to template format
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
    <div className="mt-24">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Your Roadmaps</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          View all your AI-generated roadmaps with timelines, milestones, and
          budget estimates
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
          <p className="text-gray-600 text-lg">
            No roadmaps yet. Create your first roadmap to get started!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((template) => (
            <Link
              key={template.id}
              to="/project/roadmap/$roadmapId"
              params={{ roadmapId: template.id }}
              className="group relative bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary hover:shadow-xl transition-all block"
            >
              <div className="absolute top-3 left-3 z-10">
                <span className="px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full">
                  {template.tag}
                </span>
              </div>
              <div className="aspect-4/3 overflow-hidden bg-linear-to-br from-primary-light to-secondary-light p-4">
                <RoadmapMiniMap preview={template.preview} />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {template.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {template.category}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {template.milestones}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {template.budget}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
