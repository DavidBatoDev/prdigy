import {
  CheckCircle2,
  FolderOpen,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getRoadmapFull, getRoadmaps } from "@/api";
import { projectService, type Project } from "@/services/project.service";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";

type ActionItem = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
};

type FreelancerAssignedTask = {
  id: string;
  title: string;
  projectName: string;
  projectId?: string;
  roadmapId?: string;
  taskId?: string;
};

type FreelancerFeedbackItem = {
  id: string;
  comment: string;
  consultantName: string;
  projectName: string;
};

type TimelineItem = {
  id: string;
  title: string;
  roadmapName: string;
  targetDate: string;
  projectId?: string;
  roadmapId?: string;
};

type FreelancerMatch = {
  id: string;
  project: string;
  state: "reviewing" | "shortlisted" | "assigned";
  insight: string;
};

const REVIEW_STATUSES = new Set(["draft", "bidding", "paused"]);
const MAX_FREELANCER_WORK_ITEMS = 3;

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

function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
    seconds,
  ).padStart(2, "0")}`;
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

export function ConsultantDashboardWidgets({
  leadContent,
  children,
}: {
  leadContent?: ReactNode;
  children?: ReactNode;
}) {
  const { profile } = useAuthStore();
  const persona = profile?.active_persona || "client";
  const userRole = persona.toUpperCase();
  const isFreelancer = userRole === "FREELANCER";
  const [selectedTimeTask, setSelectedTimeTask] = useState("");
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const projectsQuery = useQuery({
    queryKey: ["dashboard", "projects", "widgets", persona],
    queryFn: () => projectService.listDashboardProjects(persona),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
  });
  const timelineQuery = useQuery({
    queryKey: ["dashboard", "timeline-roadmaps", persona],
    queryFn: async () => {
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
      return roadmapDetails.filter(
        (roadmap): roadmap is NonNullable<typeof roadmap> => Boolean(roadmap),
      );
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
  });
  const projects = (projectsQuery.data as Project[] | undefined) ?? [];
  const isProjectsLoading = projectsQuery.isPending;
  const isMilestonesLoading = timelineQuery.isPending;

  const { upcomingMilestones, upcomingDeadlines } = useMemo(() => {
    const validRoadmaps = timelineQuery.data ?? [];
    const today = startOfToday().getTime();

    const milestones = validRoadmaps
      .flatMap((roadmap: any) =>
        (roadmap.milestones || []).map((milestone: any) => ({
          id: milestone.id,
          title: milestone.title,
          roadmapName: roadmap.name,
          targetDate: milestone.target_date,
        })),
      )
      .filter((item: TimelineItem) => {
        if (!item.targetDate) return false;
        const parsed = new Date(item.targetDate).getTime();
        return Number.isFinite(parsed) && parsed >= today;
      })
      .sort(
        (a: TimelineItem, b: TimelineItem) =>
          new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime(),
      );

    const deadlines = validRoadmaps
      .flatMap((roadmap: any) =>
        (roadmap.epics || []).flatMap((epic: any) =>
          (epic.features || []).flatMap((feature: any) =>
            (feature.tasks || []).map((task: any) => ({
              id: task.id,
              title: task.title || "Task",
              roadmapName: roadmap.name,
              targetDate: task.due_date,
              projectId: roadmap.project_id || undefined,
              roadmapId: roadmap.id || undefined,
            })),
          ),
        ),
      )
      .filter((item: TimelineItem) => {
        if (!item.targetDate) return false;
        const parsed = new Date(item.targetDate).getTime();
        return Number.isFinite(parsed) && parsed >= today;
      })
      .sort(
        (a: TimelineItem, b: TimelineItem) =>
          new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime(),
      );

    return {
      upcomingMilestones: milestones,
      upcomingDeadlines: deadlines,
    };
  }, [timelineQuery.data]);

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

  const projectActionItems = useMemo(
    () =>
      projects
        .map(toProjectActionItem)
        .filter((item): item is ActionItem => item !== null)
        .slice(0, 5),
    [projects],
  );

  const actionItems = projectActionItems;
  const primaryMetricValue = projectActiveCount;
  const secondaryMetricValue = projectReviewCount;
  const primaryMetricLabel = "ACTIVE PROJECTS";
  const secondaryMetricLabel =
    persona === "client" ? "PENDING APPROVALS" : "TASKS TO REVIEW";
  const attentionTitle = "Needs Your Attention";
  const attentionSubtitle =
    "Review approvals and unblock project work that needs your decision.";

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

  const freelancerAssignedTasks: FreelancerAssignedTask[] = useMemo(
    () => {
      const mappedFromDeadlines = upcomingDeadlines
        .slice(0, MAX_FREELANCER_WORK_ITEMS)
        .map((item) => ({
        id: item.id,
        title: item.title,
        projectName: item.roadmapName,
        projectId: item.projectId,
        roadmapId: item.roadmapId,
        taskId: item.id,
        }));

      if (mappedFromDeadlines.length > 0) {
        return mappedFromDeadlines;
      }

      return FREELANCER_MATCH_ITEMS.slice(0, MAX_FREELANCER_WORK_ITEMS).map(
        (item) => ({
          id: item.id,
          title:
            item.state === "assigned"
              ? "Complete scoped delivery tasks"
              : item.state === "shortlisted"
                ? "Prepare handoff details for kickoff"
                : "Update portfolio signals for matching",
          projectName: item.project,
        }),
      );
    },
    [upcomingDeadlines],
  );

  const freelancerFeedbackItems: FreelancerFeedbackItem[] = useMemo(
    () => [
      {
        id: "feedback-1",
        comment: "Please include the revised API response examples before final submission.",
        consultantName: "Mia Thompson",
        projectName: "Creator Marketplace Revamp",
      },
      {
        id: "feedback-2",
        comment: "Update edge-case notes for onboarding validation and re-submit for review.",
        consultantName: "Jared Collins",
        projectName: "Mobile Onboarding Optimization",
      },
      {
        id: "feedback-3",
        comment: "Share a short QA checklist with the next delivery drop.",
        consultantName: "Elena Cruz",
        projectName: "B2B Analytics Dashboard",
      },
    ],
    [],
  );

  useEffect(() => {
    if (!isFreelancer || !isTimerRunning) return;

    const timerId = window.setInterval(() => {
      setElapsedSeconds((previous) => previous + 1);
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [isFreelancer, isTimerRunning]);

  useEffect(() => {
    if (!isFreelancer) {
      setIsTimerRunning(false);
      setElapsedSeconds(0);
      setSelectedTimeTask("");
    }
  }, [isFreelancer]);

  const handleTimerButtonClick = () => {
    if (isTimerRunning) {
      setIsTimerRunning(false);
      setElapsedSeconds(0);
      return;
    }
    setIsTimerRunning(true);
  };

  return (
    <div className="space-y-6">
      {leadContent}

      <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] gap-6">
        <div className="space-y-6 min-w-0">
          <div>
            <div className="mb-6">
              <h2 className="text-[20px] font-semibold text-[#333438]">
                Welcome back, {greetingName}
              </h2>
              <p className="text-xs text-[#61636c] mt-1">{workloadSubtext}</p>
            </div>

            {isFreelancer ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  id="needs-your-attention"
                  className="rounded-lg p-5 bg-white shadow-sm border border-slate-200 scroll-mt-6"
                >
                  <p className="text-xs font-semibold tracking-wider text-[#61636c] uppercase mb-3">
                    Work Items
                  </p>
                  <div className="space-y-3">
                    {freelancerAssignedTasks.map((task) => {
                      const href =
                        task.projectId && task.roadmapId && task.taskId
                          ? `/project/${task.projectId}/work-items/${task.roadmapId}#task-${task.taskId}`
                          : "/dashboard";
                      return (
                        <div
                          key={task.id}
                          className="rounded-lg border border-slate-200 p-3 flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-[14px] font-semibold text-[#333438]">{task.title}</p>
                            <p className="text-xs text-[#92969f] mt-0.5">{task.projectName}</p>
                          </div>
                          <a
                            href={href}
                            className="text-xs font-semibold text-[var(--secondary)] hover:underline whitespace-nowrap"
                          >
                            View Task -&gt;
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-lg p-5 bg-white shadow-sm border border-slate-200">
                  <p className="text-xs font-semibold tracking-wider text-[#61636c] uppercase mb-3">
                    Recent Feedback
                  </p>
                  <div className="space-y-3">
                    {freelancerFeedbackItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="w-full text-left rounded-lg border border-slate-200 border-l-4 p-3 transition-colors hover:bg-[#f8fafc]"
                        style={{ borderLeftColor: "var(--secondary-light)" }}
                      >
                        <p className="text-[14px] text-[#333438] line-clamp-2">{item.comment}</p>
                        <p className="text-xs text-[#61636c] mt-1">
                          {item.consultantName} · {item.projectName}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
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
                    <FolderOpen className="w-4 h-4 text-slate-400" />
                    {primaryMetricLabel}
                  </p>
                  <p className="relative z-10 text-4xl font-bold text-slate-900">
                    {isProjectsLoading ? "..." : primaryMetricValue}
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
                    {persona === "client" ? (
                      <ShieldCheck className="w-4 h-4 text-slate-400" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-slate-400" />
                    )}
                    {secondaryMetricLabel}
                  </p>
                  <p className="relative z-10 text-4xl font-bold text-slate-900">
                    {isProjectsLoading ? "..." : secondaryMetricValue}
                  </p>
                </button>
              </div>
            )}
          </div>

          {isFreelancer ? <div className="my-10 border-t border-slate-200" /> : null}

          {children ? <div className="space-y-8">{children}</div> : null}
        </div>

        <div className="xl:sticky xl:top-[100px] self-start space-y-4 min-w-0 xl:max-h-[calc(100vh-100px)] xl:overflow-y-auto xl:[scrollbar-width:none] xl:[-ms-overflow-style:none] xl:[&::-webkit-scrollbar]:hidden">
          {isFreelancer ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="mb-4">
                <h3 className="text-[20px] font-semibold text-[#333438]">Log Time</h3>
                <p className="text-xs text-[#61636c] mt-1">Capture time against your current task queue.</p>
              </div>

              <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
                <select
                  value={selectedTimeTask}
                  onChange={(event) => setSelectedTimeTask(event.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-[#333438] focus:outline-none focus:ring-2 focus:ring-[var(--secondary-light)]"
                >
                  <option value="" disabled>
                    Choose Project/Task
                  </option>
                  {freelancerAssignedTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.projectName} - {task.title}
                    </option>
                  ))}
                </select>

                <div className="w-full h-14 rounded-lg border border-slate-200 bg-white px-4 flex items-center justify-center">
                  <span className="text-2xl font-semibold tracking-[0.08em] text-[#333438]">
                    {formatElapsed(elapsedSeconds)}
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full h-10 rounded-lg text-sm font-semibold text-white transition-colors"
                  style={{
                    backgroundColor: isTimerRunning ? "#f59e0b" : "var(--secondary)",
                  }}
                  onClick={handleTimerButtonClick}
                  disabled={!selectedTimeTask && !isTimerRunning}
                >
                  {isTimerRunning ? "Stop & Log" : "Start Timer"}
                </button>
              </form>
            </div>
          ) : null}

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
              <div className="max-h-[500px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
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
              </div>
            )}
          </div>

          {!isFreelancer ? (
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
          ) : null}
        </div>
      </section>
    </div>
  );
}


