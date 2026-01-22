import type { Roadmap, RoadmapMilestone } from "@/types/roadmap";

interface MilestonesViewProps {
  roadmap: Roadmap;
  milestones: RoadmapMilestone[];
  onUpdateMilestone: (milestone: RoadmapMilestone) => void;
  onDeleteMilestone: (id: string) => void;
}

export const MilestonesView = ({
  roadmap: _roadmap,
  milestones,
  onUpdateMilestone: _onUpdateMilestone,
  onDeleteMilestone: _onDeleteMilestone,
}: MilestonesViewProps) => {
  const getStatusColor = (status: RoadmapMilestone["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-300";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "at_risk":
        return "bg-red-100 text-red-800 border-red-300";
      case "missed":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="w-full h-full bg-gray-50 p-8 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Milestones Timeline
          </h2>
          <p className="text-gray-600">Timeline visualization coming soon</p>
        </div>

        {/* Simple list of milestones */}
        <div className="space-y-4">
          {milestones.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500">No milestones yet</p>
            </div>
          ) : (
            milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {milestone.title}
                      </h3>
                      {milestone.color && (
                        <div
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: milestone.color }}
                        />
                      )}
                    </div>
                    {milestone.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {milestone.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded border ${getStatusColor(
                      milestone.status,
                    )}`}
                  >
                    {milestone.status.replace(/_/g, " ")}
                  </span>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {milestone.target_date && (
                      <span>
                        Target:{" "}
                        {new Date(milestone.target_date).toLocaleDateString()}
                      </span>
                    )}
                    {milestone.progress !== undefined && (
                      <span>{Math.round(milestone.progress)}% complete</span>
                    )}
                    {milestone.linked_features && (
                      <span>
                        {milestone.linked_features.length} feature
                        {milestone.linked_features.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {milestone.progress !== undefined && (
                  <div className="mt-4">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${milestone.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
