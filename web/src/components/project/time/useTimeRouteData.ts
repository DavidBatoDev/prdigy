import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { projectService } from "@/services/project.service";
import { projectTimeService } from "@/services/project-time.service";
import {
  getErrorMessage,
  isForbiddenError,
  isRateRequiredError,
  projectTimeKeys,
} from "@/queries/project-time";

export const MY_LOGS_PAGE = 1;
export const MY_LOGS_LIMIT = 100;

interface UseTimeRouteDataOptions {
  includeOwnRate?: boolean;
  includeMyLogs?: boolean;
  includeTasks?: boolean;
  includeRates?: boolean;
  includeTeamMembers?: boolean;
}

export function useTimeRouteData(
  projectId: string,
  {
    includeOwnRate = false,
    includeMyLogs = false,
    includeTasks = false,
    includeRates = false,
    includeTeamMembers = false,
  }: UseTimeRouteDataOptions,
) {
  const { user, guestUserId, isLoading: authLoading } = useAuth();
  const actorKey = user?.id ?? guestUserId ?? "anonymous";
  const actorUserId = user?.id ?? guestUserId ?? null;
  const canRunQueries = Boolean(projectId) && !authLoading;

  const permissionsQuery = useQuery({
    queryKey: projectTimeKeys.permissions(projectId, actorKey),
    queryFn: () => projectService.getMyPermissions(projectId),
    enabled: canRunQueries,
    retry: false,
  });

  const permissions = permissionsQuery.data ?? null;
  const canManageRates = permissions?.time?.manage_rates === true;
  const canApproveLogs = permissions?.time?.approve === true;
  const canEditTeamLogs = permissions?.time?.edit_team === true;
  const canViewTeamLogs = canEditTeamLogs || canManageRates || canApproveLogs;
  const canViewTime = permissions?.time?.view === true;

  const ownRateQuery = useQuery({
    queryKey: projectTimeKeys.myRate(projectId, actorKey),
    queryFn: () => projectTimeService.getMyProjectMemberRate(projectId),
    enabled: canRunQueries && canViewTime && includeOwnRate,
    retry: false,
  });

  const myLogsQuery = useQuery({
    queryKey: projectTimeKeys.myLogs(
      projectId,
      actorKey,
      MY_LOGS_PAGE,
      MY_LOGS_LIMIT,
    ),
    queryFn: async () => {
      const result = await projectTimeService.listMyLogs(projectId, {
        page: MY_LOGS_PAGE,
        limit: MY_LOGS_LIMIT,
      });
      return result.items;
    },
    enabled: canRunQueries && canViewTime && includeMyLogs,
    retry: false,
  });

  const projectTasksQuery = useQuery({
    queryKey: projectTimeKeys.tasks(projectId, actorKey),
    queryFn: () => projectTimeService.listProjectTasks(projectId),
    enabled: canRunQueries && (canViewTime || canViewTeamLogs) && includeTasks,
    retry: false,
  });

  const ratesQuery = useQuery({
    queryKey: projectTimeKeys.rates(projectId, actorKey),
    queryFn: () => projectTimeService.listProjectMemberRates(projectId),
    enabled: canRunQueries && canViewTeamLogs && includeRates,
    retry: false,
  });

  const teamMembersQuery = useQuery({
    queryKey: projectTimeKeys.teamMembers(projectId, actorKey),
    queryFn: () => projectService.getMembers(projectId),
    enabled: canRunQueries && canViewTeamLogs && includeTeamMembers,
    retry: false,
  });

  const ownRate = ownRateQuery.data ?? null;
  const myLogs = myLogsQuery.data ?? [];
  const projectTasks = projectTasksQuery.data ?? [];
  const rates = ratesQuery.data ?? [];
  const teamMembers = teamMembersQuery.data ?? [];

  const loadingPermissions = authLoading || permissionsQuery.isPending;
  const loadingOwnRate = ownRateQuery.isPending;
  const loadingMyLogs = myLogsQuery.isPending;
  const loadingProjectTasks = projectTasksQuery.isPending;
  const loadingRates = ratesQuery.isPending;
  const loadingMembers = teamMembersQuery.isPending;

  const myRateForbidden = isForbiddenError(ownRateQuery.error);
  const myLogsForbidden = isForbiddenError(myLogsQuery.error);
  const tasksForbidden = isForbiddenError(projectTasksQuery.error);

  const rateRequiredError =
    isRateRequiredError(ownRateQuery.error) ||
    isRateRequiredError(myLogsQuery.error) ||
    isRateRequiredError(projectTasksQuery.error);

  const isTimeBlocked =
    canViewTime &&
    (rateRequiredError || myRateForbidden || myLogsForbidden || tasksForbidden);

  const isResolvingMyLogsAccess =
    canViewTime &&
    !canManageRates &&
    ((includeOwnRate && loadingOwnRate) ||
      (includeMyLogs && loadingMyLogs) ||
      (includeTasks && loadingProjectTasks));

  const canShowMyLogsTab = useMemo(() => {
    if (!canViewTime) return false;
    if (isResolvingMyLogsAccess) return false;
    return Boolean(ownRate) && !isTimeBlocked;
  }, [canViewTime, isResolvingMyLogsAccess, ownRate, isTimeBlocked]);

  const showMyLogsTabSkeleton =
    canViewTime && isResolvingMyLogsAccess && !canShowMyLogsTab;

  const shouldBlockPage = !canManageRates && isTimeBlocked && !ownRate;
  const shouldShowAccessDenied =
    !loadingPermissions && !permissionsQuery.error && !canViewTime && !canViewTeamLogs;

  const queryErrorMessage = useMemo(() => {
    if (permissionsQuery.error) {
      return getErrorMessage(permissionsQuery.error, "Failed to load permissions.");
    }

    const candidates: Array<{ enabled: boolean; error: unknown; fallback: string }> = [
      {
        enabled: includeOwnRate,
        error: ownRateQuery.error,
        fallback: "Failed to load your time rate.",
      },
      {
        enabled: includeMyLogs,
        error: myLogsQuery.error,
        fallback: "Failed to load your logs.",
      },
      {
        enabled: includeTasks,
        error: projectTasksQuery.error,
        fallback: "Failed to load project tasks.",
      },
      {
        enabled: includeRates,
        error: ratesQuery.error,
        fallback: "Failed to load time rates.",
      },
      {
        enabled: includeTeamMembers,
        error: teamMembersQuery.error,
        fallback: "Failed to load project members.",
      },
    ];

    for (const candidate of candidates) {
      if (!candidate.enabled || !candidate.error) continue;
      if (isForbiddenError(candidate.error) || isRateRequiredError(candidate.error)) {
        continue;
      }
      return getErrorMessage(candidate.error, candidate.fallback);
    }

    return null;
  }, [
    includeMyLogs,
    includeOwnRate,
    includeRates,
    includeTasks,
    includeTeamMembers,
    myLogsQuery.error,
    ownRateQuery.error,
    permissionsQuery.error,
    projectTasksQuery.error,
    ratesQuery.error,
    teamMembersQuery.error,
  ]);

  return {
    actorKey,
    actorUserId,
    permissions,
    permissionsQuery,
    canManageRates,
    canApproveLogs,
    canEditTeamLogs,
    canViewTeamLogs,
    canViewTime,
    ownRate,
    myLogs,
    projectTasks,
    rates,
    teamMembers,
    ownRateQuery,
    myLogsQuery,
    projectTasksQuery,
    ratesQuery,
    teamMembersQuery,
    loadingPermissions,
    loadingOwnRate,
    loadingMyLogs,
    loadingProjectTasks,
    loadingRates,
    loadingMembers,
    myRateForbidden,
    myLogsForbidden,
    tasksForbidden,
    isTimeBlocked,
    isResolvingMyLogsAccess,
    canShowMyLogsTab,
    showMyLogsTabSkeleton,
    shouldBlockPage,
    shouldShowAccessDenied,
    queryErrorMessage,
    rateRequiredError,
  };
}
