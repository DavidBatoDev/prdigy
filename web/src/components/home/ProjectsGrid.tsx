import { Calendar, Clock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { projectService, type Project } from "@/services/project.service";
import { supabase } from "@/lib/supabase";
import { useAuthStore, useUser } from "@/stores/authStore";
import { getFreelancerStage } from "@/lib/freelancer-stage";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const PROJECT_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; badgeClass: string }
> = {
  bidding: {
    label: "Bidding",
    color: "#7c3aed",
    badgeClass: "bg-violet-100 text-violet-700 border-violet-200",
  },
  draft: {
    label: "Draft",
    color: "#f59e0b",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
  },
  active: {
    label: "Active",
    color: "#22c55e",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  completed: {
    label: "Completed",
    color: "#03a9f4",
    badgeClass: "bg-sky-100 text-sky-700 border-sky-200",
  },
  paused: {
    label: "Paused",
    color: "#64748b",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
  archived: {
    label: "Archived",
    color: "#6b7280",
    badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

export function ProjectsGrid() {
  const user = useUser();
  const { profile } = useAuthStore();
  const persona = profile?.active_persona || "client";
  const queryClient = useQueryClient();
  const projectsQueryKey = ["dashboard", "projects", user?.id ?? "anonymous"];
  const projectsQuery = useQuery({
    queryKey: projectsQueryKey,
    queryFn: () => projectService.listDashboardProjects(),
    enabled: persona !== "freelancer" && Boolean(user?.id),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
  });
  const projects = (projectsQuery.data as Project[] | undefined) ?? [];
  const isLoading = persona !== "freelancer" && projectsQuery.isPending;

  const matchItems = [
    {
      id: "match-1",
      project: "Creator Marketplace Revamp",
      state: "reviewing",
      insight: "Your product UX and SaaS workflow background matches current project needs.",
    },
    {
      id: "match-2",
      project: "B2B Analytics Dashboard",
      state: "shortlisted",
      insight: "Your interaction design focus aligns with the roadmap's execution scope.",
    },
    {
      id: "match-3",
      project: "Mobile Onboarding Optimization",
      state: "assigned",
      insight: "Your growth UX profile and onboarding optimization experience are a strong fit.",
    },
  ] as const;

  const hasAssignedMatch = matchItems.some((item) => item.state === "assigned");
  const stage = getFreelancerStage(profile, { hasConfirmedMatch: hasAssignedMatch });
  const skillsCount = profile?.skills?.length ?? 0;
  const profileStrength = Math.min(
    100,
    35 +
      (profile?.has_completed_onboarding ? 20 : 0) +
      (profile?.headline ? 20 : 0) +
      (skillsCount >= 3 ? 20 : skillsCount > 0 ? 10 : 0) +
      (profile?.city || profile?.country ? 10 : 0),
  );

  useEffect(() => {
    if (persona === "freelancer") return;
    if (!user?.id) return;

    const channel = supabase
      .channel("dashboard-projects-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
          filter: `client_id=eq.${user.id}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: projectsQueryKey });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
          filter: `consultant_id=eq.${user.id}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: projectsQueryKey });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [persona, queryClient, user?.id]);

  return (
    <div id="my-project-visions" data-tutorial="projects-grid" className="scroll-mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-[18px] h-[18px] rounded-full" style={{ backgroundColor: "var(--secondary)" }} />
          <h2 className="text-[20px] font-semibold text-[#333438]">
            {persona === "freelancer" ? "MATCHES" : "MY PROJECT VISIONS"}
          </h2>
        </div>
        {persona === "freelancer" ? (
          <span className="text-xs text-[#61636c]">
            {stage === "assigned" ? "Assignment pipeline active" : "Matching engine active"}
          </span>
        ) : (
          <button className="text-[20px] font-semibold text-[#333438] hover:text-[var(--secondary)]">
            View All →
          </button>
        )}
      </div>

      {persona === "freelancer" ? (
        <div className="space-y-3">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-[#333438]">Profile strength</p>
              <p className="text-sm font-semibold text-[#333438]">{profileStrength}% match score</p>
            </div>
            <div className="w-full h-2 bg-[#e3e5e8] rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${profileStrength}%`, backgroundColor: "var(--secondary)" }}
              />
            </div>
            <p className="text-xs text-[#61636c]">
              Increase your score by adding clearer role focus, stronger skills, and current availability.
            </p>
          </div>

          {matchItems.map((item) => {
            const stateMeta =
              item.state === "assigned"
                ? { label: "Assigned", className: "bg-emerald-100 text-emerald-700" }
                : item.state === "shortlisted"
                  ? { label: "Shortlisted", className: "bg-amber-100 text-amber-700" }
                  : { label: "Reviewing", className: "bg-blue-100 text-blue-700" };

            return (
              <div key={item.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-sm font-semibold text-[#333438]">{item.project}</p>
                    <p className="text-xs text-[#61636c] mt-1">{item.insight}</p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-1 rounded ${stateMeta.className}`}>
                    {stateMeta.label}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-[#61636c]">
                    {item.state === "assigned"
                      ? "Assignment confirmed. Open your work queue to begin."
                      : "Matching in progress. Consultant decisions update continuously."}
                  </p>
                  <button
                    type="button"
                    className="text-[11px] font-semibold"
                    style={{ color: "var(--secondary)" }}
                    onClick={() => console.info("Match opened:", item.id)}
                  >
                    View match →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (

      <div className="grid grid-cols-3 gap-6">
        {isLoading ? (
          <>
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
          </>
        ) : projects.length === 0 ? (
          <div className="col-span-3 flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="w-16 h-16 bg-[#ff9933]/10 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-[#ff9933]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No project visions yet
            </h3>
            <p className="text-[#61636c] max-w-sm">
              Post your first project vision to begin consultant matching and move into roadmap execution.
            </p>
          </div>
        ) : (
          projects.slice(0, 2).map((project, index) => {
            const statusConfig = PROJECT_STATUS_CONFIG[
              (project.status || "").toLowerCase()
            ] ?? {
              label: project.status || "Unknown",
              color: "#9c27b0",
              badgeClass: "bg-purple-100 text-purple-700 border-purple-200",
            };

            return (
              <ProjectCard
                key={project.id}
                number={index + 1}
                projectId={project.id}
                status={statusConfig.label}
                statusColor={statusConfig.color}
                statusBadgeClass={statusConfig.badgeClass}
                title={project.title}
                client={project.client_id ? "Assigned" : "Not assigned"}
                progress={project.status === "completed" ? 100 : null}
                progressColor={statusConfig.color}
                nextUp={project.brief ? "Review project brief" : "Add project brief"}
                dueDate={
                  project.custom_start_date || project.start_date || null
                }
              />
            );
          })
        )}
      </div>
      )}
    </div>
  );
}

function ProjectCard({
  number,
  projectId,
  status,
  statusColor,
  statusBadgeClass,
  title,
  client,
  progress,
  progressColor,
  nextUp,
  dueDate,
}: {
  number: number;
  projectId: string;
  status: string;
  statusColor: string;
  statusBadgeClass: string;
  title: string;
  client: string;
  progress: number | null;
  progressColor: string;
  nextUp: string;
  dueDate: string | null;
}) {
  const isDraft = status.toLowerCase() === "draft";

  return (
    <div
      className="group bg-linear-to-b from-white from-98% to-transparent rounded-xl shadow-sm p-4 h-[385px] flex flex-col border border-gray-200 transition-all hover:border-[var(--secondary)] hover:shadow-xl"
      style={{
        backgroundImage: `linear-gradient(to bottom, white 98%, ${statusColor}20)`,
      }}
    >
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[16px] font-semibold text-[#61636c]">
              #{number}
            </span>
            <div className="w-px h-[25px] bg-[#92969f]" />
            <div className="flex items-center gap-2">
              {!isDraft ? (
                <div
                  className="w-3 h-3 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: statusColor }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              ) : null}
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusBadgeClass}`}
              >
                {status}
              </span>
            </div>
          </div>

          <h3 className="text-[16px] font-bold text-[#333438] mb-1">{title}</h3>
          <p className="text-[14px]">
            <span className="font-semibold text-[#61636c]">Client:</span>
            <span className="text-[#61636c]"> {client}</span>
          </p>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-[12px] text-[#92969f] mb-2">
            <span>Progress</span>
            <span>{progress === null ? "Not tracked yet" : `${progress}%`}</span>
          </div>
          <div className="w-full h-2 bg-[#e3e5e8] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress ?? 0}%`,
                backgroundColor: progressColor,
              }}
            />
          </div>
        </div>

        {/* Next Up */}
        <div className="flex gap-2">
          <Clock className="w-[18px] h-[18px] text-[#92969f] shrink-0 mt-0.5" />
          <div className="space-y-2">
            <div>
              <p className="text-[14px] font-semibold text-[#61636c]">
                NEXT UP
              </p>
              <p className="text-[14px] text-[#333438]">• {nextUp}</p>
            </div>
            {dueDate && (
              <div className="bg-[#f6f7f8] border border-[#e3e5e8] rounded-[5px] px-2 py-0.5 inline-flex items-center gap-1">
                <Calendar className="w-[18px] h-[18px] text-[#61636c]" />
                <span className="text-[12px] text-[#61636c]">{dueDate}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-[#e3e5e8]">
        <div className="flex flex-col items-end gap-1">
          <Link
            to="/project/$projectId/overview"
            params={{ projectId }}
            className="text-[14px] font-semibold text-[#333438] uppercase transition-colors whitespace-nowrap group-hover:text-[var(--secondary)]"
          >
            VIEW PROJECT →
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProjectCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 h-[385px] flex flex-col border border-gray-100">
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2 w-full">
            <div className="w-8 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-px h-[25px] bg-[#92969f]/30" />
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-200 animate-pulse" />
              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="w-3/4 h-5 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
            <div className="w-8 h-3 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden" />
        </div>

        {/* Next Up */}
        <div className="flex gap-2">
          <div className="w-[18px] h-[18px] bg-gray-200 rounded-full animate-pulse shrink-0 mt-0.5" />
          <div className="space-y-2 w-full">
            <div>
              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse mb-1.5" />
              <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="w-24 h-6 bg-gray-200 rounded-[5px] animate-pulse" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-[#e3e5e8]/30">
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white animate-pulse" />
            <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white animate-pulse" />
          </div>
          <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

