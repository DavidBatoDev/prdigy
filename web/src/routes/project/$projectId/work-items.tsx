import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ListChecks,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  Search,
  ChevronsDownUp,
  ChevronsUpDown,
  Calendar,
  Clock3,
  Map,
  AlertCircle,
  Users,
} from "lucide-react";
import {
  roadmapService,
  epicService,
  featureService,
  taskService,
} from "@/services/roadmap.service";
import { projectService, type ProjectMember } from "@/services/project.service";
import { useUser } from "@/stores/authStore";
import { AddEpicModal } from "@/components/roadmap/modals/AddEpicModal";
import { AddFeatureModal } from "@/components/roadmap/modals/AddFeatureModal";
import { SidePanel } from "@/components/roadmap/panels/SidePanel";
import type {
  RoadmapEpic,
  RoadmapFeature,
  RoadmapTask,
  EpicStatus,
  FeatureStatus,
  TaskStatus,
  EpicPriority,
} from "@/types/roadmap";

export const Route = createFileRoute("/project/$projectId/work-items")({
  component: WorkItemsPage,
});

const EPIC_STATUS_MAP: Record<EpicStatus, { label: string; cls: string }> = {
  backlog: { label: "Backlog", cls: "bg-gray-100 text-gray-600" },
  planned: { label: "Planned", cls: "bg-blue-50 text-blue-600" },
  in_progress: { label: "In Progress", cls: "bg-amber-50 text-amber-600" },
  in_review: { label: "In Review", cls: "bg-purple-50 text-purple-600" },
  completed: { label: "Completed", cls: "bg-emerald-50 text-emerald-600" },
  on_hold: { label: "On Hold", cls: "bg-red-50 text-red-500" },
};

const FEATURE_STATUS_MAP: Record<
  FeatureStatus,
  { label: string; cls: string }
> = {
  not_started: { label: "Not Started", cls: "bg-gray-100 text-gray-500" },
  in_progress: { label: "In Progress", cls: "bg-amber-50 text-amber-600" },
  in_review: { label: "In Review", cls: "bg-purple-50 text-purple-600" },
  completed: { label: "Completed", cls: "bg-emerald-50 text-emerald-600" },
  blocked: { label: "Blocked", cls: "bg-red-50 text-red-500" },
};

const TASK_STATUS_MAP: Record<TaskStatus, { label: string; cls: string }> = {
  todo: { label: "To Do", cls: "bg-gray-100 text-gray-500" },
  in_progress: { label: "In Progress", cls: "bg-amber-50 text-amber-600" },
  in_review: { label: "In Review", cls: "bg-purple-50 text-purple-600" },
  done: { label: "Done", cls: "bg-emerald-50 text-emerald-600" },
  blocked: { label: "Blocked", cls: "bg-red-50 text-red-500" },
};

const TASK_STATUS_OPTIONS: TaskStatus[] = [
  "todo",
  "in_progress",
  "in_review",
  "done",
  "blocked",
];

const matchesTaskAssigneeFilter = (
  task: RoadmapTask,
  assigneeFilter: "all" | "me" | string,
  currentUserId?: string,
) => {
  if (assigneeFilter === "all") return true;
  const assigneeId = task.assignee_id ?? task.assignee?.id;
  if (assigneeFilter === "unassigned") return !assigneeId;
  if (assigneeFilter === "me") {
    if (!currentUserId) return true;
    return assigneeId === currentUserId;
  }
  return assigneeId === assigneeFilter;
};

const getTaskCheckboxStyle = (status: TaskStatus) => {
  switch (status) {
    case "in_progress":
      return {
        box: "border-blue-500 bg-blue-50 text-blue-600",
        mark: "-",
      };
    case "in_review":
      return {
        box: "border-purple-500 bg-purple-50 text-purple-600",
        mark: "o",
      };
    case "done":
      return {
        box: "border-emerald-500 bg-emerald-500 text-white",
        mark: "check",
      };
    case "blocked":
      return {
        box: "border-red-500 bg-red-50 text-red-600",
        mark: "X",
      };
    case "todo":
    default:
      return {
        box: "border-gray-300 bg-white text-transparent",
        mark: "",
      };
  }
};

const PRIORITY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-400",
  medium: "bg-yellow-400",
  low: "bg-blue-400",
  nice_to_have: "bg-gray-300",
};

function StatusBadge({
  status,
  map,
}: {
  status: string;
  map: Record<string, { label: string; cls: string }>;
}) {
  const cfg = map[status] ?? {
    label: status,
    cls: "bg-gray-100 text-gray-500",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide whitespace-nowrap ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}

function Avatar({
  name,
  avatarUrl,
}: {
  name?: string | null;
  avatarUrl?: string | null;
}) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name ?? ""}
        className="w-6 h-6 rounded-full object-cover ring-1 ring-white"
      />
    );
  }
  return (
    <div className="w-6 h-6 rounded-full bg-linear-to-br from-[#ff9933] to-orange-400 flex items-center justify-center text-white text-[9px] font-bold ring-1 ring-white">
      {initials}
    </div>
  );
}

function DateRange({
  start,
  end,
  variant = "feature",
}: {
  start?: string | null;
  end?: string | null;
  variant?: "epic" | "feature" | "task";
}) {
  const fmt = (d?: string | null) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "2-digit",
        })
      : null;

  const s = fmt(start);
  const e = fmt(end);
  if (!s && !e) return null;

  const Icon =
    variant === "epic" ? Map : variant === "task" ? Clock3 : Calendar;

  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-500 whitespace-nowrap">
      <Icon className="w-5 h-5 text-gray-400 shrink-0" />
      {s ?? ""}
      {s && e ? <span className="text-gray-300 mx-0.5">/</span> : null}
      {e ?? ""}
    </span>
  );
}

function AllAssigneesAvatar({ members }: { members: ProjectMember[] }) {
  const visible = members.slice(0, 2);

  return (
    <span className="flex items-center">
      <span className="flex items-center">
        {visible.map((member, idx) => {
          const name =
            member.user?.display_name || member.user?.email || "Member";
          return (
            <span key={member.user_id} className={idx > 0 ? "-ml-2" : ""}>
              <Avatar name={name} avatarUrl={member.user?.avatar_url} />
            </span>
          );
        })}
      </span>
      <span className="-ml-2 w-6 h-6 rounded-full border border-white bg-gray-300 text-white text-[10px] font-semibold flex items-center justify-center">
        {members.length}
      </span>
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color =
    pct === 100 ? "bg-emerald-400" : pct > 50 ? "bg-amber-400" : "bg-blue-400";
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-medium text-gray-400 w-7 text-right shrink-0">
        {pct}%
      </span>
    </div>
  );
}

function Pill({
  label,
  color,
}: {
  label: string;
  color: "orange" | "blue" | "green";
}) {
  const cls = {
    orange: "bg-orange-50 text-orange-500 border-orange-100",
    blue: "bg-blue-50 text-blue-500 border-blue-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
  }[color];
  return (
    <span
      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cls}`}
    >
      {label}
    </span>
  );
}

const COL = {
  chevron: "w-10 shrink-0",
  indent: "w-6 shrink-0",
  name: "flex-1 min-w-0",
  assignee: "w-20 shrink-0",
  status: "w-32 shrink-0",
  date: "w-44 shrink-0",
  progress: "w-36 shrink-0",
} as const;

function WorkItemsLoadingSkeleton() {
  const epicRows = [0, 1, 2];
  const featureRows = [0, 1];
  const taskRows = [0, 1, 2];

  return (
    <div className="animate-pulse flex flex-col gap-3 py-2">
      <div className="flex items-center bg-white rounded-xl border border-gray-100 shadow-sm px-0 overflow-hidden">
        <div className={COL.chevron} />
        <div className={`${COL.name} py-2 pr-4`}>
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </div>
        <div className={`${COL.assignee} flex justify-center`}>
          <div className="h-3 w-14 bg-gray-200 rounded" />
        </div>
        <div className={`${COL.status} flex items-center`}>
          <div className="h-3 w-16 bg-gray-200 rounded" />
        </div>
        <div className={`${COL.date} hidden lg:flex items-center`}>
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </div>
        <div className={`${COL.progress} hidden xl:flex items-center pr-4`}>
          <div className="h-3 w-20 bg-gray-200 rounded" />
        </div>
      </div>

      {epicRows.map((epicIndex) => (
        <div
          key={`epic-${epicIndex}`}
          className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="flex items-center px-0 py-3 border-b border-gray-100 bg-gray-50/60">
            <div className={`${COL.chevron} flex items-center justify-center`}>
              <div className="w-4 h-4 rounded bg-gray-200" />
            </div>
            <div className={`${COL.name} pr-4 flex items-center gap-2`}>
              <div className="h-4 w-8 bg-gray-200 rounded-full" />
              <div
                className="h-4 bg-gray-200 rounded"
                style={{ width: epicIndex === 0 ? "58%" : "48%" }}
              />
            </div>
            <div className={`${COL.assignee} flex justify-center`}>
              <div className="w-6 h-6 rounded-full bg-gray-200" />
            </div>
            <div className={`${COL.status} flex items-center`}>
              <div className="h-5 w-20 bg-gray-100 rounded-full" />
            </div>
            <div className={`${COL.date} hidden lg:flex items-center`}>
              <div className="h-3 w-28 bg-gray-100 rounded" />
            </div>
            <div className={`${COL.progress} hidden xl:flex items-center pr-4`}>
              <div className="w-full h-1.5 bg-gray-100 rounded-full" />
            </div>
          </div>

          {featureRows.map((featureIndex) => (
            <div
              key={`feature-${epicIndex}-${featureIndex}`}
              className="border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center px-0 py-2">
                <div className={`${COL.indent} flex justify-center`}>
                  <span className="w-px h-6 bg-gray-200" />
                </div>
                <div
                  className={`${COL.chevron} flex items-center justify-center`}
                >
                  <div className="w-3 h-3 rounded bg-gray-200" />
                </div>
                <div className={`${COL.name} pr-4`}>
                  <div
                    className="h-3.5 bg-gray-200 rounded"
                    style={{ width: featureIndex % 2 === 0 ? "44%" : "38%" }}
                  />
                </div>
                <div className={`${COL.assignee} flex justify-center`}>
                  <div className="w-6 h-6 rounded-full bg-gray-100" />
                </div>
                <div className={`${COL.status} flex items-center`}>
                  <div className="h-5 w-18 bg-gray-100 rounded-full" />
                </div>
                <div className={`${COL.date} hidden lg:flex items-center`}>
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                </div>
                <div
                  className={`${COL.progress} hidden xl:flex items-center pr-4`}
                >
                  <div className="w-full h-1.5 bg-gray-100 rounded-full" />
                </div>
              </div>

              <div className="px-0 pb-1">
                {taskRows.slice(0, epicIndex === 0 ? 3 : 2).map((taskIndex) => (
                  <div
                    key={`task-${epicIndex}-${featureIndex}-${taskIndex}`}
                    className="flex items-center py-2 border-t border-gray-50"
                  >
                    <div className={`${COL.indent} flex justify-center`}>
                      <span className="w-px h-4 bg-gray-200" />
                    </div>
                    <div className={`${COL.indent} flex justify-center`}>
                      <span className="w-px h-4 bg-gray-200" />
                    </div>
                    <div
                      className={`${COL.chevron} flex items-center justify-center`}
                    >
                      <span className="w-3 h-px bg-gray-200" />
                    </div>
                    <div className={`${COL.name} pr-4`}>
                      <div
                        className="h-3 bg-gray-100 rounded"
                        style={{ width: taskIndex === 1 ? "34%" : "40%" }}
                      />
                    </div>
                    <div className={`${COL.assignee} flex justify-center`}>
                      <div className="w-5 h-5 rounded-full bg-gray-100" />
                    </div>
                    <div className={`${COL.status} flex items-center`}>
                      <div className="h-4 w-16 bg-gray-100 rounded-full" />
                    </div>
                    <div className={`${COL.date} hidden lg:flex items-center`}>
                      <div className="h-3 w-18 bg-gray-100 rounded" />
                    </div>
                    <div
                      className={`${COL.progress} hidden xl:flex items-center pr-4`}
                    >
                      <div className="w-full h-1.5 bg-gray-100 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function TaskRow({
  task,
  isLast,
  onOpen,
  onToggleComplete,
  onUpdateStatus,
  isSaving,
}: {
  task: RoadmapTask;
  isLast: boolean;
  onOpen: (t: RoadmapTask) => void;
  onToggleComplete: (t: RoadmapTask) => void;
  onUpdateStatus: (t: RoadmapTask, status: TaskStatus) => void;
  isSaving: boolean;
}) {
  const isDone = task.status === "done";
  const checkboxStyle = getTaskCheckboxStyle(task.status);
  const [isCheckboxMenuOpen, setIsCheckboxMenuOpen] = useState(false);
  const checkboxButtonRef = useRef<HTMLButtonElement | null>(null);
  const checkboxMenuRef = useRef<HTMLDivElement | null>(null);
  const [checkboxMenuPosition, setCheckboxMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    if (!isCheckboxMenuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInButton = checkboxButtonRef.current?.contains(target);
      const isInMenu = checkboxMenuRef.current?.contains(target);
      if (!isInButton && !isInMenu) setIsCheckboxMenuOpen(false);
    };

    const handleReposition = () => {
      if (!checkboxButtonRef.current) return;
      const rect = checkboxButtonRef.current.getBoundingClientRect();
      setCheckboxMenuPosition({ top: rect.bottom + 6, left: rect.left });
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [isCheckboxMenuOpen, checkboxButtonRef, checkboxMenuRef]);

  return (
    <div
      className={`group relative flex items-center cursor-pointer hover:bg-blue-50/40 active:bg-blue-50/60 transition-colors ${!isLast ? "border-b border-gray-100" : ""}`}
      onClick={() => onOpen(task)}
      title="View task details"
    >
      {/* feature-level indent */}
      <div className={`${COL.indent} flex items-stretch justify-center`}>
        <span className="w-px bg-gray-200" />
      </div>
      {/* task-level indent (extra) */}
      <div className={`${COL.indent} flex items-center justify-center`}>
        <span className="w-px h-full bg-gray-300" />
      </div>
      {/* dot in chevron column */}
      <div
        className={`${COL.chevron} flex items-center justify-center gap-1.5`}
      >
        <span className="w-3 h-px bg-gray-300" />
        {/* <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-blue-300 transition-colors" /> */}
      </div>

      {/* Name */}
      <div
        className={`${COL.name} py-2.5 pr-4 flex items-center gap-2 min-w-0`}
      >
        <button
          ref={checkboxButtonRef}
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(task);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCheckboxMenuPosition({ top: e.clientY, left: e.clientX });
            setIsCheckboxMenuOpen(true);
          }}
          disabled={isSaving}
          className={`shrink-0 w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all ${checkboxStyle.box} disabled:opacity-60 disabled:cursor-not-allowed`}
          title={isDone ? "Mark as incomplete" : "Mark as complete"}
        >
          {checkboxStyle.mark === "check" ? (
            <Check className="w-5 h-5 text-white" />
          ) : (
            <span className="text-[11px] leading-none font-bold">
              {checkboxStyle.mark}
            </span>
          )}
        </button>
        {isCheckboxMenuOpen &&
          createPortal(
            <div
              ref={checkboxMenuRef}
              className="fixed z-80 bg-white border border-gray-300 rounded-md shadow-lg py-1 min-w-[150px]"
              style={{
                top: checkboxMenuPosition.top,
                left: checkboxMenuPosition.left,
              }}
            >
              {TASK_STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateStatus(task, status);
                    setIsCheckboxMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs capitalize hover:bg-gray-100 ${task.status === status ? "bg-gray-50 font-semibold" : ""}`}
                >
                  {status.replace(/_/g, " ")}
                </button>
              ))}
            </div>,
            document.body,
          )}
        <span
          className={`text-[13px] text-gray-700 truncate block ${isDone ? "line-through text-gray-400" : ""}`}
        >
          {task.title}
        </span>
      </div>

      {/* Assignee */}
      <div className={`${COL.assignee} flex items-center justify-center`}>
        {task.assignee ? (
          <Avatar
            name={task.assignee.display_name ?? task.assignee.email}
            avatarUrl={task.assignee.avatar_url}
          />
        ) : (
          <span className="w-6 h-6 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center">
            <span className="text-gray-300 text-[8px]">+</span>
          </span>
        )}
      </div>

      {/* Status */}
      <div className={`${COL.status} flex items-center`}>
        <select
          value={task.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            onUpdateStatus(task, e.target.value as TaskStatus);
          }}
          disabled={isSaving}
          className={`text-xs font-medium rounded px-2 py-1 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#ff9933]/25 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${TASK_STATUS_MAP[task.status]?.cls ?? "bg-gray-100 text-gray-500"}`}
        >
          {TASK_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {TASK_STATUS_MAP[status].label}
            </option>
          ))}
        </select>
      </div>

      {/* Due date */}
      <div className={`${COL.date} hidden lg:flex items-center`}>
        <DateRange start={null} end={task.due_date} variant="task" />
      </div>

      {/* Priority */}
      <div className={`${COL.progress} hidden xl:flex items-center pr-4`}>
        {task.priority && (
          <span className="text-[10px] font-medium text-gray-400 capitalize">
            {task.priority.replace("_", " ")}
          </span>
        )}
      </div>
    </div>
  );
}

function FeatureRow({
  feature,
  isExpanded,
  onToggleExpand,
  isLast,
  search,
  statusFilter,
  assigneeFilter,
  currentUserId,
  onOpenFeature,
  onOpenTask,
  onToggleTaskComplete,
  onUpdateTaskStatus,
  isSaving,
}: {
  feature: RoadmapFeature;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isLast: boolean;
  search: string;
  statusFilter: string;
  assigneeFilter: "all" | "me" | string;
  currentUserId?: string;
  onOpenFeature: (f: RoadmapFeature) => void;
  onOpenTask: (t: RoadmapTask) => void;
  onToggleTaskComplete: (t: RoadmapTask) => void;
  onUpdateTaskStatus: (t: RoadmapTask, status: TaskStatus) => void;
  isSaving: boolean;
}) {
  const tasks = useMemo(
    () =>
      (feature.tasks ?? []).filter((t) => {
        if (!matchesTaskAssigneeFilter(t, assigneeFilter, currentUserId))
          return false;
        if (search && !t.title.toLowerCase().includes(search.toLowerCase()))
          return false;
        if (statusFilter && t.status !== statusFilter) return false;
        return true;
      }),
    [assigneeFilter, currentUserId, feature.tasks, search, statusFilter],
  );

  const hasTasks = tasks.length > 0;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const progress = hasTasks ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const featureAssignees = useMemo(() => {
    const deduped = new globalThis.Map<
      string,
      NonNullable<RoadmapTask["assignee"]>
    >();

    for (const childTask of tasks) {
      const assigneeId = childTask.assignee_id ?? childTask.assignee?.id;
      if (!assigneeId || !childTask.assignee) continue;
      if (!deduped.has(assigneeId)) deduped.set(assigneeId, childTask.assignee);
    }

    return Array.from(deduped.values());
  }, [tasks]);

  return (
    <>
      {/* Feature row */}
      <div
        className={`group relative flex items-center cursor-pointer bg-gray-100/60 hover:bg-gray-100/70 active:bg-gray-100 transition-colors ${!isLast || isExpanded ? "border-b border-gray-100" : ""}`}
        onClick={() => onOpenFeature(feature)}
        title="Edit feature"
      >
        {/* feature indent */}
        <div className={`${COL.indent} flex items-stretch justify-center`}>
          <span className="w-px bg-gray-200" />
        </div>

        {/* Chevron toggle only, stops propagation */}
        <div
          className={`${COL.chevron} flex items-center justify-center gap-1.5`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
        >
          <span className="w-5 h-px bg-gray-300" />
          {hasTasks ? (
            isExpanded ? (
              <ChevronDown className="w-6 h-6 text-gray-500" />
            ) : (
              <ChevronRight className="w-6 h-6 text-gray-500" />
            )
          ) : (
            <div className="w-2 h-2 rounded-full border border-gray-300" />
          )}
        </div>

        {/* Name */}
        <div className={`${COL.name} py-2.5 pr-4`}>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-gray-800 truncate group-hover:text-gray-900">
              {feature.title}
            </span>
            {hasTasks && (
              <span className="text-[10px] text-gray-400 shrink-0 tabular-nums">
                {doneTasks}/{tasks.length}
              </span>
            )}
            {feature.is_deliverable && (
              <span className="hidden sm:inline text-[9px] font-semibold bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0">
                Deliverable
              </span>
            )}
          </div>
        </div>

        {/* Assignee */}
        <div className={`${COL.assignee} flex items-center justify-center`}>
          {featureAssignees.length > 0 ? (
            <div className="flex items-center">
              {featureAssignees.slice(0, 4).map((assignee, index) => (
                <div
                  key={assignee.id}
                  className={index > 0 ? "-ml-1.5" : ""}
                  title={assignee.display_name ?? assignee.email ?? "Assignee"}
                >
                  <Avatar
                    name={assignee.display_name ?? assignee.email}
                    avatarUrl={assignee.avatar_url}
                  />
                </div>
              ))}
              {featureAssignees.length > 4 && (
                <span className="-ml-1.5 w-6 h-6 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[9px] font-semibold text-gray-500">
                  +{featureAssignees.length - 4}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[10px] text-gray-300">—</span>
          )}
        </div>

        {/* Status */}
        <div className={`${COL.status} flex items-center`}>
          <StatusBadge status={feature.status} map={FEATURE_STATUS_MAP} />
        </div>

        {/* Dates */}
        <div className={`${COL.date} hidden lg:flex items-center`}>
          <DateRange
            start={feature.start_date}
            end={feature.end_date}
            variant="feature"
          />
        </div>

        {/* Progress */}
        <div className={`${COL.progress} hidden xl:flex items-center pr-4`}>
          {hasTasks ? (
            <ProgressBar value={progress} />
          ) : (
            <span className="text-[10px] text-gray-300">â€”</span>
          )}
        </div>
      </div>

      {/* Task children */}
      {isExpanded &&
        hasTasks &&
        tasks.map((task, i) => (
          <TaskRow
            key={task.id}
            task={task}
            isLast={i === tasks.length - 1}
            onOpen={onOpenTask}
            onToggleComplete={onToggleTaskComplete}
            onUpdateStatus={onUpdateTaskStatus}
            isSaving={isSaving}
          />
        ))}
    </>
  );
}

// â”€â”€â”€ Epic card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function EpicCard({
  epic,
  isExpanded,
  onToggleExpand,
  search,
  statusFilter,
  assigneeFilter,
  currentUserId,
  expandedFeatures,
  onToggleFeature,
  onOpenEpic,
  onOpenFeature,
  onOpenTask,
  onToggleTaskComplete,
  onUpdateTaskStatus,
  isSaving,
}: {
  epic: RoadmapEpic;
  isExpanded: boolean;
  onToggleExpand: () => void;
  search: string;
  statusFilter: string;
  assigneeFilter: "all" | "me" | string;
  currentUserId?: string;
  expandedFeatures: Set<string>;
  onToggleFeature: (id: string) => void;
  onOpenEpic: (e: RoadmapEpic) => void;
  onOpenFeature: (f: RoadmapFeature) => void;
  onOpenTask: (t: RoadmapTask) => void;
  onToggleTaskComplete: (t: RoadmapTask) => void;
  onUpdateTaskStatus: (t: RoadmapTask, status: TaskStatus) => void;
  isSaving: boolean;
}) {
  const features = useMemo(
    () =>
      (epic.features ?? [])
        .filter((f) => {
          const scopedTasks = (f.tasks ?? []).filter((t) =>
            matchesTaskAssigneeFilter(t, assigneeFilter, currentUserId),
          );

          if (assigneeFilter !== "all" && scopedTasks.length === 0)
            return false;
          if (statusFilter && f.status !== statusFilter) return false;
          if (search) {
            const fMatch = f.title.toLowerCase().includes(search.toLowerCase());
            const tMatch = scopedTasks.some((t) =>
              t.title.toLowerCase().includes(search.toLowerCase()),
            );
            return fMatch || tMatch;
          }
          return true;
        })
        .sort((a, b) => a.position - b.position),
    [assigneeFilter, currentUserId, epic.features, search, statusFilter],
  );

  const totalTasks = features.reduce(
    (acc, f) => acc + (f.tasks?.length ?? 0),
    0,
  );
  const doneTasks = features.reduce(
    (acc, f) => acc + (f.tasks?.filter((t) => t.status === "done").length ?? 0),
    0,
  );
  const progress =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const epicColor = epic.color ?? "#ff9933";
  const dotCls = PRIORITY_DOT[epic.priority] ?? "bg-gray-300";

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      style={{ borderLeft: `3px solid ${epicColor}` }}
    >
      {/* â”€â”€ Epic header row â”€â”€ */}
      <div
        className="group flex items-center cursor-pointer bg-[#ff9933]/8 hover:bg-[#ff9933]/14 active:bg-[#ff9933]/18 transition-colors border-b border-gray-100"
        onClick={() => onOpenEpic(epic)}
        title="Edit epic"
      >
        {/* Chevron â€” stops propagation */}
        <div
          className={`${COL.chevron} flex items-center justify-center`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
        >
          {features.length > 0 ? (
            isExpanded ? (
              <ChevronDown
                className="w-7 h-7 text-[#ff9933]"
                strokeWidth={2.6}
              />
            ) : (
              <ChevronRight
                className="w-7 h-7 text-[#ff9933]"
                strokeWidth={2.6}
              />
            )
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
          )}
        </div>

        {/* Name */}
        <div className={`${COL.name} py-3 pr-4`}>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${dotCls}`}
              title={`Priority: ${epic.priority}`}
            />
            <span className="text-base font-bold text-gray-900 truncate group-hover:text-gray-950">
              {epic.title}
            </span>
            {features.length > 0 && (
              <span className="text-[10px] font-medium text-gray-400 shrink-0 bg-gray-100 px-1.5 py-0.5 rounded tabular-nums">
                {features.length} feat.
              </span>
            )}
          </div>
        </div>

        {/* Assignee */}
        <div className={COL.assignee} />

        {/* Status */}
        <div className={`${COL.status} flex items-center`}>
          <StatusBadge status={epic.status} map={EPIC_STATUS_MAP} />
        </div>

        {/* Dates */}
        <div className={`${COL.date} hidden lg:flex items-center`}>
          <DateRange
            start={epic.start_date}
            end={epic.end_date}
            variant="epic"
          />
        </div>

        {/* Progress */}
        <div className={`${COL.progress} hidden xl:flex items-center pr-4`}>
          {totalTasks > 0 ? (
            <ProgressBar value={progress} />
          ) : (
            <span className="text-[10px] text-gray-300">No tasks</span>
          )}
        </div>
      </div>

      {/* â”€â”€ Feature children â”€â”€ */}
      {isExpanded &&
        features.map((feature, i) => (
          <FeatureRow
            key={feature.id}
            feature={feature}
            isExpanded={expandedFeatures.has(feature.id)}
            onToggleExpand={() => onToggleFeature(feature.id)}
            isLast={i === features.length - 1}
            search={search}
            statusFilter={statusFilter}
            assigneeFilter={assigneeFilter}
            currentUserId={currentUserId}
            onOpenFeature={onOpenFeature}
            onOpenTask={onOpenTask}
            onToggleTaskComplete={onToggleTaskComplete}
            onUpdateTaskStatus={onUpdateTaskStatus}
            isSaving={isSaving}
          />
        ))}
    </div>
  );
}

// â”€â”€â”€ Empty states â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function NoRoadmapEmptyState({ projectId }: { projectId: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
        <Map className="w-9 h-9 text-gray-400" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-1">
          No roadmap linked
        </h2>
        <p className="text-sm text-gray-400 max-w-sm mx-auto">
          Link a roadmap to this project to see its epics, features, and tasks
          here.
        </p>
      </div>
      <Link
        to="/project/$projectId/roadmap"
        params={{ projectId }}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#ff9933] text-white text-sm font-semibold hover:bg-orange-500 transition-colors shadow-sm"
      >
        <Map className="w-4 h-4" />
        Go to Roadmap
      </Link>
    </div>
  );
}

// â”€â”€â”€ Main page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function WorkItemsPage() {
  const { projectId } = Route.useParams();
  const user = useUser();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const [epics, setEpics] = useState<RoadmapEpic[]>([]);
  const [roadmapId, setRoadmapId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  // Expansion
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(
    new Set(),
  );

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState<"all" | "me" | string>(
    "me",
  );
  const [isAssigneeFilterMenuOpen, setIsAssigneeFilterMenuOpen] =
    useState(false);
  const assigneeFilterButtonRef = useRef<HTMLButtonElement | null>(null);
  const assigneeFilterMenuRef = useRef<HTMLDivElement | null>(null);

  // â”€â”€ Modal / panel state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [editingEpic, setEditingEpic] = useState<RoadmapEpic | null>(null);
  const [editingFeature, setEditingFeature] = useState<RoadmapFeature | null>(
    null,
  );
  const [selectedTask, setSelectedTask] = useState<RoadmapTask | null>(null);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // â”€â”€ Data loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const roadmap = await roadmapService.getByProjectId(projectId);
        if (!roadmap) {
          if (!cancelled) setIsLoading(false);
          return;
        }
        if (!cancelled) setRoadmapId(roadmap.id);

        const full = await roadmapService.getFull(roadmap.id);
        const baseEpics = (full.epics ?? []).sort(
          (a, b) => a.position - b.position,
        );

        const hydrated = await Promise.all(
          baseEpics.map(async (epic) => {
            const rawFeatures =
              epic.features && epic.features.length > 0
                ? epic.features
                : await featureService
                    .getAll(epic.id)
                    .catch(() => [] as RoadmapFeature[]);

            const sortedFeatures = [...rawFeatures].sort(
              (a, b) => a.position - b.position,
            );

            const featuresWithTasks = await Promise.all(
              sortedFeatures.map(async (feature) => {
                if (feature.tasks && feature.tasks.length > 0) return feature;
                const tasks = await taskService
                  .getAll(feature.id)
                  .catch(() => [] as RoadmapTask[]);
                return { ...feature, tasks };
              }),
            );
            return { ...epic, features: featuresWithTasks };
          }),
        );

        if (cancelled) return;
        setEpics(hydrated);
        setExpandedEpics(new Set(hydrated.map((e) => e.id)));
        setExpandedFeatures(
          new Set(hydrated.flatMap((e) => (e.features ?? []).map((f) => f.id))),
        );
      } catch {
        if (!cancelled)
          setError("Failed to load work items. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    if (!isAssigneeFilterMenuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInButton = assigneeFilterButtonRef.current?.contains(target);
      const isInMenu = assigneeFilterMenuRef.current?.contains(target);
      if (!isInButton && !isInMenu) setIsAssigneeFilterMenuOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isAssigneeFilterMenuOpen]);

  useEffect(() => {
    let cancelled = false;

    const loadMembers = async () => {
      try {
        const members = await projectService.getMembers(projectId);
        if (!cancelled) setProjectMembers(members);
      } catch {
        if (!cancelled) setProjectMembers([]);
      }
    };

    loadMembers();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // â”€â”€ Helper: patch a single epic in local state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const patchEpic = useCallback((updated: RoadmapEpic) => {
    setEpics((prev) =>
      prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)),
    );
  }, []);

  const patchFeature = useCallback((updated: RoadmapFeature) => {
    setEpics((prev) =>
      prev.map((e) => ({
        ...e,
        features: (e.features ?? []).map((f) =>
          f.id === updated.id ? { ...f, ...updated } : f,
        ),
      })),
    );
  }, []);

  const patchTask = useCallback((updated: RoadmapTask) => {
    setEpics((prev) =>
      prev.map((e) => ({
        ...e,
        features: (e.features ?? []).map((f) => ({
          ...f,
          tasks: (f.tasks ?? []).map((t) =>
            t.id === updated.id ? { ...t, ...updated } : t,
          ),
        })),
      })),
    );
  }, []);

  const removeTask = useCallback((taskId: string) => {
    setEpics((prev) =>
      prev.map((e) => ({
        ...e,
        features: (e.features ?? []).map((f) => ({
          ...f,
          tasks: (f.tasks ?? []).filter((t) => t.id !== taskId),
        })),
      })),
    );
  }, []);

  // â”€â”€ Modal submit handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleEpicSave = useCallback(
    async (data: {
      title: string;
      description: string;
      priority: EpicPriority;
      tags: string[];
      start_date?: string;
      end_date?: string;
    }) => {
      if (!editingEpic) return;
      setIsSaving(true);
      try {
        const updated = await epicService.update(editingEpic.id, {
          title: data.title,
          description: data.description,
          priority: data.priority,
          tags: data.tags,
          start_date: data.start_date,
          end_date: data.end_date,
        });
        patchEpic({ ...editingEpic, ...updated });
        setEditingEpic(null);
      } catch {
        // keep modal open on error
      } finally {
        setIsSaving(false);
      }
    },
    [editingEpic, patchEpic],
  );

  const handleFeatureSave = useCallback(
    async (data: {
      title: string;
      description: string;
      status: FeatureStatus;
      is_deliverable: boolean;
      start_date?: string;
      end_date?: string;
    }) => {
      if (!editingFeature) return;
      setIsSaving(true);
      try {
        const updated = await featureService.update(editingFeature.id, {
          title: data.title,
          description: data.description,
          status: data.status,
          is_deliverable: data.is_deliverable,
          start_date: data.start_date,
          end_date: data.end_date,
        });
        patchFeature({ ...editingFeature, ...updated });
        setEditingFeature(null);
      } catch {
        // keep modal open
      } finally {
        setIsSaving(false);
      }
    },
    [editingFeature, patchFeature],
  );

  const handleTaskUpdate = useCallback(
    async (task: RoadmapTask, options?: { closePanelOnSuccess?: boolean }) => {
      setIsSaving(true);
      try {
        const updated = await taskService.update(task.id, {
          title: task.title,
          status: task.status,
          priority: task.priority,
          assignee_id: task.assignee_id ?? null,
          due_date: task.due_date ?? null,
          completed_at: task.completed_at,
        });
        patchTask({ ...task, ...updated });
        setSelectedTask((prev) =>
          prev?.id === task.id
            ? options?.closePanelOnSuccess
              ? null
              : { ...prev, ...updated }
            : prev,
        );
      } catch {
        // silent
      } finally {
        setIsSaving(false);
      }
    },
    [patchTask],
  );

  const handleTaskDelete = useCallback(
    async (taskId: string) => {
      setIsSaving(true);
      try {
        await taskService.delete(taskId);
        removeTask(taskId);
        setSelectedTask((prev) => (prev?.id === taskId ? null : prev));
      } catch {
        // silent
      } finally {
        setIsSaving(false);
      }
    },
    [removeTask],
  );

  const handleTaskToggleComplete = useCallback(
    (task: RoadmapTask) => {
      const nextStatus: TaskStatus = task.status === "done" ? "todo" : "done";
      handleTaskUpdate({
        ...task,
        status: nextStatus,
        completed_at:
          nextStatus === "done"
            ? (task.completed_at ?? new Date().toISOString())
            : undefined,
      });
    },
    [handleTaskUpdate],
  );

  const handleTaskStatusChange = useCallback(
    (task: RoadmapTask, status: TaskStatus) => {
      handleTaskUpdate({
        ...task,
        status,
        completed_at:
          status === "done"
            ? (task.completed_at ?? new Date().toISOString())
            : undefined,
      });
    },
    [handleTaskUpdate],
  );

  // â”€â”€ Expand / collapse â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const toggleEpic = useCallback((id: string) => {
    setExpandedEpics((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleFeature = useCallback((id: string) => {
    setExpandedFeatures((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const filteredEpics = useMemo(() => {
    if (!search && !statusFilter && assigneeFilter === "all") return epics;

    const currentUserId = user?.id;

    return epics.filter((epic) => {
      const allFeatures = epic.features ?? [];
      const hasAssignedTask =
        assigneeFilter === "all"
          ? true
          : allFeatures.some((feature) =>
              (feature.tasks ?? []).some((task) => {
                return matchesTaskAssigneeFilter(
                  task,
                  assigneeFilter,
                  currentUserId,
                );
              }),
            );

      if (!hasAssignedTask) return false;

      const epicMatch = epic.title.toLowerCase().includes(search.toLowerCase());
      const featureMatch = allFeatures.some(
        (f) =>
          f.title.toLowerCase().includes(search.toLowerCase()) ||
          (f.tasks ?? []).some((t) => {
            if (!matchesTaskAssigneeFilter(t, assigneeFilter, currentUserId))
              return false;
            return t.title.toLowerCase().includes(search.toLowerCase());
          }),
      );
      const statusMatch = !statusFilter || epic.status === statusFilter;
      return (epicMatch || featureMatch) && statusMatch;
    });
  }, [assigneeFilter, epics, search, statusFilter, user?.id]);

  const assigneeFilterOptions = useMemo(() => {
    const unique = new globalThis.Map<string, ProjectMember>();
    for (const member of projectMembers) {
      if (!member.user_id) continue;
      if (!unique.has(member.user_id)) unique.set(member.user_id, member);
    }
    return Array.from(unique.values());
  }, [projectMembers]);

  const assigneeFilterMemberOptions = useMemo(
    () => assigneeFilterOptions.filter((member) => member.user_id !== user?.id),
    [assigneeFilterOptions, user?.id],
  );

  const selectedAssigneeMember = useMemo(() => {
    if (
      assigneeFilter === "all" ||
      assigneeFilter === "me" ||
      assigneeFilter === "unassigned"
    )
      return null;
    return (
      assigneeFilterOptions.find(
        (member) => member.user_id === assigneeFilter,
      ) ?? null
    );
  }, [assigneeFilter, assigneeFilterOptions]);

  const currentUserMember = useMemo(() => {
    if (!user?.id) return null;
    return (
      assigneeFilterOptions.find((member) => member.user_id === user.id) ?? null
    );
  }, [assigneeFilterOptions, user?.id]);

  const assigneeFilterLabel = useMemo(() => {
    if (assigneeFilter === "all") return "All assignees";
    if (assigneeFilter === "me") return "Assigned to me";
    if (assigneeFilter === "unassigned") return "Unassigned";
    return (
      selectedAssigneeMember?.user?.display_name ||
      selectedAssigneeMember?.user?.email ||
      "Assigned member"
    );
  }, [assigneeFilter, selectedAssigneeMember]);

  const allExpanded = filteredEpics.every((e) => expandedEpics.has(e.id));
  const toggleAll = useCallback(() => {
    if (allExpanded) {
      setExpandedEpics(new Set());
      setExpandedFeatures(new Set());
    } else {
      setExpandedEpics(new Set(filteredEpics.map((e) => e.id)));
      setExpandedFeatures(
        new Set(
          filteredEpics.flatMap((e) => (e.features ?? []).map((f) => f.id)),
        ),
      );
    }
  }, [allExpanded, filteredEpics]);

  const updateScrollControls = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) {
      setCanScrollUp(false);
      setCanScrollDown(false);
      return;
    }

    const threshold = 4;
    const isAtTop = el.scrollTop <= threshold;
    const isAtBottom =
      el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;

    setCanScrollUp(!isAtTop);
    setCanScrollDown(!isAtBottom);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleScroll = () => updateScrollControls();

    updateScrollControls();
    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [updateScrollControls]);

  useEffect(() => {
    updateScrollControls();
  }, [
    updateScrollControls,
    filteredEpics,
    expandedEpics,
    expandedFeatures,
    isLoading,
    error,
    roadmapId,
  ]);

  const scrollToTop = useCallback(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

  // â”€â”€ Summary stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const totalFeatures = epics.reduce(
    (acc, e) => acc + (e.features?.length ?? 0),
    0,
  );
  const totalTasks = epics.reduce(
    (acc, e) =>
      acc + (e.features ?? []).reduce((a, f) => a + (f.tasks?.length ?? 0), 0),
    0,
  );
  const doneTasks = epics.reduce(
    (acc, e) =>
      acc +
      (e.features ?? []).reduce(
        (a, f) => a + (f.tasks?.filter((t) => t.status === "done").length ?? 0),
        0,
      ),
    0,
  );

  // â”€â”€ Find parent epic of an editing feature (for epicTitle prop) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const editingFeatureEpicTitle = useMemo(() => {
    if (!editingFeature) return undefined;
    return epics.find((e) =>
      (e.features ?? []).some((f) => f.id === editingFeature.id),
    )?.title;
  }, [editingFeature, epics]);

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="relative flex flex-col h-full min-h-0 bg-gray-50/30">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 bg-white border-b border-gray-100 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#ff9933]/10 flex items-center justify-center shrink-0">
              <ListChecks className="w-6 h-6 text-[#ff9933]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                Work Items
              </h1>
              <p className="text-xs text-gray-400">
                Epics, features and tasks from the project roadmap
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="hidden sm:flex items-center gap-2 shrink-0 animate-pulse">
              <div className="h-8 w-20 rounded-full bg-gray-100 border border-gray-200" />
              <div className="h-8 w-24 rounded-full bg-gray-100 border border-gray-200" />
              <div className="h-8 w-24 rounded-full bg-gray-100 border border-gray-200" />
            </div>
          ) : (
            epics.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <Pill
                  label={`${epics.length} epic${epics.length !== 1 ? "s" : ""}`}
                  color="orange"
                />
                <Pill
                  label={`${totalFeatures} feature${totalFeatures !== 1 ? "s" : ""}`}
                  color="blue"
                />
                <Pill label={`${doneTasks}/${totalTasks} done`} color="green" />
              </div>
            )
          )}
        </div>

        {isLoading ? (
          <div className="mt-4 flex items-center gap-2.5 flex-wrap animate-pulse">
            <div className="flex-1 min-w-[180px] max-w-xs h-10 bg-gray-100 border border-gray-200 rounded-lg" />
            <div className="h-10 w-[150px] bg-gray-100 border border-gray-200 rounded-lg" />
            <div className="h-10 w-[210px] bg-gray-100 border border-gray-200 rounded-lg" />
            <div className="h-10 w-[140px] bg-gray-100 border border-gray-200 rounded-lg" />
          </div>
        ) : (
          epics.length > 0 && (
            <div className="mt-4 flex items-center gap-2.5 flex-wrap">
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search work items..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff9933]/25 focus:border-[#ff9933]/50 placeholder:text-gray-400"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff9933]/25 text-gray-700 cursor-pointer"
              >
                <option value="">All statuses</option>
                <optgroup label="Epic">
                  {Object.entries(EPIC_STATUS_MAP).map(([k, v]) => (
                    <option key={`epic-${k}`} value={k}>
                      {v.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Feature">
                  {Object.entries(FEATURE_STATUS_MAP).map(([k, v]) => (
                    <option key={`feat-${k}`} value={k}>
                      {v.label}
                    </option>
                  ))}
                </optgroup>
              </select>

              <div className="relative">
                <button
                  ref={assigneeFilterButtonRef}
                  type="button"
                  onClick={() => setIsAssigneeFilterMenuOpen((prev) => !prev)}
                  className="min-w-[180px] text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 cursor-pointer flex items-center justify-between gap-3 hover:bg-gray-100 transition-colors"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    {assigneeFilter === "all" ? (
                      <AllAssigneesAvatar members={assigneeFilterOptions} />
                    ) : assigneeFilter === "unassigned" ? (
                      <span className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                        <Users className="w-3.5 h-3.5" />
                      </span>
                    ) : assigneeFilter === "me" ? (
                      <Avatar
                        name={
                          currentUserMember?.user?.display_name ??
                          currentUserMember?.user?.email ??
                          user?.email ??
                          "Me"
                        }
                        avatarUrl={currentUserMember?.user?.avatar_url}
                      />
                    ) : selectedAssigneeMember?.user?.avatar_url ? (
                      <Avatar
                        name={
                          selectedAssigneeMember.user.display_name ??
                          selectedAssigneeMember.user.email
                        }
                        avatarUrl={selectedAssigneeMember.user.avatar_url}
                      />
                    ) : selectedAssigneeMember ? (
                      <Avatar
                        name={
                          selectedAssigneeMember.user?.display_name ??
                          selectedAssigneeMember.user?.email ??
                          "Member"
                        }
                        avatarUrl={selectedAssigneeMember.user?.avatar_url}
                      />
                    ) : null}
                    <span className="truncate">{assigneeFilterLabel}</span>
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                </button>

                {isAssigneeFilterMenuOpen && (
                  <div
                    ref={assigneeFilterMenuRef}
                    className="absolute right-0 mt-1 w-64 rounded-lg border border-gray-200 bg-white shadow-lg z-40 py-1"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setAssigneeFilter("me");
                        setIsAssigneeFilterMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${assigneeFilter === "me" ? "bg-gray-50 font-medium" : ""}`}
                    >
                      <span className="flex items-center gap-2">
                        <Avatar
                          name={
                            currentUserMember?.user?.display_name ??
                            currentUserMember?.user?.email ??
                            user?.email ??
                            "Me"
                          }
                          avatarUrl={currentUserMember?.user?.avatar_url}
                        />
                        Assigned to me
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAssigneeFilter("all");
                        setIsAssigneeFilterMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${assigneeFilter === "all" ? "bg-gray-50 font-medium" : ""}`}
                    >
                      <span className="flex items-center gap-2">
                        <AllAssigneesAvatar members={assigneeFilterOptions} />
                        All assignees
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAssigneeFilter("unassigned");
                        setIsAssigneeFilterMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${assigneeFilter === "unassigned" ? "bg-gray-50 font-medium" : ""}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                          <Users className="w-3.5 h-3.5" />
                        </span>
                        Unassigned
                      </span>
                    </button>

                    {assigneeFilterMemberOptions.length > 0 && (
                      <div className="mt-1 pt-1 border-t border-gray-100">
                        {assigneeFilterMemberOptions.map((member) => {
                          const memberUserId = member.user_id!;
                          const isSelected = assigneeFilter === memberUserId;
                          const memberName =
                            member.user?.display_name ||
                            member.user?.email ||
                            "Project member";

                          return (
                            <button
                              key={memberUserId}
                              type="button"
                              onClick={() => {
                                setAssigneeFilter(memberUserId);
                                setIsAssigneeFilterMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${isSelected ? "bg-gray-50 font-medium" : ""}`}
                            >
                              <span className="flex items-center gap-2">
                                <Avatar
                                  name={memberName}
                                  avatarUrl={member.user?.avatar_url}
                                />
                                <span className="truncate">{memberName}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={toggleAll}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                {allExpanded ? (
                  <>
                    <ChevronsDownUp className="w-5 h-5" /> Collapse all
                  </>
                ) : (
                  <>
                    <ChevronsUpDown className="w-5 h-5" /> Expand all
                  </>
                )}
              </button>
            </div>
          )
        )}
      </div>

      {/* Body */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto px-6 py-5">
        {isLoading ? (
          <WorkItemsLoadingSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-28 gap-3 text-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-sm font-medium text-gray-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-[#ff9933] underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        ) : !roadmapId ? (
          <NoRoadmapEmptyState projectId={projectId} />
        ) : filteredEpics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <Search className="w-8 h-8 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">
              No work items match your filters
            </p>
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setAssigneeFilter("me");
              }}
              className="text-xs text-[#ff9933] underline underline-offset-2"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Column header */}
            <div className="flex items-center bg-white rounded-xl border border-gray-100 shadow-sm px-0 overflow-hidden">
              <div className={COL.chevron} />
              <div className={`${COL.name} py-2 pr-4`}>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  Item Name
                </span>
              </div>
              <div className={`${COL.assignee} text-center`}>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  Assignee
                </span>
              </div>
              <div className={COL.status}>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  Status
                </span>
              </div>
              <div className={`${COL.date} hidden lg:block`}>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  Date Range
                </span>
              </div>
              <div className={`${COL.progress} hidden xl:block pr-4`}>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  Progress
                </span>
              </div>
            </div>

            {/* One card per epic */}
            {filteredEpics.map((epic) => (
              <EpicCard
                key={epic.id}
                epic={epic}
                isExpanded={expandedEpics.has(epic.id)}
                onToggleExpand={() => toggleEpic(epic.id)}
                search={search}
                statusFilter={statusFilter}
                assigneeFilter={assigneeFilter}
                currentUserId={user?.id}
                expandedFeatures={expandedFeatures}
                onToggleFeature={toggleFeature}
                onOpenEpic={setEditingEpic}
                onOpenFeature={setEditingFeature}
                onOpenTask={setSelectedTask}
                onToggleTaskComplete={handleTaskToggleComplete}
                onUpdateTaskStatus={handleTaskStatusChange}
                isSaving={isSaving}
              />
            ))}
          </div>
        )}
      </div>

      {(canScrollUp || canScrollDown) && (
        <div className="fixed right-5 bottom-5 z-50 flex flex-col gap-1.5">
          <div className="h-7 w-7">
            {canScrollUp && (
              <button
                type="button"
                onClick={scrollToTop}
                aria-label="Scroll to top"
                className="h-7 w-7 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors flex items-center justify-center"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="h-7 w-7">
            {canScrollDown && (
              <button
                type="button"
                onClick={scrollToBottom}
                aria-label="Scroll to bottom"
                className="h-7 w-7 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors flex items-center justify-center"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* â”€â”€ Epic edit modal â”€â”€ */}
      <AddEpicModal
        isOpen={!!editingEpic}
        titleText="Edit Epic"
        submitLabel="Save Changes"
        initialData={
          editingEpic
            ? {
                id: editingEpic.id,
                title: editingEpic.title,
                description: editingEpic.description ?? "",
                priority: editingEpic.priority,
                tags: editingEpic.tags ?? [],
                start_date: editingEpic.start_date,
                end_date: editingEpic.end_date,
                features: editingEpic.features ?? [],
              }
            : undefined
        }
        onClose={() => setEditingEpic(null)}
        onSubmit={handleEpicSave}
        isLoading={isSaving}
      />

      {/* â”€â”€ Feature edit modal â”€â”€ */}
      <AddFeatureModal
        isOpen={!!editingFeature}
        titleText="Edit Feature"
        submitLabel="Save Changes"
        epicTitle={editingFeatureEpicTitle}
        initialData={editingFeature ?? undefined}
        onClose={() => setEditingFeature(null)}
        onSubmit={handleFeatureSave}
        isLoading={isSaving}
      />

      {/* â”€â”€ Task side panel â”€â”€ */}
      <SidePanel
        task={selectedTask}
        isOpen={!!selectedTask}
        projectId={projectId}
        onClose={() => setSelectedTask(null)}
        onUpdateTask={(task) =>
          handleTaskUpdate(task, { closePanelOnSuccess: true })
        }
        onDeleteTask={handleTaskDelete}
        projectMembers={projectMembers}
        isLoading={isSaving}
      />
    </div>
  );
}
