import { useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { GripVertical, Edit2, Trash2, Check, X } from "lucide-react";

export type Milestone = {
  id: string;
  title: string;
  duration: string;
  deliverables: string[];
  status: "pending" | "in-progress" | "completed";
};

interface MilestoneCardProps {
  milestone: Milestone;
  onUpdate: (milestone: Milestone) => void;
  onDelete: (id: string) => void;
}

export function MilestoneCard({
  milestone,
  onUpdate,
  onDelete,
}: MilestoneCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(milestone.title);
  const [editedDuration, setEditedDuration] = useState(milestone.duration);
  const controls = useDragControls();

  const handleSave = () => {
    onUpdate({
      ...milestone,
      title: editedTitle,
      duration: editedDuration,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(milestone.title);
    setEditedDuration(milestone.duration);
    setIsEditing(false);
  };

  const statusColors = {
    pending: "bg-gray-100 text-gray-600",
    "in-progress": "bg-blue-100 text-blue-600",
    completed: "bg-green-100 text-green-600",
  };

  return (
    <Reorder.Item
      value={milestone}
      dragListener={false}
      dragControls={controls}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div
          onPointerDown={(e) => controls.start(e)}
          className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Milestone title"
              />
              <input
                type="text"
                value={editedDuration}
                onChange={(e) => setEditedDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Duration (e.g., 2 weeks)"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-gray-900">
                  {milestone.title}
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[milestone.status]}`}
                >
                  {milestone.status.replace("-", " ")}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-3">
                <span className="font-medium">Duration:</span>{" "}
                {milestone.duration}
              </p>

              {milestone.deliverables.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-700 mb-1">
                    Deliverables:
                  </p>
                  <ul className="space-y-1">
                    {milestone.deliverables.map((deliverable, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-gray-600 flex items-start gap-1"
                      >
                        <span className="text-primary mt-0.5">•</span>
                        <span>{deliverable}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        {!isEditing && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(milestone.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </Reorder.Item>
  );
}
