import { memo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, Trash2, ChevronDown } from "lucide-react";
import type { RoadmapTask, TaskStatus } from "@/types/roadmap";

interface TaskListItemProps {
  task: RoadmapTask;
  onDelete?: (taskId: string) => void;
  onClick?: (task: RoadmapTask) => void;
  onToggleComplete?: (taskId: string) => void;
  onUpdateStatus?: (taskId: string, status: TaskStatus) => void;
  density?: "normal" | "compact";
}

const STATUS_OPTIONS: TaskStatus[] = [
  "todo",
  "in_progress",
  "in_review",
  "done",
  "blocked",
];

const getStatusColor = (status: RoadmapTask["status"]) => {
  switch (status) {
    case "done":
      return "bg-green-100 text-green-800";
    case "in_progress":
      return "bg-blue-100 text-blue-800";
    case "in_review":
      return "bg-purple-100 text-purple-800";
    case "blocked":
      return "bg-red-100 text-red-800";
    case "todo":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getCategoryLabel = (task: RoadmapTask): string | null => {
  // Use labels or assignee to determine category
  if (task.labels && task.labels.length > 0) {
    return task.labels[0].toUpperCase();
  }
  return null;
};

export const TaskListItem = memo(
  ({
    task,
    onDelete,
    onClick,
    onToggleComplete,
    onUpdateStatus,
    density = "normal",
  }: TaskListItemProps) => {
    const isCompleted = task.status === "done";
    const categoryLabel = getCategoryLabel(task);
    const isCompact = density === "compact";
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const statusDropdownRef = useRef<HTMLDivElement>(null);
    const dropdownMenuRef = useRef<HTMLDivElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState({
      top: 0,
      left: 0,
    });

    const updateDropdownPosition = () => {
      if (!statusDropdownRef.current) return;
      const rect = statusDropdownRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.right - 160,
      });
    };

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        const isInTrigger = statusDropdownRef.current?.contains(target);
        const isInMenu = dropdownMenuRef.current?.contains(target);
        if (!isInTrigger && !isInMenu) setIsStatusOpen(false);
      };

      if (isStatusOpen) {
        updateDropdownPosition();
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }
    }, [isStatusOpen]);

    // Reposition dropdown on scroll
    useEffect(() => {
      if (!isStatusOpen) return;

      const handleReposition = () => {
        updateDropdownPosition();
      };

      window.addEventListener("scroll", handleReposition, true);
      window.addEventListener("resize", handleReposition);
      return () => {
        window.removeEventListener("scroll", handleReposition, true);
        window.removeEventListener("resize", handleReposition);
      };
    }, [isStatusOpen]);

    return (
      <div
        className={`flex items-center transition-colors border border-transparent hover:border-gray-200 group ${
          isCompact ? "gap-2 px-0 py-0" : "gap-3 px-4 py-3"
        } hover:bg-gray-50`}
        onClick={() => onClick?.(task)}
      >
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete?.(task.id);
          }}
          className={`flex-shrink-0 rounded border-2 flex items-center justify-center transition-all ${
            isCompact ? "w-4 h-4" : "w-5 h-5"
          } ${
            isCompleted
              ? "bg-gray-300 border-gray-300 hover:bg-gray-400"
              : "border-gray-300 hover:border-gray-400"
          }`}
          title={isCompleted ? "Mark as incomplete" : "Mark as complete"}
        >
          {isCompleted && (
            <Check
              className={
                isCompact ? "w-2.5 h-2.5 text-white" : "w-3 h-3 text-white"
              }
            />
          )}
        </button>

        {/* Task Title */}
        <div className="flex-1 min-w-0">
          <p
            className={`truncate ${
              isCompact ? "text-xs" : "text-sm"
            } font-medium ${
              isCompleted ? "text-gray-400 line-through" : "text-gray-900"
            }`}
          >
            {task.title}
          </p>
        </div>

        {/* Category/Assignee Badge */}
        {categoryLabel && (
          <span
            className={`flex-shrink-0 rounded font-semibold bg-gray-200 text-gray-700 ${
              isCompact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
            }`}
          >
            {categoryLabel}
          </span>
        )}

        {/* Status Dropdown */}
        <div className="relative flex-shrink-0" ref={statusDropdownRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsStatusOpen(!isStatusOpen);
            }}
            className={`inline-flex items-center gap-1 font-medium rounded transition-colors ${
              isCompact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
            } ${getStatusColor(task.status)} hover:opacity-80 cursor-pointer`}
          >
            {task.status.replace(/_/g, " ")}
            <ChevronDown className={isCompact ? "w-2.5 h-2.5" : "w-3 h-3"} />
          </button>

          {/* Dropdown Menu - Rendered via Portal */}
          {isStatusOpen &&
            statusDropdownRef.current &&
            createPortal(
              <div
                ref={dropdownMenuRef}
                className="fixed bg-white border border-gray-300 rounded shadow-lg z-70"
                style={{
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  width: "160px",
                }}
              >
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus?.(task.id, status);
                      setIsStatusOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
                      task.status === status
                        ? "bg-gray-200 text-black font-semibold"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {status.replace(/_/g, " ")}
                  </button>
                ))}
              </div>,
              document.body,
            )}
        </div>

        {/* Actions (shown on hover) */}
        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              className="p-1 hover:bg-red-100 rounded transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          )}
        </div>
      </div>
    );
  },
);

TaskListItem.displayName = "TaskListItem";
