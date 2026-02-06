import { memo, useEffect, useRef, useState } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { Edit2, Trash2, Plus, ExternalLink } from "lucide-react";
import type { RoadmapEpic } from "@/types/roadmap";

export interface EpicWidgetData extends Record<string, unknown> {
  epic: RoadmapEpic;
  onEdit?: (epic: RoadmapEpic) => void;
  onDelete?: (epicId: string) => void;
  onAddEpicBelow?: (epicId: string) => void;
  onAddFeature?: (epicId: string) => void;
  onNavigateToTab?: (tabId: string) => void;
}

type EpicWidgetNode = Node<EpicWidgetData>;

export const EpicWidget = memo(({ data }: NodeProps<EpicWidgetNode>) => {
  const {
    epic,
    onEdit,
    onDelete,
    onAddEpicBelow,
    onAddFeature,
    onNavigateToTab,
  } = data;
  const descriptionRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    setHasOverflow(el.scrollHeight > el.clientHeight + 1);
  }, [epic.description]);

  return (
    <motion.div
      className="group relative bg-white border-2 border-gray-300 rounded-4xl shadow-md hover:shadow-lg transition-shadow w-[500px] max-h-[420px] flex flex-col"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {/* Handle at top for connecting from previous epic */}
      <Handle
        type="target"
        position={Position.Top}
        id="epic-top"
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />

      {/* Handle at bottom for connecting to next epic */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="epic-bottom"
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />

      {/* Handle for connecting to features */}
      <Handle
        type="source"
        position={Position.Right}
        id="epic-right"
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />

      {/* Add Feature button (right side) */}
      {onAddFeature && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddFeature(epic.id);
          }}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 transition-all duration-200 ease-out shadow-md z-10 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 cursor-pointer"
          title="Add Feature"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}

      {/* Add Epic Below button (bottom) */}
      {onAddEpicBelow && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddEpicBelow(epic.id);
          }}
          className="cursor-pointer absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 transition-all duration-200 ease-out shadow-md z-10 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 cursor-pointer"
          title="Add Epic Below"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}

      <div className="p-10 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {epic.color && (
                <div
                  className="w-3 h-3 rounded-full border border-gray-300"
                  style={{ backgroundColor: epic.color }}
                />
              )}
            </div>
            <h3 className="font-semibold text-gray-900 text-base leading-tight wrap-break-word">
              {epic.title}
            </h3>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {onNavigateToTab && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateToTab(epic.id);
                }}
                className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                title="Navigate to epic"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(epic);
                }}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Edit epic"
              >
                <Edit2 className="w-3.5 h-3.5 text-gray-600" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(epic.id);
                }}
                className="p-1.5 hover:bg-red-100 rounded transition-colors"
                title="Delete epic"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
              </button>
            )}
          </div>
        </div>

        {/* Description - scrollable with fade at bottom */}
        {epic.description && (
          <div
            ref={descriptionRef}
            className="relative mb-3 grow overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="text-md text-gray-600 whitespace-pre-line leading-relaxed">
              {epic.description}
            </div>
            {hasOverflow && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-white to-white/0" />
            )}
          </div>
        )}

        {/* Tags */}
        {(epic.tags && epic.tags.length > 0) || epic.priority ? (
          <div className="flex flex-wrap items-center gap-2 mb-3 shrink-0">
            {epic.priority && (
              <span className="px-2 py-1 text-xs font-semibold rounded-full border border-purple-100 bg-purple-50 text-purple-700">
                Priority: {epic.priority.replace(/_/g, " ")}
              </span>
            )}
            {epic.tags?.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-100"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        {/* Progress Bar */}
        {epic.progress !== undefined && (
          <div className="mb-3 shrink-0">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span className="font-medium">{Math.round(epic.progress)}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${epic.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Features count */}
        <div className="flex items-center justify-between text-xs text-gray-500 shrink-0">
          <span>
            {epic.features?.length || 0} feature
            {epic.features?.length !== 1 ? "s" : ""}
          </span>
          {epic.estimated_hours && <span>~{epic.estimated_hours}h</span>}
        </div>
      </div>
    </motion.div>
  );
});

EpicWidget.displayName = "EpicWidget";
