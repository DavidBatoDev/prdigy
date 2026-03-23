import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import type { ReactNode } from "react";

type TimeTab = "my_logs" | "team_logs";

interface TimeRouteFrameProps {
  projectId: string;
  activeTab: TimeTab;
  loadingPermissions: boolean;
  showMyLogsTabSkeleton: boolean;
  canShowMyLogsTab: boolean;
  canViewTeamLogs: boolean;
  errorMessage?: string | null;
  children: ReactNode;
}

export function TimeRouteFrame({
  projectId,
  activeTab,
  loadingPermissions,
  showMyLogsTabSkeleton,
  canShowMyLogsTab,
  canViewTeamLogs,
  errorMessage,
  children,
}: TimeRouteFrameProps) {
  return (
    <div className="h-full w-full overflow-y-auto p-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-5 h-5 text-[#ff9933]" />
          <h1 className="text-2xl font-bold text-gray-900">Time</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Track task time logs and manage project member hourly rates.
        </p>
      </div>

      {loadingPermissions ? (
        <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full p-1 mb-5 animate-pulse">
          <div className="h-8 w-24 rounded-full bg-gray-200" />
          <div className="h-8 w-24 rounded-full bg-gray-200" />
        </div>
      ) : (
        <div className="inline-flex items-center gap-1 bg-gray-100 rounded-full p-1 mb-5">
          {showMyLogsTabSkeleton && (
            <div className="h-8 w-24 rounded-full bg-gray-200 animate-pulse" />
          )}
          {canShowMyLogsTab && (
            <Link
              to="/project/$projectId/time/my-logs"
              params={{ projectId }}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === "my_logs"
                  ? "bg-[#ff9933] text-white"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              My Logs
            </Link>
          )}
          {canViewTeamLogs && (
            <Link
              to="/project/$projectId/time/team-logs"
              params={{ projectId }}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === "team_logs"
                  ? "bg-[#ff9933] text-white"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              Team Logs
            </Link>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {children}
    </div>
  );
}
