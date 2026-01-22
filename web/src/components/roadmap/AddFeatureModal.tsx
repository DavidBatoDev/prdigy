import { useState, useEffect, type FormEvent } from "react";
import { Plus } from "lucide-react";
import type {
  FeatureStatus,
  RoadmapFeature,
  RoadmapTask,
} from "@/types/roadmap";
import { useUser } from "@/auth";
import { RoadmapModalLayout } from "./RoadmapModalLayout";

interface AddFeatureModalProps {
  isOpen: boolean;
  epicTitle?: string;
  initialData?: RoadmapFeature;
  titleText?: string;
  submitLabel?: string;
  onClose: () => void;
  onAddTask?: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    status: FeatureStatus;
    is_deliverable: boolean;
  }) => void;
}

export const AddFeatureModal = ({
  isOpen,
  epicTitle: _epicTitle,
  initialData,
  titleText: _titleText = "Add Feature",
  submitLabel = "Create Feature",
  onClose,
  onAddTask,
  onSubmit,
}: AddFeatureModalProps) => {
  const user = useUser();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<FeatureStatus>("not_started");
  const [isDeliverable, setIsDeliverable] = useState(false);

  // Populate form from initialData when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title ?? "");
      setDescription(initialData?.description ?? "");
      setStatus(initialData?.status ?? "not_started");
      setIsDeliverable(initialData?.is_deliverable ?? false);
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    onSubmit({
      title,
      description,
      status,
      is_deliverable: isDeliverable,
    });

    // Reset form only if not in edit mode
    if (!initialData) {
      setTitle("");
      setDescription("");
      setStatus("not_started");
      setIsDeliverable(false);
    }
  };

  if (!isOpen) return null;

  const getStatusLabel = (s: FeatureStatus) => {
    const statusMap = {
      not_started: { label: "Not Started", color: "bg-gray-100 text-gray-800" },
      in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800" },
      in_review: { label: "In Review", color: "bg-purple-100 text-purple-800" },
      completed: { label: "Completed", color: "bg-green-100 text-green-800" },
      blocked: { label: "Blocked", color: "bg-red-100 text-red-800" },
    } as const;
    return statusMap[s];
  };

  const body = (
    <>
      {/* Labels */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Labels</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-md text-sm ${getStatusLabel(status).color}`}
          >
            {getStatusLabel(status).label}
          </span>
          {isDeliverable && (
            <span className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-800 rounded-md text-sm">
              Deliverable
            </span>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Status</h3>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as FeatureStatus)}
          className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white"
        >
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="completed">Completed</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {/* Is Deliverable */}
      <div className="mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isDeliverable}
            onChange={(e) => setIsDeliverable(e.target.checked)}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <span className="text-sm text-gray-700">
            Mark as deliverable (counts toward milestone progress)
          </span>
        </label>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Description
        </h3>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a more detailed description..."
          rows={6}
          className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>
    </>
  );

  const footer = (
    <div className="flex justify-end">
      <button
        type="submit"
        disabled={!title.trim()}
        className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitLabel}
      </button>
    </div>
  );

  const tasks: RoadmapTask[] =
    (initialData?.tasks as RoadmapTask[] | undefined) ?? [];

  const rightPanelTabs = [
    {
      id: "tasks",
      label: "Tasks",
      content: (
        <div className="space-y-3">
          {/* Tasks List */}
          {tasks.length ? (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id ?? task.title}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">
                      {task.title}
                    </p>
                    <span className="text-xs text-gray-500 capitalize">
                      {task.status?.replace("_", " ") ?? ""}
                    </span>
                  </div>
                  {task.description ? (
                    <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                      {task.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-600">No tasks yet.</p>
              <p className="text-xs text-gray-500">
                Add tasks to see them here.
              </p>
            </div>
          )}

          {/* Add Task Button */}
          <button
            type="button"
            onClick={onAddTask}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium text-sm transition-colors mt-4"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      ),
    },
    {
      id: "comments",
      label: "Comments",
      content: user ? (
        <textarea
          placeholder="Write a comment..."
          className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          rows={3}
        />
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 mb-2">
            Sign in to leave comments
          </p>
          <p className="text-xs text-gray-400">
            You need to be logged in to participate in discussions
          </p>
        </div>
      ),
    },
  ];

  return (
    <RoadmapModalLayout
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      onTitleChange={setTitle}
      titlePlaceholder="Feature title"
      onSubmit={handleSubmit}
      body={body}
      footer={footer}
      canComment={Boolean(user)}
      rightPanelTabs={rightPanelTabs}
      defaultRightPanelTabId="tasks"
    />
  );
};
