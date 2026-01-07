import { Reorder } from "framer-motion";
import { MilestoneCard, type Milestone } from "./MilestoneCard";
import { Plus, Download, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/ui/button";

interface RoadmapCanvasProps {
  milestones: Milestone[];
  onReorder: (milestones: Milestone[]) => void;
  onUpdateMilestone: (milestone: Milestone) => void;
  onDeleteMilestone: (id: string) => void;
  onAddMilestone: () => void;
  projectTitle: string;
  estimatedBudget?: string;
  estimatedTimeline?: string;
}

export function RoadmapCanvas({
  milestones,
  onReorder,
  onUpdateMilestone,
  onDeleteMilestone,
  onAddMilestone,
  projectTitle,
  estimatedBudget,
  estimatedTimeline,
}: RoadmapCanvasProps) {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {projectTitle || "Project Roadmap"}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {estimatedTimeline && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{estimatedTimeline}</span>
                </div>
              )}
              {estimatedBudget && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  <span>{estimatedBudget}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <span className="font-medium">{milestones.length}</span>{" "}
                milestones
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6">
        {milestones.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-4">No milestones yet</p>
            <Button
              onClick={onAddMilestone}
              variant="contained"
              colorScheme="primary"
              className="flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add First Milestone
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Reorder.Group
              axis="y"
              values={milestones}
              onReorder={onReorder}
              className="space-y-3 pl-6"
            >
              {milestones.map((milestone, index) => (
                <div key={milestone.id} className="relative">
                  {/* Step Number */}
                  <div className="absolute -left-8 top-4 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {index + 1}
                  </div>

                  <MilestoneCard
                    milestone={milestone}
                    onUpdate={onUpdateMilestone}
                    onDelete={onDeleteMilestone}
                  />

                  {/* Connection Line */}
                  {index < milestones.length - 1 && (
                    <div className="absolute -left-4 top-14 w-0.5 h-6 bg-gray-300" />
                  )}
                </div>
              ))}
            </Reorder.Group>

            <button
              onClick={onAddMilestone}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Milestone
            </button>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex gap-6">
            <div>
              <span className="text-gray-600">Total Milestones:</span>
              <span className="ml-2 font-semibold text-gray-900">
                {milestones.length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Completed:</span>
              <span className="ml-2 font-semibold text-green-600">
                {milestones.filter((m) => m.status === "completed").length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">In Progress:</span>
              <span className="ml-2 font-semibold text-blue-600">
                {milestones.filter((m) => m.status === "in-progress").length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
