import { useState, useEffect, useRef, type FormEvent } from "react";
import { Plus, Edit2, ChevronDown, ChevronUp } from "lucide-react";
import type {
  FeatureStatus,
  RoadmapFeature,
  RoadmapTask,
} from "@/types/roadmap";
import { useUser } from "@/auth";
import { RoadmapModalLayout } from "./RoadmapModalLayout";
import { RichTextEditor } from "@/components/common/RichTextEditor";

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
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);

  // Populate form from initialData when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title ?? "");
      setDescription(initialData?.description ?? "");
      setStatus(initialData?.status ?? "not_started");
      setIsDeliverable(initialData?.is_deliverable ?? false);
      setIsEditingDescription(false);
      setIsExpanded(false);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    // Check if content needs "Show more" button after render
    const checkHeight = () => {
      if (descriptionRef.current && description && !isEditingDescription) {
        const needsShowMore = descriptionRef.current.scrollHeight > 192; // 192px = max-h-48
        setShowReadMore(needsShowMore);
      } else {
        setShowReadMore(false);
      }
    };

    // Use setTimeout to ensure DOM has updated
    const timer = setTimeout(checkHeight, 100);
    return () => clearTimeout(timer);
  }, [description, isEditingDescription, isOpen]);

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
      {/* Status and Deliverable Row */}
      <div className="flex gap-6 mb-6">
        {/* Status */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Status</h3>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as FeatureStatus)}
            className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          >
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        {/* Is Deliverable */}
        <div className="w-48">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Deliverable</h3>
          <label className="flex items-center gap-2 cursor-pointer h-[42px]">
            <input
              type="checkbox"
              checked={isDeliverable}
              onChange={(e) => setIsDeliverable(e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-sm text-gray-700">
              Milestone progress
            </span>
          </label>
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">
            Description
          </h3>
          {!isEditingDescription && description && (
            <button
              type="button"
              onClick={() => setIsEditingDescription(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
        </div>

        {isEditingDescription ? (
          <div className="space-y-2">
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Add a more detailed description..."
              tools={[
                "textFormat",
                "bold",
                "italic",
                "more",
                "separator",
                "bulletList",
                "numberedList",
                "separator",
                "link",
                "image",
              ]}
              minHeight="100px"
              maxHeight="none"
              autoFocus
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsEditingDescription(false)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : description ? (
          <div className="relative">
            <div
              ref={descriptionRef}
              className={`relative text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none overflow-hidden transition-[max-height] duration-300 ease-in-out ${
                isExpanded ? "max-h-[2000px]" : "max-h-48"
              }`}
            >
              <div dangerouslySetInnerHTML={{ __html: description }} />
              
              {/* Gradient Overlay when collapsed */}
              {!isExpanded && showReadMore && (
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-linear-to-t from-white to-transparent pointer-events-none" />
              )}
            </div>

            {/* Show More / Less Button */}
            {showReadMore && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                {isExpanded ? (
                  <>
                    Show less <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    Show more <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingDescription(true)}
            className="w-full px-3 py-2 text-sm text-gray-500 border border-gray-300 border-dashed rounded-md hover:border-gray-400 hover:bg-gray-50 transition-colors text-left"
          >
            Add a description...
          </button>
        )}
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
