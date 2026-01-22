import { memo, useEffect, useRef, useState } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import {
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  List,
} from "lucide-react";
import type { RoadmapFeature } from "@/types/roadmap";

export interface FeatureWidgetData extends Record<string, unknown> {
  feature: RoadmapFeature;
  showTaskCount?: boolean; // If true, show task count; if false, show full tasks
  onEdit?: (feature: RoadmapFeature) => void;
  onDelete?: (featureId: string) => void;
  onClick?: (feature: RoadmapFeature) => void;
}

type FeatureWidgetNode = Node<FeatureWidgetData>;

export const FeatureWidget = memo(({ data }: NodeProps<FeatureWidgetNode>) => {
  const { feature, showTaskCount = true, onEdit, onDelete, onClick } = data;
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  const getStatusColor = (status: RoadmapFeature["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-300";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "in_review":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "blocked":
        return "bg-red-100 text-red-800 border-red-300";
      case "not_started":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: RoadmapFeature["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-3 h-3" />;
      case "in_progress":
        return <Clock className="w-3 h-3" />;
      case "blocked":
        return <AlertCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const taskCount = feature.tasks?.length || 0;
  const completedTasks =
    feature.tasks?.filter((t) => t.status === "done").length || 0;

  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    setHasOverflow(el.scrollHeight > el.clientHeight + 1);
  }, [feature.description]);

  return (
    <motion.div
      className="relative bg-white border-2 border-amber-300 rounded-4xl shadow-md hover:shadow-lg transition-all w-[500px] max-h-[320px] flex flex-col cursor-pointer hover:border-amber-400"
      onClick={() => onClick?.(feature)}
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {/* Deliverable indicator */}
      {feature.is_deliverable && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow">
          ★
        </div>
      )}

      {/* Handles for connecting */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-amber-400 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-amber-400 border-2 border-white"
      />

      <div className="p-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1"></div>
            <h4 className="font-semibold text-gray-900 text-sm leading-tight break-words">
              {feature.title}
            </h4>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(feature);
                }}
                className="p-1 hover:bg-amber-100 rounded transition-colors"
                title="Edit feature"
              >
                <Edit2 className="w-3 h-3 text-gray-600" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(feature.id);
                }}
                className="p-1 hover:bg-red-100 rounded transition-colors"
                title="Delete feature"
              >
                <Trash2 className="w-3 h-3 text-red-600" />
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        {feature.description && (
          <div className="relative mb-2">
            <p
              ref={descriptionRef}
              className="text-xs text-gray-600 max-h-[88px] overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {feature.description}
            </p>
            {hasOverflow && (
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-white/0" />
            )}
          </div>
        )}

        {/* Status Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border ${getStatusColor(feature.status)}`}
          >
            {getStatusIcon(feature.status)}
            {feature.status.replace(/_/g, " ")}
          </span>
        </div>

        {/* Progress Bar */}
        {feature.progress !== undefined && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span className="font-medium">
                {Math.round(feature.progress)}%
              </span>
            </div>
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${feature.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Task count or indicator */}
        {showTaskCount && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-gray-600">
              <List className="w-3 h-3" />
              <span>
                {taskCount} task{taskCount !== 1 ? "s" : ""}
              </span>
            </div>
            {taskCount > 0 && (
              <span className="text-gray-500">
                {completedTasks}/{taskCount} done
              </span>
            )}
          </div>
        )}

        {/* Estimated hours */}
        {feature.estimated_hours && (
          <div className="mt-2 text-xs text-gray-500 text-right">
            ~{feature.estimated_hours}h
          </div>
        )}
      </div>
    </motion.div>
  );
});

FeatureWidget.displayName = "FeatureWidget";
