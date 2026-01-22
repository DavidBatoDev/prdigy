import { useEffect, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import type { EpicPriority, RoadmapFeature } from "@/types/roadmap";
import { useUser } from "@/auth";
import { RoadmapModalLayout } from "./RoadmapModalLayout";

interface AddEpicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    priority: EpicPriority;
    tags: string[];
  }) => void;
  onAddFeature?: () => void;
  initialData?: {
    title?: string;
    description?: string;
    priority?: EpicPriority;
    tags?: string[];
    features?: RoadmapFeature[];
  };
  titleText?: string;
  submitLabel?: string;
}

export const AddEpicModal = ({
  isOpen,
  onClose,
  onSubmit,
  onAddFeature,
  initialData,
  titleText: _titleText = "Add Epic",
  submitLabel = "Create Epic",
}: AddEpicModalProps) => {
  const user = useUser();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<EpicPriority>("medium");
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title ?? "");
      setDescription(initialData?.description ?? "");
      setPriority(initialData?.priority ?? "medium");
      setTagsInput(initialData?.tags?.join(", ") ?? "");
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    onSubmit({
      title,
      description,
      priority,
      tags,
    });
  };

  if (!isOpen) return null;

  const tags = tagsInput
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  const body = (
    <>
      {/* Labels */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Labels</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
            >
              {tag}
            </span>
          ))}
          <button
            type="button"
            className="inline-flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            onClick={() => {
              const newTag = prompt("Enter tag name:");
              if (newTag) {
                setTagsInput(tagsInput ? `${tagsInput}, ${newTag}` : newTag);
              }
            }}
          >
            Add tag
          </button>
        </div>
      </div>

      {/* Priority */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Priority</h3>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as EpicPriority)}
          className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white"
        >
          <option value="nice_to_have">Nice to Have</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
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

  const features = initialData?.features ?? [];

  const getFeatureStatusColor = (status?: string) => {
    const colorMap: Record<string, string> = {
      not_started: "bg-gray-100 text-gray-800",
      in_progress: "bg-blue-100 text-blue-800",
      in_review: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      blocked: "bg-red-100 text-red-800",
    };
    return colorMap[status ?? ""] || "bg-gray-100 text-gray-800";
  };

  const getTaskStatusColor = (status?: string) => {
    const colorMap: Record<string, string> = {
      todo: "bg-gray-100 text-gray-800",
      in_progress: "bg-blue-100 text-blue-800",
      in_review: "bg-purple-100 text-purple-800",
      done: "bg-green-100 text-green-800",
      blocked: "bg-red-100 text-red-800",
    };
    return colorMap[status ?? ""] || "bg-gray-100 text-gray-800";
  };

  const rightPanelTabs = [
    {
      id: "features",
      label: "Features",
      content: (
        <div className="space-y-3">
          {/* Features List */}
          {features.length ? (
            <div className="space-y-2">
              {features.map((feature) => (
                <div key={feature.id ?? feature.title}>
                  {/* Feature */}
                  <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">
                        {feature.title}
                      </p>
                      <span
                        className={`text-xs px-2 py-1 rounded-md font-medium ${getFeatureStatusColor(feature.status)}`}
                      >
                        {feature.status?.replace("_", " ") ?? ""}
                      </span>
                    </div>
                    {feature.description ? (
                      <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                        {feature.description}
                      </p>
                    ) : null}
                  </div>

                  {/* Tasks (indented) */}
                  {feature.tasks && feature.tasks.length > 0 && (
                    <div className="ml-3 mt-2 space-y-2 border-l-2 border-gray-200 pl-3">
                      {feature.tasks.map((task) => (
                        <div
                          key={task.id ?? task.title}
                          className="rounded-md border border-gray-100 bg-gray-50 px-2 py-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-700">
                              {task.title}
                            </p>
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded font-medium ${getTaskStatusColor(task.status)}`}
                            >
                              {task.status?.replace("_", " ") ?? ""}
                            </span>
                          </div>
                          {task.description ? (
                            <p className="mt-0.5 text-gray-600 line-clamp-1">
                              {task.description}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-600">No features yet.</p>
              <p className="text-xs text-gray-500">
                Add features to see them here.
              </p>
            </div>
          )}

          {/* Add Feature Button */}
          <button
            type="button"
            onClick={onAddFeature}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium text-sm transition-colors mt-4"
          >
            <Plus className="w-4 h-4" />
            Add Feature
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
      titlePlaceholder="Epic title"
      onSubmit={handleSubmit}
      body={body}
      footer={footer}
      canComment={Boolean(user)}
      rightPanelTabs={rightPanelTabs}
      defaultRightPanelTabId="features"
    />
  );
};
