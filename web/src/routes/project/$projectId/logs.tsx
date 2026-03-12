import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";

export const Route = createFileRoute("/project/$projectId/logs")({
  component: ProjectLogsPage,
});

function ProjectLogsPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="w-5 h-5 text-[#ff9933]" />
          <h1 className="text-2xl font-bold text-gray-900">Logs</h1>
        </div>
        <p className="text-gray-500 text-sm">
          View project activity and audit logs.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff9933]/10 flex items-center justify-center">
          <ClipboardList className="w-8 h-8 text-[#ff9933]" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Logs panel coming up
        </h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Project logs and history will appear here.
        </p>
      </div>
    </div>
  );
}
