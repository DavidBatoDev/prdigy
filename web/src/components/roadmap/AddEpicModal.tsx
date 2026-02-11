import { useEffect, useState, useRef, type FormEvent } from "react";
import { Plus, Edit2, ChevronDown, ChevronUp } from "lucide-react";
import type { EpicPriority, RoadmapFeature } from "@/types/roadmap";
import { useUser } from "@/auth";
import { RoadmapModalLayout } from "./RoadmapModalLayout";
import { RichTextEditor } from "@/components/common/RichTextEditor";
import { LabelSelector } from "@/components/common/LabelSelector";
import type { Label } from "@/types/label";
import { LABEL_COLORS } from "@/types/label";

interface AddEpicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    priority: EpicPriority;
    tags: string[];
    labels?: Label[]; // Add labels field
  }) => void;
  onAddFeature?: () => void;
  initialData?: {
    title?: string;
    description?: string;
    priority?: EpicPriority;
    tags?: string[];
    labels?: Label[]; // Add labels field
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
  const [labels, setLabels] = useState<Label[]>([]);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title ?? "");
      setDescription(initialData?.description ?? "");
      setPriority(initialData?.priority ?? "medium");
      
      // Use labels if available, otherwise convert tags for backward compatibility
      if (initialData?.labels) {
        setLabels(initialData.labels);
      } else if (initialData?.tags) {
        // Convert legacy tags to labels
        const existingLabels: Label[] = initialData.tags.map((tag, idx) => ({
          id: `label-${idx}`,
          name: tag,
          color: LABEL_COLORS[idx % LABEL_COLORS.length],
        }));
        setLabels(existingLabels);
      } else {
        setLabels([]);
      }
      
      // Reset description editing state when modal opens
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
    
    // Submit both labels and tags for backward compatibility
    const tags = labels.map((label) => label.name);

    onSubmit({
      title,
      description,
      priority,
      tags,
      labels, // Include full label objects with colors
    });
  };

  if (!isOpen) return null;

  const body = (
    <>
      {/* Labels and Priority Row */}
      <div className="flex gap-6 mb-6">
        {/* Labels */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Labels</h3>
          <LabelSelector
            selectedLabels={labels}
            onLabelsChange={setLabels}
            availableLabels={[]}
          />
        </div>

        {/* Priority */}
        <div className="w-48">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Priority</h3>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as EpicPriority)}
            className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          >
            <option value="nice_to_have">Nice to Have</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
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
      titlePlaceholder="Title"
      onSubmit={handleSubmit}
      body={body}
      footer={footer}
      canComment={Boolean(user)}
      rightPanelTabs={rightPanelTabs}
      defaultRightPanelTabId="features"
      autoFocusTitle={true}
    />
  );
};
