import { useEffect, useRef, useState } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";
import { TaskCard } from "./TaskWidget";
import type { RoadmapEpic, RoadmapFeature, RoadmapTask } from "@/types/roadmap";

interface EpicTabProps {
  epic: RoadmapEpic;
  onUpdateEpic: (epic: RoadmapEpic) => void;
  onUpdateFeature: (feature: RoadmapFeature) => void;
  onDeleteFeature: (featureId: string) => void;
  onUpdateTask: (task: RoadmapTask) => void;
  onDeleteTask: (taskId: string) => void;
  onSelectTask: (task: RoadmapTask) => void;
  onAddTask?: (featureId: string) => void;
}

export const EpicTab = ({
  epic,
  onUpdateEpic,
  onUpdateFeature,
  onDeleteFeature,
  onUpdateTask,
  onDeleteTask,
  onSelectTask,
  onAddTask,
}: EpicTabProps) => {
  const features = epic.features || [];
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [titleDraft, setTitleDraft] = useState(epic.title);
  const [descriptionDraft, setDescriptionDraft] = useState(
    epic.description || "",
  );
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isEditingTitle) {
      setTitleDraft(epic.title);
    }
    if (!isEditingDescription) {
      setDescriptionDraft(epic.description || "");
    }
  }, [
    epic.id,
    epic.title,
    epic.description,
    isEditingTitle,
    isEditingDescription,
  ]);

  useEffect(() => {
    if (!isEditingDescription || !descriptionRef.current) {
      return;
    }
    const element = descriptionRef.current;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [descriptionDraft, isEditingDescription]);

  const handleSaveTitle = () => {
    const nextTitle = titleDraft.trim();
    if (nextTitle && nextTitle !== epic.title) {
      onUpdateEpic({ ...epic, title: nextTitle });
    }
    setIsEditingTitle(false);
  };

  const handleSaveDescription = () => {
    const nextDescription = descriptionDraft.trim();
    if (nextDescription !== (epic.description || "")) {
      onUpdateEpic({ ...epic, description: nextDescription || undefined });
    }
    setIsEditingDescription(false);
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      not_started: "bg-gray-100 text-gray-800",
      in_progress: "bg-blue-100 text-blue-800",
      in_review: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      blocked: "bg-red-100 text-red-800",
      todo: "bg-gray-100 text-gray-800",
      done: "bg-green-100 text-green-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  const getEpicPriorityColor = (priority: string) => {
    const colorMap: Record<string, string> = {
      critical: "bg-red-100 text-red-800",
      high: "bg-amber-100 text-amber-800",
      medium: "bg-blue-100 text-blue-800",
      low: "bg-emerald-100 text-emerald-800",
      nice_to_have: "bg-gray-100 text-gray-700",
    };
    return colorMap[priority] || "bg-gray-100 text-gray-700";
  };

  const getEpicStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      backlog: "bg-gray-100 text-gray-800",
      planned: "bg-sky-100 text-sky-800",
      in_progress: "bg-blue-100 text-blue-800",
      in_review: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      on_hold: "bg-amber-100 text-amber-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden bg-gray-50">
      <div className="p-8">
        {/* Epic Header */}
        <div className="mb-6 flex flex-col gap-6 lg:flex-row">
          <div className="lg:w-[70%]">
            <div className="flex items-start justify-between gap-3 mb-2 group">
              {isEditingTitle ? (
                <input
                  autoFocus
                  value={titleDraft}
                  onChange={(event) => setTitleDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSaveTitle();
                    }
                  }}
                  onBlur={handleSaveTitle}
                  className="w-full text-2xl font-bold text-gray-900 bg-transparent border-none px-0 py-0 leading-normal focus:outline-none focus:ring-0"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {epic.title}
                  </h2>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="p-1.5 rounded hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                    title="Edit epic title"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}
            </div>

            <div className="group/description max-h-96 epic-description-scroll">
              {isEditingDescription ? (
                <textarea
                  ref={descriptionRef}
                  autoFocus
                  value={descriptionDraft}
                  onChange={(event) => setDescriptionDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSaveDescription();
                    }
                  }}
                  onBlur={handleSaveDescription}
                  rows={1}
                  className="w-full text-base text-gray-700 bg-transparent border-none px-0 py-0 leading-relaxed resize-none focus:outline-none focus:ring-0 h-auto min-h-0"
                  placeholder="Add an epic description"
                />
              ) : (
                <div className="flex items-start gap-2">
                  <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {epic.description || "Add an epic description"}
                  </p>
                  <button
                    onClick={() => setIsEditingDescription(true)}
                    className="p-1.5 rounded hover:bg-gray-100 transition-colors mt-0.5 opacity-0 group-hover/description:opacity-100"
                    title="Edit epic description"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-[30%]">
            <div className="flex flex-wrap items-start justify-end gap-2">
              {epic.priority && (
                <span
                  className={`text-xs px-3 py-1 rounded-full font-semibold ${getEpicPriorityColor(epic.priority)}`}
                >
                  Priority: {epic.priority.replace("_", " ")}
                </span>
              )}
              {epic.status && (
                <span
                  className={`text-xs px-3 py-1 rounded-full font-semibold ${getEpicStatusColor(epic.status)}`}
                >
                  Status: {epic.status.replace("_", " ")}
                </span>
              )}
              {epic.tags?.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 rounded-full font-medium bg-gray-100 text-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>

            {typeof epic.progress === "number" && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>
                    {Math.round(Math.max(0, Math.min(100, epic.progress)))}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{
                      width: `${Math.max(0, Math.min(100, epic.progress))}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 space-y-4 text-sm text-gray-600">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  Links
                </h4>
                <p className="text-gray-500">No links added</p>
              </div>
              <div className="h-32 rounded-lg border border-gray-200 bg-white p-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  Attachments
                </h4>
                <p className="text-gray-500">No attachments added</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="space-y-6">
          {features.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500">No features yet</p>
            </div>
          ) : (
            features.map((feature) => (
              <div
                key={feature.id}
                className="bg-white rounded-xl border-2 border-yellow-400 shadow-sm overflow-hidden"
              >
                {/* Feature Row */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {feature.title}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-md font-medium ${getStatusColor(feature.status)}`}
                      >
                        {feature.status?.replace("_", " ")}
                      </span>
                      {feature.is_deliverable && (
                        <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-md font-medium">
                          Deliverable
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onUpdateFeature(feature)}
                        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                        title="Edit feature"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => onDeleteFeature(feature.id)}
                        className="p-1.5 hover:bg-red-100 rounded transition-colors"
                        title="Delete feature"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  {feature.description && (
                    <p className="mt-2 text-sm text-gray-600">
                      {feature.description}
                    </p>
                  )}
                </div>

                {/* Tasks Grid - Horizontal Scroll */}
                <div className="p-4">
                  <div className="overflow-x-auto -mx-4 px-4">
                    <div
                      className="flex gap-4 pb-2"
                      style={{ minWidth: "max-content" }}
                    >
                      {feature.tasks?.map((task) => (
                        <div key={task.id} className="shrink-0">
                          <TaskCard
                            task={task}
                            onEdit={onUpdateTask}
                            onDelete={onDeleteTask}
                            onClick={onSelectTask}
                            selected={false}
                            variant="epic"
                          />
                        </div>
                      ))}

                      {/* Add Task Button */}
                      {onAddTask && (
                        <button
                          onClick={() => onAddTask(feature.id)}
                          className="shrink-0 w-60 h-[180px] border-2 border-dashed border-gray-300 rounded-4xl hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-primary"
                          title="Add task"
                        >
                          <Plus className="w-6 h-6" />
                          <span className="text-sm font-medium">Add Task</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
