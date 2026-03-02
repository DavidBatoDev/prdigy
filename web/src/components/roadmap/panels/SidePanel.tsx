import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Calendar,
  Tag,
  CheckSquare,
  User,
  Search,
  ChevronDown,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { RoadmapTask } from "@/types/roadmap";
import { projectService, type ProjectMember } from "@/services/project.service";
import { Button } from "@/ui/button";

interface SidePanelProps {
  task: RoadmapTask | null;
  isOpen: boolean;
  isCreating?: boolean;
  onClose: () => void;
  onUpdateTask: (task: RoadmapTask) => void;
  onDeleteTask: (taskId: string) => void;
  onCreateTask?: (taskData: Partial<RoadmapTask>) => void;
  projectId?: string;
  projectMembers?: ProjectMember[];
  isLoading?: boolean;
}

type TabType = "details" | "comments";

export const SidePanel = ({
  task,
  isOpen,
  isCreating = false,
  onClose,
  onUpdateTask,
  onDeleteTask,
  onCreateTask,
  projectId,
  projectMembers = [],
  isLoading = false,
}: SidePanelProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [editedTask, setEditedTask] = useState<RoadmapTask | null>(null);
  const [newTaskData, setNewTaskData] = useState<Partial<RoadmapTask>>({
    title: "",
    status: "todo",
    priority: "medium",
  });
  const [isAssigneeMenuOpen, setIsAssigneeMenuOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [fetchedProjectMembers, setFetchedProjectMembers] = useState<
    ProjectMember[]
  >([]);

  const isCreateMode = isCreating || (!!isOpen && !task);

  // Initialize state when task or isCreating changes
  useEffect(() => {
    if (isCreateMode) {
      setNewTaskData({
        title: "",
        status: "todo",
        priority: "medium",
      });
    } else if (task) {
      setEditedTask(task);
    }
  }, [isCreateMode, task]);

  useEffect(() => {
    if (!isOpen) {
      setIsAssigneeMenuOpen(false);
      setAssigneeSearch("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !projectId) return;

    let cancelled = false;

    const loadProjectMembers = async () => {
      try {
        const members = await projectService.getMembers(projectId);
        if (!cancelled) setFetchedProjectMembers(members);
      } catch {
        if (!cancelled) setFetchedProjectMembers([]);
      }
    };

    loadProjectMembers();

    return () => {
      cancelled = true;
    };
  }, [isOpen, projectId]);

  const assigneeMembers =
    fetchedProjectMembers.length > 0 ? fetchedProjectMembers : projectMembers;

  const currentAssigneeId = isCreateMode
    ? newTaskData.assignee_id
    : editedTask?.assignee_id || editedTask?.assignee?.id;

  const filteredMembers = useMemo(() => {
    const q = assigneeSearch.trim().toLowerCase();
    if (!q) return assigneeMembers;
    return assigneeMembers.filter((member) => {
      const name = member.user?.display_name || "";
      const email = member.user?.email || "";
      const role = member.role || "";
      return (
        name.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        role.toLowerCase().includes(q)
      );
    });
  }, [assigneeSearch, assigneeMembers]);

  const selectedMember = assigneeMembers.find(
    (member) => member.user_id === currentAssigneeId,
  );

  const assignToMember = (member: ProjectMember | null) => {
    const assigneeId = member?.user_id;
    const assignee = member?.user
      ? {
          id: member.user.id,
          display_name: member.user.display_name,
          avatar_url: member.user.avatar_url,
          email: member.user.email,
          first_name: member.user.first_name,
          last_name: member.user.last_name,
        }
      : undefined;

    if (isCreateMode) {
      setNewTaskData((prev) => ({
        ...prev,
        assignee_id: assigneeId,
        assignee,
      }));
    } else {
      setEditedTask((prev) =>
        prev
          ? {
              ...prev,
              assignee_id: assigneeId,
              assignee,
            }
          : prev,
      );
    }
    setIsAssigneeMenuOpen(false);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Esc to close
      if (e.key === "Escape" && !isLoading) {
        handleCancel();
      }

      // Ctrl+Enter to save
      if (e.ctrlKey && e.key === "Enter" && !isLoading) {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isCreateMode, newTaskData, editedTask, isLoading]);

  const handleSave = () => {
    if (isLoading) return;

    if (isCreateMode) {
      // Validate title is required
      if (!newTaskData.title?.trim()) {
        alert("Task title is required");
        return;
      }
      if (onCreateTask) {
        onCreateTask(newTaskData);
      }
    } else {
      // Edit mode
      if (editedTask) {
        if (!editedTask.title?.trim()) {
          alert("Task title is required");
          return;
        }
        onUpdateTask(editedTask);
      }
    }
  };

  const handleCancel = () => {
    if (isLoading) return;

    if (isCreateMode) {
      setNewTaskData({
        title: "",
        status: "todo",
        priority: "medium",
      });
    }
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="sidepanel-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          onClick={handleCancel}
          className="fixed inset-0 z-120 bg-black/15 cursor-default"
        />
      )}
      {isOpen && (
        <motion.div
          key="sidepanel-content"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed top-0 right-0 bottom-0 w-[560px] bg-white border-l border-gray-200 shadow-2xl z-130 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {isCreateMode ? "Create Task" : "Edit Task"}
            </h2>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Close panel (Esc)"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Title Section - Always Editable */}
          <div className="px-6 py-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="Task title..."
              value={isCreateMode ? newTaskData.title : editedTask?.title || ""}
              onChange={(e) => {
                if (isCreateMode) {
                  setNewTaskData({ ...newTaskData, title: e.target.value });
                } else {
                  setEditedTask(
                    editedTask
                      ? { ...editedTask, title: e.target.value }
                      : null,
                  );
                }
              }}
              disabled={isLoading}
              className="w-full text-xl font-semibold text-gray-900 border-none focus:outline-none focus:ring-0 px-0 disabled:opacity-50"
              autoFocus
            />
          </div>

          {/* Action Buttons Row */}
          <div className="px-6 py-3 border-b border-gray-200 flex items-center gap-2 overflow-x-auto">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 transition-colors text-gray-700 disabled:opacity-50"
              title="Add dates"
              disabled={isLoading}
            >
              <Calendar className="w-4 h-4" />
              <span>Dates</span>
            </button>
          </div>

          {/* Tabs - only show in edit mode (not creating) */}
          {!isCreateMode && (
            <div className="flex items-center border-b border-gray-200 px-6">
              <button
                onClick={() => setActiveTab("details")}
                className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === "details"
                    ? "text-primary border-primary"
                    : "text-gray-600 hover:text-gray-900 border-transparent"
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab("comments")}
                className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === "comments"
                    ? "text-primary border-primary"
                    : "text-gray-600 hover:text-gray-900 border-transparent"
                }`}
              >
                Comments
              </button>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {(isCreateMode || activeTab === "details") && (
              <div className="space-y-6">
                {/* Status */}
                <div>
                  <label className="flex text-sm font-medium text-gray-700 mb-2 items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    Status
                  </label>
                  <select
                    value={
                      isCreateMode
                        ? newTaskData.status
                        : editedTask?.status || "todo"
                    }
                    onChange={(e) => {
                      const status = e.target.value as RoadmapTask["status"];
                      if (isCreateMode) {
                        setNewTaskData({ ...newTaskData, status });
                      } else {
                        setEditedTask(
                          editedTask ? { ...editedTask, status } : null,
                        );
                      }
                    }}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:bg-gray-50"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="done">Done</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="flex text-sm font-medium text-gray-700 mb-2 items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Priority
                  </label>
                  <select
                    value={
                      isCreateMode
                        ? newTaskData.priority
                        : editedTask?.priority || "medium"
                    }
                    onChange={(e) => {
                      const priority = e.target
                        .value as RoadmapTask["priority"];
                      if (isCreateMode) {
                        setNewTaskData({ ...newTaskData, priority });
                      } else {
                        setEditedTask(
                          editedTask ? { ...editedTask, priority } : null,
                        );
                      }
                    }}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:bg-gray-50"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* Assignee */}
                <div>
                  <label className="flex text-sm font-medium text-gray-700 mb-2 items-center gap-2">
                    <User className="w-4 h-4" />
                    Assignee
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsAssigneeMenuOpen((prev) => !prev)}
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:bg-gray-50"
                    >
                      <span className="text-sm text-gray-700 truncate">
                        {selectedMember?.user?.display_name ||
                          selectedMember?.user?.email ||
                          "Unassigned"}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    </button>

                    {isAssigneeMenuOpen && (
                      <div className="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg p-2">
                        <div className="relative mb-2">
                          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={assigneeSearch}
                            onChange={(e) => setAssigneeSearch(e.target.value)}
                            placeholder="Search members..."
                            className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => assignToMember(null)}
                          className="w-full px-2 py-2 text-left text-sm rounded-md hover:bg-gray-50 flex items-center justify-between"
                        >
                          <span className="text-gray-700">Unassigned</span>
                          {!currentAssigneeId && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </button>

                        <div className="max-h-44 overflow-y-auto mt-1">
                          {filteredMembers.map((member) => {
                            const isSelected =
                              member.user_id === currentAssigneeId;
                            return (
                              <button
                                key={member.id}
                                type="button"
                                onClick={() => assignToMember(member)}
                                className="w-full px-2 py-2 text-left text-sm rounded-md hover:bg-gray-50 flex items-center justify-between gap-2"
                              >
                                <span className="truncate text-gray-700">
                                  {member.user?.display_name ||
                                    member.user?.email ||
                                    member.user_id}
                                </span>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-primary shrink-0" />
                                )}
                              </button>
                            );
                          })}
                          {filteredMembers.length === 0 && (
                            <p className="px-2 py-2 text-xs text-gray-400">
                              No members found
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Only show these fields in edit mode, not create mode */}
                {!isCreateMode && editedTask && (
                  <>
                    {/* Due Date */}
                    <div>
                      <label className="flex text-sm font-medium text-gray-700 mb-2 items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={editedTask?.due_date || ""}
                        onChange={(e) =>
                          setEditedTask(
                            editedTask
                              ? { ...editedTask, due_date: e.target.value }
                              : null,
                          )
                        }
                        disabled={isLoading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:bg-gray-50"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {!isCreateMode && activeTab === "comments" && (
              <div className="text-center text-gray-500 py-12">
                <p>Comments feature coming soon</p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            {isCreateMode ? (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSave}
                  variant="contained"
                  colorScheme="primary"
                  size="md"
                  className="flex-1 flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {isLoading ? "Creating..." : "Create Task"}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outlined"
                  colorScheme="secondary"
                  size="md"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              activeTab === "details" && (
                <div className="flex items-center gap-2 w-full">
                  <Button
                    onClick={handleSave}
                    variant="contained"
                    colorScheme="primary"
                    size="md"
                    className="flex-1 flex items-center justify-center gap-2"
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    onClick={() => {
                      if (task) {
                        onDeleteTask(task.id);
                        onClose();
                      }
                    }}
                    variant="outlined"
                    colorScheme="destructive"
                    size="md"
                    disabled={isLoading}
                  >
                    Delete
                  </Button>
                </div>
              )
            )}
            <p className="text-xs text-gray-500 mt-2 text-center">
              Press Esc to close • Ctrl+Enter to save
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
