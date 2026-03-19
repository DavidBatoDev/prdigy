import {
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FolderOpen,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getRoadmapFull, getRoadmaps } from "@/api";
import { projectService, type Project } from "@/services/project.service";
import { useAuthStore } from "@/stores/authStore";

type ActionItem = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
};

type TimelineItem = {
  id: string;
  title: string;
  roadmapName: string;
  targetDate: string;
};

type FreelancerMatch = {
  id: string;
  project: string;
  state: "reviewing" | "shortlisted" | "assigned";
  insight: string;
};

const REVIEW_STATUSES = new Set(["draft", "bidding", "paused"]);

const FREELANCER_MATCH_ITEMS: FreelancerMatch[] = [
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
];

function formatDateLabel(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function toProjectActionItem(project: Project): ActionItem | null {
  const status = (project.status || "").toLowerCase();

  if (status === "draft") {
    return {
      id: `draft-${project.id}`,
      title: `Finalize scope for "${project.title}"`,
      subtitle: "Confirm scope details so this project can move forward.",
      status: "Draft",
    };
  }

  if (status === "bidding") {
    return {
      id: `bidding-${project.id}`,
      title: `Review bids for "${project.title}"`,
      subtitle: "Compare applicants and approve the best next step.",
      status: "Bidding",
    };
  }

  if (status === "paused") {
    return {
      id: `paused-${project.id}`,
      title: `Unblock paused project "${project.title}"`,
      subtitle: "Resolve pending blockers to resume roadmap delivery.",
      status: "Paused",
    };
  }

  return null;
}

function toFreelancerTaskItem(match: FreelancerMatch): ActionItem {
  if (match.state === "assigned") {
    return {
      id: `task-${match.id}`,
      title: `Start delivery for "${match.project}"`,
      subtitle: "Assignment is confirmed. Open your queue and begin execution.",
      status: "Assigned",
    };
  }

  if (match.state === "shortlisted") {
    return {
      id: `task-${match.id}`,
      title: `Prepare for shortlist review in "${match.project}"`,
      subtitle: "Keep your profile ready while consultant decisions finalize.",
      status: "Shortlisted",
    };
  }

  return {
    id: `task-${match.id}`,
    title: `Stay visible for "${match.project}"`,
    subtitle: "Matching is in progress. Profile updates improve your chances.",
    status: "Reviewing",
  };
}

export function ConsultantDashboardWidgets({
  leadContent,
  children,
}: {
  leadContent?: ReactNode;
  children?: ReactNode;
}) {
  const { profile } = useAuthStore();
  const persona = profile?.active_persona || "client";
  const isFreelancer = persona === "freelancer";

  const [projects, setProjects] = useState<Project[]>([]);
  const [upcomingMilestones, setUpcomingMilestones] = useState<TimelineItem[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<TimelineItem[]>([]);
  const [hoursLogged, setHoursLogged] = useState(0);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [isMilestonesLoading, setIsMilestonesLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchProjects = async () => {
      try {
        const data = await projectService.listDashboardProjects();
        if (!isMounted) return;
        setProjects(data);
      } catch {
        if (!isMounted) return;
        setProjects([]);
      } finally {
        if (!isMounted) return;
        setIsProjectsLoading(false);
      }
    };

    fetchProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchTimeline = async () => {
      try {
        const roadmaps = await getRoadmaps();
        const roadmapDetails = await Promise.all(
          roadmaps.map(async (roadmap) => {
            try {
              return await getRoadmapFull(roadmap.id);
            } catch {
              return null;
            }
          }),
        );

        const validRoadmaps = roadmapDetails.filter(
          (roadmap): roadmap is NonNullable<typeof roadmap> => Boolean(roadmap),
        );

        const today = startOfToday().getTime();

        const milestones = validRoadmaps
          .flatMap((roadmap) =>
            (roadmap.milestones || []).map((milestone) => ({
              id: milestone.id,
              title: milestone.title,
              roadmapName: roadmap.name,
              targetDate: milestone.target_date,
            })),
          )
          .filter((item) => {
            if (!item.targetDate) return false;
            const parsed = new Date(item.targetDate).getTime();
            return Number.isFinite(parsed) && parsed >= today;
          })
          .sort(
            (a, b) =>
              new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime(),
          )
          .slice(0, 6);

        const deadlines = validRoadmaps
          .flatMap((roadmap: any) =>
            (roadmap.epics || []).flatMap((epic: any) =>
              (epic.features || []).flatMap((feature: any) =>
                (feature.tasks || []).map((task: any) => ({
                  id: task.id,
                  title: task.title || "Task",
                  roadmapName: roadmap.name,
                  targetDate: task.due_date,
                })),
              ),
            ),
          )
          .filter((item) => {
            if (!item.targetDate) return false;
            const parsed = new Date(item.targetDate).getTime();
            return Number.isFinite(parsed) && parsed >= today;
          })
          .sort(
            (a, b) =>
              new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime(),
          )
          .slice(0, 6);

        const totalHours = validRoadmaps.reduce((sum: number, roadmap: any) => {
          const epicsTotal = (roadmap.epics || []).reduce(
            (epicSum: number, epic: any) => epicSum + Number(epic.actual_hours || 0),
            0,
          );
          const featuresTotal = (roadmap.epics || []).reduce(
            (epicSum: number, epic: any) =>
              epicSum +
              (epic.features || []).reduce(
                (featureSum: number, feature: any) =>
                  featureSum + Number(feature.actual_hours || 0),
                0,
              ),
            0,
          );

          return sum + epicsTotal + featuresTotal;
        }, 0);

        if (!isMounted) return;
        setUpcomingMilestones(milestones);
        setUpcomingDeadlines(deadlines);
        setHoursLogged(totalHours);
      } catch {
        if (!isMounted) return;
        setUpcomingMilestones([]);
        setUpcomingDeadlines([]);
        setHoursLogged(0);
      } finally {
        if (!isMounted) return;
        setIsMilestonesLoading(false);
      }
    };

    fetchTimeline();

    return () => {
      isMounted = false;
    };
  }, []);

  const projectActiveCount = useMemo(
    () =>
      projects.filter((project) => (project.status || "").toLowerCase() === "active")
        .length,
    [projects],
  );

  const projectReviewCount = useMemo(
    () =>
      projects.filter((project) =>
        REVIEW_STATUSES.has((project.status || "").toLowerCase()),
      ).length,
    [projects],
  );

  const freelancerActionItems = useMemo(
    () => FREELANCER_MATCH_ITEMS.map(toFreelancerTaskItem),
    [],
  );

  const projectActionItems = useMemo(
    () =>
      projects
        .map(toProjectActionItem)
        .filter((item): item is ActionItem => item !== null)
        .slice(0, 5),
    [projects],
  );

  const actionItems = isFreelancer ? freelancerActionItems : projectActionItems;
  const primaryMetricValue = isFreelancer
    ? FREELANCER_MATCH_ITEMS.filter((item) => item.state === "assigned").length
    : projectActiveCount;
  const secondaryMetricValue = isFreelancer
    ? Math.round(hoursLogged)
    : projectReviewCount;

  const primaryMetricLabel = isFreelancer ? "ASSIGNED TASKS" : "ACTIVE PROJECTS";
  const secondaryMetricLabel = isFreelancer
    ? "HOURS LOGGED"
    : persona === "client"
      ? "PENDING APPROVALS"
      : "TASKS TO REVIEW";
  const attentionTitle = isFreelancer ? "Tasks" : "Needs Your Attention";
  const attentionSubtitle = isFreelancer
    ? "Execution-focused items that need your action now."
    : "Review approvals and unblock project work that needs your decision.";

  const greetingName =
    profile?.display_name ||
    profile?.first_name ||
    (profile?.email ? profile.email.split("@")[0] : "User");

  const workloadSubtext =
    persona === "consultant"
      ? "Here is a quick view of your current consultant workload."
      : persona === "freelancer"
        ? "Here is your workload for today."
        : "Here is a quick view of your current project and roadmap activity.";

  const scrollToProjects = () => {
    const projectsSection =
      (isFreelancer ? document.getElementById("my-roadmaps-section") : null) ??
      document.getElementById("my-project-visions") ??
      document.querySelector('[data-tutorial="projects-grid"]');
    if (projectsSection instanceof HTMLElement) {
      projectsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToAttention = () => {
    const attentionSection = document.getElementById("needs-your-attention");
    if (attentionSection instanceof HTMLElement) {
      attentionSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const timelineItems = isFreelancer ? upcomingDeadlines : upcomingMilestones;

  return (
    <div className="space-y-6">
      {leadContent}

      <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] gap-6">
        <div className="space-y-6 min-w-0">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
            <div className="mb-6">
              <h2 className="text-[20px] font-semibold text-[#333438]">
                Welcome back, {greetingName}
              </h2>
              <p className="text-xs text-[#61636c] mt-1">{workloadSubtext}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={scrollToProjects}
                className="group relative overflow-hidden rounded-lg p-6 bg-white shadow-sm text-left cursor-pointer transition-all duration-200 hover:shadow-md"
              >
                <span
                  className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl opacity-25"
                  style={{ backgroundColor: "var(--secondary)" }}
                />
                <span
                  className="pointer-events-none absolute -bottom-12 -left-12 w-32 h-32 rounded-full blur-3xl opacity-12"
                  style={{ backgroundColor: "var(--secondary)" }}
                />
                <span className="absolute top-4 right-4 text-slate-500 transition-colors duration-200 group-hover:text-[var(--secondary)]">
                  {"→"}
                </span>
                <p className="relative z-10 text-xs font-semibold tracking-wider text-[#61636c] uppercase mb-3 flex items-center gap-2">
                  {isFreelancer ? (
                    <ClipboardCheck className="w-4 h-4 text-slate-400" />
                  ) : (
                    <FolderOpen className="w-4 h-4 text-slate-400" />
                  )}
                  {primaryMetricLabel}
                </p>
                <p className="relative z-10 text-4xl font-bold text-slate-900">
                  {isProjectsLoading && !isFreelancer ? "..." : primaryMetricValue}
                </p>
              </button>
              <button
                type="button"
                onClick={scrollToAttention}
                className="group relative overflow-hidden rounded-lg p-6 bg-white shadow-sm text-left cursor-pointer transition-all duration-200 hover:shadow-md"
              >
                <span
                  className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl opacity-25"
                  style={{ backgroundColor: "var(--secondary)" }}
                />
                <span
                  className="pointer-events-none absolute -bottom-12 -left-12 w-32 h-32 rounded-full blur-3xl opacity-12"
                  style={{ backgroundColor: "var(--secondary)" }}
                />
                <span className="absolute top-4 right-4 text-slate-500 transition-colors duration-200 group-hover:text-[var(--secondary)]">
                  {"→"}
                </span>
                <p className="relative z-10 text-xs font-semibold tracking-wider text-[#61636c] uppercase mb-3 flex items-center gap-2">
                  {isFreelancer ? (
                    <Clock3 className="w-4 h-4 text-slate-400" />
                  ) : persona === "client" ? (
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-slate-400" />
                  )}
                  {secondaryMetricLabel}
                </p>
                <p className="relative z-10 text-4xl font-bold text-slate-900">
                  {isProjectsLoading && !isFreelancer ? "..." : secondaryMetricValue}
                </p>
              </button>
            </div>
          </div>

          {children ? <div className="space-y-8">{children}</div> : null}
        </div>

        <div className="xl:sticky xl:top-6 self-start space-y-4 min-w-0">
          <div className="bg-slate-50 border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="mb-3">
              <h3 className="text-[20px] font-semibold text-[#333438]">
                {isFreelancer ? "My Upcoming Deadlines" : "Upcoming Milestones"}
              </h3>
              <p className="text-xs text-[#61636c] mt-1">
                {isFreelancer
                  ? "Track your task due dates across active workspaces."
                  : "Track upcoming roadmap deadlines and delivery checkpoints."}
              </p>
            </div>

            {isMilestonesLoading ? (
              <p className="text-sm text-[#61636c]">Loading milestone timeline...</p>
            ) : timelineItems.length === 0 ? (
              <div className="bg-[#f6f7f8] rounded-lg p-4">
                <p className="text-sm font-semibold text-[#333438] mb-1">
                  {isFreelancer ? "No upcoming deadlines" : "No upcoming milestones"}
                </p>
                <p className="text-xs text-[#61636c]">
                  {isFreelancer
                    ? "Task due dates with upcoming deadlines will appear here."
                    : "Milestones with future target dates will appear here."}
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {timelineItems.map((item, index, arr) => {
                  const isLast = index === arr.length - 1;
                  const isCurrent = index === 0;
                  const isNext = index === 1;
                  const isUpcoming = index > 1;
                  const circleBaseClass = "w-3 h-3 rounded-full shrink-0";
                  const connectorColor =
                    index === 0 ? "var(--secondary)" : "rgb(226 232 240)";

                  return (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="flex flex-col items-center pt-1 shrink-0 w-4">
                        <span
                          className={circleBaseClass}
                          style={
                            isCurrent
                              ? { backgroundColor: "var(--secondary)" }
                              : isNext
                                ? {
                                    backgroundColor: "white",
                                    border: "2px solid var(--secondary)",
                                  }
                                : {
                                    backgroundColor: "white",
                                    border: "2px solid rgb(203 213 225)",
                                  }
                          }
                        />
                        {!isLast ? (
                          <span
                            className="w-px flex-1 mt-1 min-h-8"
                            style={{ backgroundColor: connectorColor }}
                          />
                        ) : null}
                      </div>

                      <div className="flex-1 min-w-0 pb-1">
                        <p
                          className={`text-xs ${
                            isCurrent || isNext ? "text-[#61636c]" : "text-[#92969f]"
                          }`}
                        >
                          {formatDateLabel(item.targetDate)}
                        </p>
                        <p
                          className={`mt-1 text-[14px] font-semibold ${isUpcoming ? "text-[#61636c]" : "text-[#333438]"}`}
                        >
                          {item.title}
                        </p>
                        <p className="text-xs text-[#61636c] mt-0.5">
                          {item.roadmapName}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div
            id="needs-your-attention"
            className="bg-slate-50 border border-slate-200 rounded-xl shadow-sm p-6 scroll-mt-6"
          >
            <div className="mb-3">
              <h3 className="text-[20px] font-semibold text-[#333438]">
                {attentionTitle}
              </h3>
              <p className="text-xs text-[#61636c] mt-1">{attentionSubtitle}</p>
            </div>

            {isProjectsLoading && !isFreelancer ? (
              <p className="text-sm text-[#61636c]">Loading pending items...</p>
            ) : actionItems.length === 0 ? (
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-sm font-semibold text-[#333438] mb-1">
                  {persona === "client" ? "No approvals pending" : "Nothing urgent right now"}
                </p>
                <p className="text-xs text-[#61636c]">
                  {persona === "client"
                    ? "Milestone and roadmap approvals will appear here when consultant updates are ready for your review."
                    : persona === "freelancer"
                      ? "Task execution priorities will appear here when work is assigned."
                      : "New items will appear here when something needs your action."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {actionItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg p-4 flex items-start justify-between gap-3 border border-slate-200 transition-shadow hover:shadow-sm"
                  >
                    <div className="min-w-0 flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-[14px] font-semibold text-[#333438]">{item.title}</p>
                        <p className="text-xs text-[#61636c] mt-1">{item.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#92969f] whitespace-nowrap">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}


