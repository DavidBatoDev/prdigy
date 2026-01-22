import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Download, Settings } from "lucide-react";
import { Button } from "@/ui/button";

interface ProjectHeaderProps {
  projectTitle?: string;
  onEditBrief?: () => void;
  onExport?: () => void;
}

export function ProjectHeader({
  projectTitle = "Untitled Project",
  onEditBrief,
  onExport,
}: ProjectHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="h-20 bg-white border-b border-gray-200 shadow-sm">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left: Logo & Title */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            onClick={() => navigate({ to: "/" })}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            title="Back to home"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {projectTitle}
              </h1>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={onEditBrief}
            variant="outlined"
            colorScheme="primary"
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Edit Brief</span>
            <span className="sm:hidden">Edit</span>
          </Button>
          <Button
            onClick={onExport}
            variant="contained"
            colorScheme="primary"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">Save</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
