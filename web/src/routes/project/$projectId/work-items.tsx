import { createFileRoute } from "@tanstack/react-router";
import { ListChecks } from "lucide-react";

export const Route = createFileRoute("/project/$projectId/work-items")({
  component: WorkItemsPage,
});

function WorkItemsPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <ListChecks className="w-5 h-5 text-[#ff9933]" />
          <h1 className="text-2xl font-bold text-gray-900">Work Items</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Browse epics, features, and tasks from the project roadmap.
        </p>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff9933]/10 flex items-center justify-center">
          <ListChecks className="w-8 h-8 text-[#ff9933]" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          No work items yet
        </h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Add a roadmap to this project to start tracking epics, features, and
          tasks here.
        </p>
      </div>
    </div>
  );
}
