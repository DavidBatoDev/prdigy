import { CheckCircle2, Loader, Inbox, Briefcase } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { getRoadmapsPreview } from "@/api";
import { useAuthStore } from "@/stores/authStore";
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

const ROADMAP_TAG_CLASS: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Completed: "bg-sky-100 text-sky-700",
  Draft: "bg-amber-100 text-amber-700",
};

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
        <div className="bg-[#f6f7f8] rounded-full p-3 mb-3">
          <Inbox className="w-6 h-6 text-[#92969f]" />
        </div>
        <p className="text-sm font-medium text-[#61636c] mb-1">No epics yet</p>
        <p className="text-xs text-[#92969f] text-center">
          This roadmap is empty
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 py-2">
        {displayedEpics.map((epic, index) => {
          const featureCount = epic.features?.length || 0;
          const isLast = index === displayedEpics.length - 1;
          return (
            <div
              key={epic.id}
              className="flex items-start gap-3 px-3 hover:bg-[#f6f7f8] transition-colors"
            >
              <div className="flex flex-col items-center shrink-0 pt-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: "var(--secondary)" }}
                />
                {!isLast && <div className="w-0.5 h-5 bg-[#e3e5e8] mt-1" />}
              </div>
              <div className="flex items-start justify-between flex-1 min-w-0 pb-1">
                <span className="text-[14px] font-medium text-[#333438] truncate pt-0.5">
                  {epic.title}
                </span>
                <span className="text-xs text-[#61636c] bg-[#f6f7f8] px-2 py-0.5 rounded-full whitespace-nowrap ml-2">
                  {featureCount} {featureCount === 1 ? "feature" : "features"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {remainingCount > 0 && (
        <div className="py-2 px-3 text-center border-t border-[#e3e5e8]">
          <span className="text-xs text-[#92969f]">
            +{remainingCount} more {remainingCount === 1 ? "epic" : "epics"}
          </span>
        </div>
      )}
    </div>
  );
};

export function RoadmapsGrid() {
  const { profile } = useAuthStore();
  const persona = profile?.active_persona || "client";
  const freelancerRoleLabel = profile?.headline?.trim() || "Freelancer Contributor";
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUnavailable, setIsUnavailable] = useState(false);

  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        setLoading(true);
        setIsUnavailable(false);

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
        setIsUnavailable(true);
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmaps();
  }, []);

  return (
    <div id="my-roadmaps-section">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-[18px] h-[18px] rounded-full" style={{ backgroundColor: "var(--secondary)" }} />
            <h2 className="text-[20px] font-semibold text-[#333438]">
              {persona === "freelancer" ? "ACTIVE WORKSPACES" : "MY ROADMAPS"}
            </h2>
          </div>
          {persona !== "freelancer" ? (
            <button className="text-[20px] font-semibold text-[#333438] hover:text-[var(--secondary)]">
              {"View All \u2192"}
            </button>
          ) : null}
        </div>
        <p className="text-xs text-[#61636c] mt-1">
          {persona === "freelancer"
            ? "Workspaces assigned to you for active delivery and milestone execution."
            : "Each matched project unlocks a consultant-led roadmap for structured execution"}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : isUnavailable ? (
        <div className="text-center py-12">
          <p className="text-[#333438] font-semibold mb-2">
            Your roadmap workspace is preparing
          </p>
          <p className="text-[#61636c] text-sm">
            {persona === "freelancer"
              ? "This is where your milestone roadmap will appear once you're matched."
              : "After consultant matching starts, your roadmap appears here with milestones and execution phases."}
          </p>
          {persona === "freelancer" ? (
            <p className="text-xs text-[#92969f] mt-2">Your roadmap is being prepared based on your project assignment.</p>
          ) : null}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#333438] font-semibold mb-2">
            Your first roadmap is taking shape
          </p>
          <p className="text-[#61636c] text-sm">
            {persona === "freelancer"
              ? "This is where your milestone roadmap will appear once you're matched."
              : "Post your project vision to trigger consultant matching and automatically generate your roadmap."}
          </p>
          {persona === "freelancer" ? (
            <p className="text-xs text-[#92969f] mt-2">Your roadmap is being prepared based on your project assignment.</p>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {templates.map((template) => (
            <Link
              key={template.id}
              to="/project/$projectId/roadmap/$roadmapId"
              params={{
                projectId: template.preview.project_id || "n",
                roadmapId: template.id,
              }}
              className="group flex h-[420px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-[var(--secondary)] hover:shadow-xl"
            >
              <div className="h-[200px] overflow-hidden bg-slate-50 p-4">
                {template.preview.preview_url ? (
                  <img
                    src={template.preview.preview_url}
                    alt={template.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <EpicOverview preview={template.preview} />
                )}
              </div>
              <div className="flex-1 flex flex-col p-5">
                <div className="flex justify-between items-start gap-3">
                  <h3 className="text-[16px] font-bold text-[#333438] leading-tight">
                    {template.title}
                  </h3>
                  <span className={`shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full ${ROADMAP_TAG_CLASS[template.tag] ?? "bg-slate-100 text-slate-700"}`}>
                    {template.tag}
                  </span>
                </div>
                <p className="mt-2 text-[14px] text-[#61636c] line-clamp-2">
                  {template.category}
                </p>
                {persona === "freelancer" ? (
                  <p className="mt-2 text-sm text-[#61636c]">Role: {freelancerRoleLabel}</p>
                ) : null}
                {template.preview.project_id && (
                  <div className="mt-3 mb-2 flex items-center gap-1.5 text-xs text-[#61636c] bg-[#f6f7f8] px-2 py-1 rounded-md w-fit">
                    <Briefcase className="w-3 h-3" />
                    <span>Linked to Project</span>
                  </div>
                )}
                <div className="mt-auto border-t border-slate-100 pt-4 mt-4 flex justify-end">
                  <span className="inline-flex items-center gap-1 text-[14px] font-semibold text-[#333438] uppercase transition-colors group-hover:text-[var(--secondary)] whitespace-nowrap">
                    <CheckCircle2 className="w-3 h-3" />
                    {persona === "client"
                      ? "TRACK PROGRESS \u2192"
                      : persona === "freelancer"
                        ? "ENTER WORKSPACE \u2192"
                        : "VIEW PLAN \u2192"}
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


