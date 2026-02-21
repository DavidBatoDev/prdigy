import { createFileRoute } from "@tanstack/react-router";
import { Clock } from "lucide-react";

export const Route = createFileRoute("/project/$projectId/time")({
  component: TimePage,
});

function TimePage() {
  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-5 h-5 text-[#ff9933]" />
          <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
        </div>
        <p className="text-gray-500 text-sm">
          A chronological log of all actions and updates on this project.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff9933]/10 flex items-center justify-center">
          <Clock className="w-8 h-8 text-[#ff9933]" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">No activity yet</h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Actions you and your team take on this project will appear here —
          like creating work items, updating statuses, and uploading files.
        </p>
      </div>
    </div>
  );
}
