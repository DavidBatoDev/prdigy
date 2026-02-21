import { Briefcase, Settings, Home, Share2, Download } from "lucide-react";
import { Link } from "@tanstack/react-router";

type ViewingRole = "CLIENT" | "CONSULTANT" | "OWNER" | "VIEWER" | string;

const roleBadgeColor: Record<string, string> = {
  CONSULTANT: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CLIENT: "bg-blue-100 text-blue-700 border-blue-200",
  OWNER: "bg-orange-100 text-orange-700 border-orange-200",
  VIEWER: "bg-gray-100 text-gray-600 border-gray-200",
};

interface ProjectHeaderProps {
  title?: string;
  /** Optional metadata shown as a subtitle row */
  projectId?: string;
  clientName?: string;
  clientId?: string;
  consultantName?: string;
  consultantId?: string;
  /** Right-side: who the current user is viewing as */
  viewingAs?: ViewingRole;
  /** Show "Make this a Project" button */
  showMakeProject?: boolean;
  onMakeProject?: () => void;
  onEditBrief?: () => void;
  onSettings?: () => void;
  onShare?: () => void;
  onExport?: () => void;
}

export function ProjectHeader({
  title,
  projectId,
  clientName,
  clientId,
  consultantName,
  consultantId,
  viewingAs,
  showMakeProject = false,
  onMakeProject,
  onEditBrief,
  onSettings,
  onShare,
  onExport,
}: ProjectHeaderProps) {
  const hasSubtitle = projectId || clientName || consultantName;
  const badgeClass =
    roleBadgeColor[(viewingAs ?? "").toUpperCase()] ??
    roleBadgeColor["VIEWER"];

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10">
      {/* Left: Home + title + subtitle */}
      <div className="flex flex-row items-center gap-3 min-w-0">
        <Link
          to="/dashboard"
          className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-all"
          title="Dashboard"
        >
          <Home className="w-5 h-5" />
        </Link>
        <div className="flex flex-col justify-center min-w-0">
          <h1 className="text-sm font-bold text-gray-900 leading-tight truncate">
            {title || "Untitled Project"}
          </h1>
          {hasSubtitle && (
            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
              {projectId && (
                <span>
                  <span className="font-medium text-gray-700">ID:</span>{" "}
                  {projectId}
                </span>
              )}
              {clientName && (
                <span>
                  <span className="font-medium text-gray-700">Client:</span>{" "}
                  {clientName}
                  {clientId && (
                    <span className="text-gray-400 ml-1">(ID: {clientId})</span>
                  )}
                </span>
              )}
              {consultantName && (
                <span>
                  <span className="font-medium text-gray-700">Consultant:</span>{" "}
                  {consultantName}
                  {consultantId && (
                    <span className="text-gray-400 ml-1">(ID: {consultantId})</span>
                  )}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3 shrink-0">
        {showMakeProject && onMakeProject && (
          <button
            onClick={onMakeProject}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-linear-to-r from-orange-500 to-orange-600 hover:shadow-lg rounded-lg transition-all font-medium"
            title="Convert to Project for Consultant Bidding"
          >
            <Briefcase className="w-4 h-4" />
            Make this a Project
          </button>
        )}

        {onEditBrief && (
          <button
            onClick={onEditBrief}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
            title="Edit Project Brief"
          >
            <Settings className="w-4 h-4" />
            Project Brief
          </button>
        )}

        {onShare && (
          <button
            onClick={onShare}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        )}

        {onExport && (
          <button
            onClick={onExport}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
            title="Export"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        )}

        {viewingAs && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
              Viewing as
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded border uppercase tracking-wide ${badgeClass}`}
            >
              {viewingAs}
            </span>
          </div>
        )}

        {onSettings && (
          <button
            onClick={onSettings}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
