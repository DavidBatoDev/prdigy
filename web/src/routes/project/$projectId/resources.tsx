import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/project/$projectId/resources")({
  component: ResourcesPage,
});

function ResourcesPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-5 h-5 text-[#ff9933]" />
          <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Keep reference links, docs, and learning materials for this project.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff9933]/10 flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-[#ff9933]" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          No resources yet
        </h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Save important resources so the team can access them quickly.
        </p>
      </div>
    </div>
  );
}
