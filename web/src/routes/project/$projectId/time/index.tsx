import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useTimeRouteData } from "@/components/project/time/useTimeRouteData";

export const Route = createFileRoute("/project/$projectId/time/")({
  component: TimeIndexPage,
});

function TimeIndexPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const {
    loadingPermissions,
    isResolvingMyLogsAccess,
    canShowMyLogsTab,
    canViewTeamLogs,
  } = useTimeRouteData(projectId, {
    includeOwnRate: true,
  });

  useEffect(() => {
    if (loadingPermissions || isResolvingMyLogsAccess) return;

    if (canShowMyLogsTab) {
      void navigate({
        to: "/project/$projectId/time/my-logs",
        params: { projectId },
        replace: true,
      });
      return;
    }

    if (canViewTeamLogs) {
      void navigate({
        to: "/project/$projectId/time/team-logs",
        params: { projectId },
        replace: true,
      });
      return;
    }

    void navigate({
      to: "/project/$projectId/time/my-logs",
      params: { projectId },
      replace: true,
    });
  }, [
    canShowMyLogsTab,
    canViewTeamLogs,
    isResolvingMyLogsAccess,
    loadingPermissions,
    navigate,
    projectId,
  ]);

  return (
    <div className="h-full w-full flex items-center justify-center p-8">
      <div className="inline-flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin text-[#ff9933]" />
        Loading time page...
      </div>
    </div>
  );
}
