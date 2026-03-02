import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Circle,
  Loader2,
  Shield,
  StickyNote,
  User,
} from "lucide-react";
import {
  projectService,
  type Project,
  type ProjectMember,
} from "@/services/project.service";
import { roadmapService } from "@/services/roadmap.service";
import { supabase } from "@/lib/supabase";
import type { RoadmapMilestone } from "@/types/roadmap";

export const Route = createFileRoute("/project/$projectId/overview")({
  component: OverviewPage,
});

type ProjectBrief = {
  mission_vision?: string | null;
  scope_statement?: string | null;
  requirements?: unknown;
  constraints?: string | null;
  risk_register?: unknown;
};

const milestoneState = (status: RoadmapMilestone["status"]) => {
  switch (status) {
    case "completed":
      return {
        dot: "bg-blue-500 border-blue-500 text-white",
        icon: CheckCircle2,
        title: "text-blue-700",
      };
    case "in_progress":
      return {
        dot: "bg-blue-100 border-blue-400 text-blue-600",
        icon: Circle,
        title: "text-blue-700",
      };
    case "at_risk":
      return {
        dot: "bg-amber-100 border-amber-400 text-amber-600",
        icon: AlertTriangle,
        title: "text-amber-700",
      };
    case "missed":
      return {
        dot: "bg-red-100 border-red-400 text-red-600",
        icon: AlertTriangle,
        title: "text-red-700",
      };
    case "not_started":
    default:
      return {
        dot: "bg-gray-100 border-gray-300 text-gray-400",
        icon: Circle,
        title: "text-gray-700",
      };
  }
};

const nameFromMember = (member: ProjectMember) => {
  return (
    member.user?.display_name ||
    [member.user?.first_name, member.user?.last_name]
      .filter(Boolean)
      .join(" ") ||
    member.user?.email ||
    member.role
  );
};

const toItems = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const candidate =
          (item as Record<string, unknown>).title ??
          (item as Record<string, unknown>).name ??
          (item as Record<string, unknown>).text;
        if (typeof candidate === "string") return candidate;
      }
      return null;
    })
    .filter((value): value is string => Boolean(value));
};

function OverviewPage() {
  const { projectId } = Route.useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [projectBrief, setProjectBrief] = useState<ProjectBrief | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [milestones, setMilestones] = useState<RoadmapMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const projectData = await projectService.get(projectId);
        const projectMembers = await projectService
          .getMembers(projectId)
          .catch(() => []);

        const [{ data: briefData }, roadmap] = await Promise.all([
          supabase
            .from("project_briefs")
            .select(
              "mission_vision, scope_statement, requirements, constraints, risk_register",
            )
            .eq("project_id", projectId)
            .maybeSingle(),
          roadmapService.getByProjectId(projectId),
        ]);

        let roadmapMilestones: RoadmapMilestone[] = [];
        if (roadmap) {
          const full = await roadmapService.getFull(roadmap.id);
          roadmapMilestones = (full.milestones ?? []).sort(
            (a, b) => a.position - b.position,
          );
        }

        if (cancelled) return;
        setProject(projectData);
        setMembers(projectMembers);
        setProjectBrief((briefData as ProjectBrief | null) ?? null);
        setMilestones(roadmapMilestones);
      } catch {
        if (!cancelled) setError("Failed to load overview data.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const requirements = useMemo(
    () => toItems(projectBrief?.requirements),
    [projectBrief?.requirements],
  );
  const risks = useMemo(
    () => toItems(projectBrief?.risk_register),
    [projectBrief?.risk_register],
  );
  const populatedClient = (
    project as
      | (Project & {
          client?: { display_name?: string };
          consultant?: { display_name?: string };
        })
      | null
  )?.client;
  const populatedConsultant = (
    project as
      | (Project & {
          client?: { display_name?: string };
          consultant?: { display_name?: string };
        })
      | null
  )?.consultant;

  if (isLoading) {
    return (
      <div className="h-full min-h-[420px] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-[#ff9933]" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? "Project not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-8 w-full">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-10">
        <div className="space-y-8">
          <header className="pb-1">
            <h1 className="text-[28px] font-semibold text-gray-900 uppercase tracking-wide leading-tight">
              {project.title}
            </h1>
            <p className="mt-2 text-[13px] text-gray-500 font-medium">
              Client: {populatedClient?.display_name ?? "—"}
              <span className="mx-2">|</span>
              Consultant: {populatedConsultant?.display_name ?? "—"}
            </p>
          </header>

          <section className="pb-7 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-2.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-500" />
              <h2 className="text-[18px] font-semibold text-gray-900">
                Project Summary
              </h2>
            </div>
            <p className="text-[13px] text-gray-600 leading-6 whitespace-pre-wrap">
              {projectBrief?.mission_vision ||
                project.description ||
                "No summary added yet."}
            </p>
          </section>

          <section className="pb-7 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-2.5">
              <Shield className="w-4 h-4 text-indigo-500" />
              <h2 className="text-[18px] font-semibold text-gray-900">
                Scope & Constraints
              </h2>
            </div>
            <div className="text-[13px] text-gray-600 leading-6 space-y-3">
              <p className="whitespace-pre-wrap leading-6">
                {projectBrief?.scope_statement ||
                  "No scope statement added yet."}
              </p>
              <div className="bg-gray-100/70 px-3 py-2.5 text-[12px] leading-5 text-gray-700">
                <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1.5 font-semibold">
                  Constraints
                </p>
                <p className="whitespace-pre-wrap leading-5">
                  {projectBrief?.constraints || "No constraints added yet."}
                </p>
              </div>
            </div>
          </section>

          <section className="pb-7 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-2.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-500" />
              <h2 className="text-[18px] font-semibold text-gray-900">
                Core Requirements
              </h2>
            </div>
            {requirements.length > 0 ? (
              <ul className="space-y-1.5 text-[13px] text-gray-700">
                {requirements.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-gray-500">
                No requirements listed yet.
              </p>
            )}
          </section>

          <section className="pb-7 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-2.5">
              <StickyNote className="w-4 h-4 text-indigo-500" />
              <h2 className="text-[18px] font-semibold text-gray-900">
                Project Notes
              </h2>
            </div>
            <p className="text-[13px] text-gray-500 leading-6">
              Notes support can be added from `project_briefs.visibility_mask`
              and task/feature comments in a follow-up.
            </p>
          </section>

          <section className="pb-2">
            <div className="flex items-center gap-2 mb-2.5">
              <AlertTriangle className="w-4 h-4 text-indigo-500" />
              <h2 className="text-[18px] font-semibold text-gray-900">
                Risk Register
              </h2>
            </div>
            {risks.length > 0 ? (
              <ul className="space-y-1.5 text-[13px] text-gray-700">
                {risks.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-gray-500">No risks logged yet.</p>
            )}
          </section>
        </div>

        <aside className="border-l border-gray-300 pl-8 space-y-8">
          <div>
            <h2 className="text-[16px] font-semibold text-gray-900 mb-4">
              Milestones
            </h2>
            {milestones.length === 0 ? (
              <p className="text-[13px] text-gray-500">No milestones yet.</p>
            ) : (
              <div className="space-y-0">
                {milestones.map((milestone, index) => {
                  const style = milestoneState(milestone.status);
                  const DotIcon = style.icon;
                  return (
                    <div
                      key={milestone.id}
                      className="relative pl-9 pb-5 last:pb-0"
                    >
                      {index < milestones.length - 1 && (
                        <span className="absolute left-[15px] top-7 bottom-0 w-px bg-gray-200" />
                      )}
                      <span
                        className={`absolute left-0 top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${style.dot}`}
                      >
                        <DotIcon className="w-4 h-4" />
                      </span>
                      <p
                        className={`text-[14px] font-semibold leading-5 ${style.title}`}
                      >
                        {milestone.title}
                      </p>
                      <p className="text-[12px] text-gray-500 mt-1 inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(milestone.target_date).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-[16px] font-semibold text-gray-900 mb-3">
              Project Team
            </h2>
            {members.length === 0 ? (
              <p className="text-[13px] text-gray-500">No members yet.</p>
            ) : (
              <div className="flex items-center gap-2">
                {members.slice(0, 6).map((member, index) => (
                  <div
                    key={member.id}
                    className={index > 0 ? "-ml-2" : ""}
                    title={`${nameFromMember(member)} (${member.role})`}
                  >
                    {member.user?.avatar_url ? (
                      <img
                        src={member.user.avatar_url}
                        alt={nameFromMember(member)}
                        className="w-9 h-9 rounded-full border-2 border-white object-cover"
                      />
                    ) : (
                      <span className="w-9 h-9 rounded-full border-2 border-white bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                ))}
                {members.length > 6 && (
                  <span className="-ml-2 w-9 h-9 rounded-full border-2 border-white bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">
                    +{members.length - 6}
                  </span>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
