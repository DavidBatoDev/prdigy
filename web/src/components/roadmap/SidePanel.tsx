import { useState, useEffect } from "react";
import {
  X,
  User,
  Calendar,
  Clock,
  Tag,
  CheckSquare,
  Plus,
  Paperclip,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { RoadmapTask } from "@/types/roadmap";
import { Button } from "@/ui/button";

interface SidePanelProps {
  task: RoadmapTask | null;
  isOpen: boolean;
  isCreating?: boolean;
  onClose: () => void;
  onUpdateTask: (task: RoadmapTask) => void;
  onDeleteTask: (taskId: string) => void;
  onCreateTask?: (taskData: Partial<RoadmapTask>) => void;
}

type TabType = "details" | "comments" | "attachments";

export const SidePanel = ({
  task,
  isOpen,
  isCreating = false,
  onClose,
  onUpdateTask,
  onDeleteTask,
  onCreateTask,
}: SidePanelProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [editedTask, setEditedTask] = useState<RoadmapTask | null>(null);
  const [newTaskData, setNewTaskData] = useState<Partial<RoadmapTask>>({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    labels: [],
  });

  const isCreateMode = isCreating || (!!isOpen && !task);

  // Initialize state when task or isCreating changes
  useEffect(() => {
    if (isCreateMode) {
      setNewTaskData({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        labels: [],
      });
    } else if (task) {
      setEditedTask(task);
    }
  }, [isCreateMode, task]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Esc to close
      if (e.key === "Escape") {
        handleCancel();
      }

      // Ctrl+Enter to save
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isCreateMode, newTaskData, editedTask]);

  const handleSave = () => {
    if (isCreateMode) {
      // Validate title is required
      if (!newTaskData.title?.trim()) {
        alert("Task title is required");
        return;
      }
      if (onCreateTask) {
        onCreateTask(newTaskData);
        setNewTaskData({
          title: "",
          description: "",
          status: "todo",
          priority: "medium",
          labels: [],
        });
      }
      onClose();
    } else {
      // Edit mode
      if (editedTask) {
        if (!editedTask.title?.trim()) {
          alert("Task title is required");
          return;
        }
        onUpdateTask(editedTask);
      }
      onClose();
    }
  };

  const handleCancel = () => {
    if (isCreateMode) {
      setNewTaskData({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        labels: [],
      });
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          onClick={handleCancel}
          className="fixed inset-0 z-40 bg-black/15 cursor-default"
        />
      )}
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed top-0 right-0 bottom-0 w-[560px] bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {isCreateMode ? "Create Task" : "Edit Task"}
            </h2>
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
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
              value={
                isCreateMode ? newTaskData.title : editedTask?.title || ""
              }
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
              className="w-full text-xl font-semibold text-gray-900 border-none focus:outline-none focus:ring-0 px-0"
              autoFocus
            />
          </div>

          {/* Action Buttons Row */}
          <div className="px-6 py-3 border-b border-gray-200 flex items-center gap-2 overflow-x-auto">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 transition-colors text-gray-700"
              title="Add dates"
            >
              <Calendar className="w-4 h-4" />
              <span>Dates</span>
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 transition-colors text-gray-700"
              title="Add checklist"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Checklist</span>
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 transition-colors text-gray-700"
              title="Add members"
            >
              <Users className="w-4 h-4" />
              <span>Members</span>
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 transition-colors text-gray-700"
              title="Add attachment"
            >
              <Paperclip className="w-4 h-4" />
              <span>Attachment</span>
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
              <button
                onClick={() => setActiveTab("attachments")}
                className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === "attachments"
                    ? "text-primary border-primary"
                    : "text-gray-600 hover:text-gray-900 border-transparent"
                }`}
              >
                Attachments
              </button>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {(isCreateMode || activeTab === "details") && (
              <div className="space-y-6">
                {/* Labels */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Labels
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(isCreateMode
                      ? newTaskData.labels
                      : editedTask?.labels
                    )?.map((label, idx) => (
                      <span
                        key={idx}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full font-medium"
                      >
                        {label}
                        <button
                          onClick={() => {
                            if (isCreateMode) {
                              setNewTaskData({
                                ...newTaskData,
                                  labels: newTaskData.labels?.filter(
                                    (_, i) => i !== idx,
                                  ),
                                });
                              } else if (editedTask) {
                                setEditedTask({
                                  ...editedTask,
                                  labels: editedTask.labels?.filter(
                                    (_, i) => i !== idx,
                                  ),
                                });
                              }
                            }}
                            className="hover:bg-blue-200 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                      </span>
                    ))}
                    <button
                      onClick={() => {
                          const newLabel = prompt("Enter label name:");
                          if (newLabel?.trim()) {
                            if (isCreateMode) {
                              setNewTaskData({
                                ...newTaskData,
                                labels: [
                                  ...(newTaskData.labels || []),
                                  newLabel.trim(),
                                ],
                              });
                            } else if (editedTask) {
                              setEditedTask({
                                ...editedTask,
                                labels: [
                                  ...(editedTask.labels || []),
                                  newLabel.trim(),
                                ],
                              });
                            }
                          }
                        }}
                        className="flex items-center gap-1 px-3 py-1 text-sm border-2 border-dashed border-gray-300 text-gray-600 rounded-full hover:border-gray-400 hover:text-gray-800 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Add Label
                      </button>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={
                      isCreateMode
                        ? newTaskData.description
                        : editedTask?.description || ""
                    }
                    onChange={(e) => {
                      if (isCreateMode) {
                        setNewTaskData({
                          ...newTaskData,
                          description: e.target.value,
                        });
                      } else {
                        setEditedTask(
                          editedTask
                            ? { ...editedTask, description: e.target.value }
                            : null,
                        );
                      }
                    }}
                    rows={4}
                    placeholder="Add a more detailed description..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                </div>

                {/* Only show these fields in edit mode, not create mode */}
                {!isCreateMode && editedTask && (
                  <>
                    {/* Assignee */}
                    <div>
                      <label className="flex text-sm font-medium text-gray-700 mb-2 items-center gap-2">
                        <User className="w-4 h-4" />
                        Assignee
                      </label>
                      <div className="flex items-center gap-2">
                        {editedTask.assignee?.avatar_url ? (
                          <img
                            src={editedTask.assignee.avatar_url}
                            alt={editedTask.assignee.display_name}
                            className="w-8 h-8 rounded-full border border-gray-300"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                        )}
                        <span className="text-sm text-gray-900">
                          {editedTask.assignee?.display_name || "Unassigned"}
                        </span>
                      </div>
                    </div>

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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    {/* Estimated Hours */}
                    <div>
                      <label className="flex text-sm font-medium text-gray-700 mb-2 items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Estimated Hours
                      </label>
                      <input
                        type="number"
                        value={editedTask?.estimated_hours || ""}
                        onChange={(e) =>
                          setEditedTask(
                            editedTask
                              ? {
                                  ...editedTask,
                                  estimated_hours: Number(e.target.value),
                                }
                              : null,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    {/* Checklist */}
                    {editedTask.checklist &&
                      editedTask.checklist.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Checklist
                          </label>
                          <div className="space-y-2">
                            {editedTask.checklist.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="checkbox"
                                  checked={item.completed}
                                  onChange={() => {
                                    if (editedTask) {
                                      const newChecklist = [
                                        ...(editedTask.checklist || []),
                                      ];
                                      newChecklist[idx] = {
                                        ...item,
                                        completed: !item.completed,
                                      };
                                      setEditedTask({
                                        ...editedTask,
                                        checklist: newChecklist,
                                      });
                                    }
                                  }}
                                  className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                                />
                                <span
                                  className={`text-sm ${
                                    item.completed
                                      ? "line-through text-gray-500"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {item.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </>
                )}
              </div>
            )}

            {!isCreateMode && activeTab === "comments" && (
              <div className="text-center text-gray-500 py-12">
                <p>Comments feature coming soon</p>
              </div>
            )}

            {!isCreateMode && activeTab === "attachments" && (
              <div className="text-center text-gray-500 py-12">
                <p>Attachments feature coming soon</p>
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
                  className="flex-1"
                >
                  Create Task
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outlined"
                  colorScheme="secondary"
                  size="md"
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
                    className="flex-1"
                  >
                    Save Changes
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
    </AnimatePresence>
  );
};
