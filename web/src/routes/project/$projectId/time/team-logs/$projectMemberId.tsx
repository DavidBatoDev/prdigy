import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  projectTimeService,
  type TaskTimeLog,
} from "@/services/project-time.service";
import { TeamMemberLogsGrid } from "@/components/project/time/TeamMemberLogsGrid";
import { EditLogModal } from "@/components/project/time/TimeModals";
import { TimeRouteFrame } from "@/components/project/time/TimeRouteFrame";
import {
  fromLocalDateTimeInput,
  liveDurationSecondsFromLog,
  toLocalDateTimeInput,
} from "@/components/project/time/time-utils";
import {
  getErrorMessage,
  isForbiddenError,
  projectTimeKeys,
} from "@/queries/project-time";
import {
  MY_LOGS_LIMIT,
  MY_LOGS_PAGE,
  useTimeRouteData,
} from "@/components/project/time/useTimeRouteData";

export const Route = createFileRoute(
  "/project/$projectId/time/team-logs/$projectMemberId",
)({
  component: TimeTeamMemberLogsPage,
});

function TimeTeamMemberLogsPage() {
  const { projectId, projectMemberId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    actorKey,
    actorUserId,
    canManageRates,
    canApproveLogs,
    canEditTeamLogs,
    canShowMyLogsTab,
    canViewTeamLogs,
    loadingPermissions,
    loadingMembers,
    rates,
    teamMembers,
    queryErrorMessage,
    showMyLogsTabSkeleton,
    shouldShowAccessDenied,
  } = useTimeRouteData(projectId, {
    includeOwnRate: false,
    includeTasks: false,
    includeRates: true,
    includeTeamMembers: true,
  });

  const [error, setError] = useState<string | null>(null);
  const [timerNowMs, setTimerNowMs] = useState(Date.now());
  const [reviewActionLoadingById, setReviewActionLoadingById] = useState<
    Record<string, boolean>
  >({});
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set());
  const [bulkDecision, setBulkDecision] = useState<
    "approved" | "rejected" | "pending"
  >("approved");

  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editStartedAt, setEditStartedAt] = useState("");
  const [editEndedAt, setEditEndedAt] = useState("");

  const targetMember = useMemo(
    () => teamMembers.find((member) => member.id === projectMemberId) ?? null,
    [teamMembers, projectMemberId],
  );

  const targetMemberUserId = targetMember?.user_id ?? null;

  useEffect(() => {
    if (!targetMemberUserId || !actorUserId) return;
    if (targetMemberUserId !== actorUserId) return;

    void navigate({
      to: "/project/$projectId/time/my-logs",
      params: { projectId },
      replace: true,
    });
  }, [actorUserId, navigate, projectId, targetMemberUserId]);

  const targetRate = useMemo(() => {
    const directMatch = rates.find((rate) => rate.project_member_id === projectMemberId);
    if (directMatch) return directMatch;
    if (!targetMemberUserId) return null;
    return rates.find((rate) => rate.member_user_id === targetMemberUserId) ?? null;
  }, [rates, projectMemberId, targetMemberUserId]);

  const targetDisplayName =
    targetRate?.member?.display_name ||
    targetRate?.member?.email ||
    targetMember?.user?.display_name ||
    targetMember?.user?.email ||
    targetMemberUserId ||
    "Project Member";

  const logsScope: "team" | "approvals" =
    canApproveLogs ? "approvals" : canEditTeamLogs || canManageRates ? "team" : "approvals";

  const teamLogsQuery = useQuery({
    queryKey: projectTimeKeys.teamLogs(
      projectId,
      actorKey,
      targetMemberUserId ?? "unknown-member",
      MY_LOGS_PAGE,
      MY_LOGS_LIMIT,
      logsScope,
    ),
    queryFn: async () => {
      const endpointOrder: Array<"approvals" | "team"> = [];
      if (canApproveLogs) endpointOrder.push("approvals");
      if (canEditTeamLogs || canManageRates) endpointOrder.push("team");
      if (endpointOrder.length === 0) endpointOrder.push(logsScope);

      let lastError: unknown;
      for (const endpoint of endpointOrder) {
        try {
          const listLogs =
            endpoint === "team"
              ? projectTimeService.listTeamLogs
              : projectTimeService.listApprovals;
          const result = await listLogs(projectId, {
            page: MY_LOGS_PAGE,
            limit: MY_LOGS_LIMIT,
            member_user_id: targetMemberUserId ?? undefined,
          });
          return result.items;
        } catch (error) {
          if (!isForbiddenError(error)) throw error;
          lastError = error;
        }
      }

      throw lastError ?? new Error("Failed to load team member logs.");
    },
    enabled:
      canViewTeamLogs &&
      Boolean(targetMemberUserId) &&
      (logsScope === "team" || canApproveLogs),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const logs = teamLogsQuery.data ?? [];
  const loadingLogs = teamLogsQuery.isPending;

  const invalidateTeamLogs = () => {
    if (!targetMemberUserId) return Promise.resolve();
    return queryClient.invalidateQueries({
      queryKey: projectTimeKeys.teamLogs(
        projectId,
        actorKey,
        targetMemberUserId,
        MY_LOGS_PAGE,
        MY_LOGS_LIMIT,
        logsScope,
      ),
    });
  };

  const updateLogMutation = useMutation({
    mutationFn: ({
      logId,
      startedAt,
      endedAt,
    }: {
      logId: string;
      startedAt: string;
      endedAt?: string;
    }) =>
      projectTimeService.update(logId, {
        started_at: startedAt,
        ...(endedAt ? { ended_at: endedAt } : {}),
      }),
    onSuccess: async () => {
      await invalidateTeamLogs();
    },
  });

  const reviewLogMutation = useMutation({
    mutationFn: ({
      logId,
      decision,
    }: {
      logId: string;
      decision: "approved" | "rejected" | "pending";
    }) => projectTimeService.review(logId, decision),
    onSuccess: async () => {
      await invalidateTeamLogs();
    },
  });

  const reviewBulkMutation = useMutation({
    mutationFn: ({
      logIds,
      decision,
    }: {
      logIds: string[];
      decision: "approved" | "rejected" | "pending";
    }) => projectTimeService.reviewBulk(logIds, decision),
    onSuccess: async () => {
      await invalidateTeamLogs();
    },
  });

  const hasActiveLog = useMemo(() => logs.some((log) => !log.ended_at), [logs]);

  useEffect(() => {
    if (!hasActiveLog) return;
    const interval = window.setInterval(() => setTimerNowMs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [hasActiveLog]);

  useEffect(() => {
    setSelectedLogIds((previous) => {
      if (previous.size === 0) return previous;
      const eligibleSet = new Set(
        logs.filter((log) => !!log.ended_at).map((log) => log.id),
      );
      const next = new Set<string>();
      for (const id of previous) {
        if (eligibleSet.has(id)) next.add(id);
      }
      return next;
    });
  }, [logs]);

  const totalHoursWorked = useMemo(() => {
    return logs.reduce((sum, log) => {
      const seconds = liveDurationSecondsFromLog(log, timerNowMs);
      return sum + seconds / 3600;
    }, 0);
  }, [logs, timerNowMs]);

  const totalWorkAmount = useMemo(() => {
    if (!targetRate) return 0;
    const hourlyRate = Number(targetRate.hourly_rate);
    if (!Number.isFinite(hourlyRate)) return 0;
    return totalHoursWorked * hourlyRate;
  }, [targetRate, totalHoursWorked]);

  const formattedTotalWork = useMemo(() => {
    const currency = targetRate?.currency || "USD";
    return `${totalWorkAmount.toFixed(2)} ${currency}`;
  }, [targetRate?.currency, totalWorkAmount]);

  const approvedAmount = useMemo(() => {
    if (!targetRate) return 0;
    const hourlyRate = Number(targetRate.hourly_rate);
    if (!Number.isFinite(hourlyRate)) return 0;

    return logs.reduce((sum, log) => {
      if (log.status !== "approved") return sum;
      const seconds = liveDurationSecondsFromLog(log, timerNowMs);
      const hours = seconds / 3600;
      return sum + hours * hourlyRate;
    }, 0);
  }, [logs, targetRate, timerNowMs]);

  const rejectedAmount = useMemo(() => {
    if (!targetRate) return 0;
    const hourlyRate = Number(targetRate.hourly_rate);
    if (!Number.isFinite(hourlyRate)) return 0;

    return logs.reduce((sum, log) => {
      if (log.status !== "rejected") return sum;
      const seconds = liveDurationSecondsFromLog(log, timerNowMs);
      const hours = seconds / 3600;
      return sum + hours * hourlyRate;
    }, 0);
  }, [logs, targetRate, timerNowMs]);

  const formattedApprovedAmount = useMemo(() => {
    const currency = targetRate?.currency || "USD";
    return `${approvedAmount.toFixed(2)} ${currency}`;
  }, [approvedAmount, targetRate?.currency]);

  const formattedRejectedAmount = useMemo(() => {
    const currency = targetRate?.currency || "USD";
    return `${rejectedAmount.toFixed(2)} ${currency}`;
  }, [rejectedAmount, targetRate?.currency]);

  const formatRateDate = (value?: string | null) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const beginEditLog = (log: TaskTimeLog) => {
    setEditingLogId(log.id);
    setEditStartedAt(toLocalDateTimeInput(log.started_at));
    setEditEndedAt(toLocalDateTimeInput(log.ended_at));
  };

  const closeEditLogModal = () => {
    setEditingLogId(null);
    setEditStartedAt("");
    setEditEndedAt("");
  };

  const saveEditedLog = async () => {
    if (!editingLogId) return;
    const started_at = fromLocalDateTimeInput(editStartedAt);
    const ended_at = fromLocalDateTimeInput(editEndedAt);
    if (!started_at) {
      setError("Time-in is required.");
      return;
    }

    try {
      setError(null);
      await updateLogMutation.mutateAsync({
        logId: editingLogId,
        startedAt: started_at,
        ...(ended_at ? { endedAt: ended_at } : {}),
      });
      closeEditLogModal();
    } catch (e) {
      setError(getErrorMessage(e, "Failed to update time log."));
    }
  };

  const reviewLog = async (
    logId: string,
    decision: "approved" | "rejected" | "pending",
  ) => {
    try {
      setReviewActionLoadingById((prev) => ({ ...prev, [logId]: true }));
      setError(null);
      await reviewLogMutation.mutateAsync({ logId, decision });
    } catch (e) {
      setError(getErrorMessage(e, "Failed to review time log."));
    } finally {
      setReviewActionLoadingById((prev) => ({ ...prev, [logId]: false }));
    }
  };

  const toggleSelectLog = (logId: string, checked: boolean) => {
    setSelectedLogIds((previous) => {
      const next = new Set(previous);
      if (checked) next.add(logId);
      else next.delete(logId);
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean, eligibleLogIds: string[]) => {
    setSelectedLogIds((previous) => {
      const next = new Set(previous);
      for (const id of eligibleLogIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const applyBulkDecisionToSelected = async () => {
    const ids = Array.from(selectedLogIds);
    if (ids.length === 0) return;
    try {
      setError(null);
      await reviewBulkMutation.mutateAsync({ logIds: ids, decision: bulkDecision });
      setSelectedLogIds(new Set());
    } catch (e) {
      setError(getErrorMessage(e, "Failed to update selected logs."));
    }
  };

  const pageError = useMemo(() => {
    if (teamLogsQuery.error) {
      if (isForbiddenError(teamLogsQuery.error)) {
        return "You do not have permission to view this member's logs.";
      }
      return getErrorMessage(teamLogsQuery.error, "Failed to load team member logs.");
    }
    return queryErrorMessage;
  }, [queryErrorMessage, teamLogsQuery.error]);

  return (
    <TimeRouteFrame
      projectId={projectId}
      activeTab="team_logs"
      loadingPermissions={loadingPermissions}
      showMyLogsTabSkeleton={showMyLogsTabSkeleton}
      canShowMyLogsTab={canShowMyLogsTab}
      canViewTeamLogs={canViewTeamLogs}
      errorMessage={error || pageError}
    >
      {shouldShowAccessDenied ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-700 font-semibold">
            You do not have permission to access Time tracking.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Ask a manager to enable Time View permission.
          </p>
        </div>
      ) : !canViewTeamLogs ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-700 font-semibold">
            You do not have permission to access team member logs.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Ask a manager for Team Logs or Approve permission.
          </p>
        </div>
      ) : loadingMembers ? (
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white animate-pulse">
          <div className="h-10 border-b border-gray-200 bg-gray-100" />
          <div className="p-3 space-y-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-8 rounded bg-gray-100" />
            ))}
          </div>
        </div>
      ) : !targetMember ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-700 font-semibold">Project member not found.</p>
          <p className="text-sm text-gray-500 mt-1">
            The selected member may have been removed from this project.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-10 gap-4 items-start">
          <div className="xl:col-span-7 min-w-0">
            {canApproveLogs && (
              <div className="mb-2 flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2">
                <p className="text-xs text-gray-600">
                  Selected logs: <span className="font-semibold">{selectedLogIds.size}</span>
                </p>
                <div className="flex items-center gap-2">
                  <select
                    value={bulkDecision}
                    onChange={(event) =>
                      setBulkDecision(
                        event.currentTarget.value as "approved" | "rejected" | "pending",
                      )
                    }
                    disabled={reviewBulkMutation.isPending}
                    className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-700 disabled:opacity-50"
                  >
                    <option value="approved">Set All Approved</option>
                    <option value="rejected">Set All Rejected</option>
                    <option value="pending">Set All Pending</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => void applyBulkDecisionToSelected()}
                    disabled={selectedLogIds.size === 0 || reviewBulkMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border border-[#ff9933]/30 bg-[#ff9933]/10 text-[#b35f00] hover:bg-[#ff9933]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
            <TeamMemberLogsGrid
              logs={logs}
              targetRate={targetRate}
              loadingLogs={loadingLogs}
              timerNowMs={timerNowMs}
              canEditTeam={canEditTeamLogs}
              canApprove={canApproveLogs}
              isBulkReviewing={reviewBulkMutation.isPending}
              selectedLogIds={selectedLogIds}
              reviewActionLoadingById={reviewActionLoadingById}
              onToggleSelectLog={toggleSelectLog}
              onToggleSelectAll={toggleSelectAll}
              onEditLog={beginEditLog}
              onReviewLog={reviewLog}
            />
            <p className="mt-2 text-[11px] text-gray-500">
              Running timers are visible for monitoring. Approve/reject is available
              after the member stops the timer.
            </p>
          </div>

          <aside className="xl:col-span-3 xl:sticky xl:top-6">
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="border-b border-gray-200 px-4 py-3 bg-primary">
                <h3 className="text-sm font-semibold text-white">{targetDisplayName}</h3>
              </div>

              <div className="p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Employee ID</span>
                  <span className="font-semibold text-[#b35f00]">
                    {targetRate?.custom_id || targetMemberUserId || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Start Date</span>
                  <span className="text-right">{formatRateDate(targetRate?.start_date)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">End Date</span>
                  <span className="text-right">{formatRateDate(targetRate?.end_date)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Hourly Rate</span>
                  <span className="font-semibold">
                    {targetRate
                      ? `${Number(targetRate.hourly_rate).toFixed(2)} ${targetRate.currency}`
                      : "-"}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-2 py-1 text-left border-b border-gray-200">Work</th>
                        <th className="px-2 py-1 text-left border-b border-gray-200">Approved</th>
                        <th className="px-2 py-1 text-left border-b border-gray-200">Rejected</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-2 py-1 font-semibold">{formattedTotalWork}</td>
                        <td className="px-2 py-1">{formattedApprovedAmount}</td>
                        <td className="px-2 py-1">{formattedRejectedAmount}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-gray-500 mt-2">
                  Total Hours: {totalHoursWorked.toFixed(2)}
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}

      <EditLogModal
        isOpen={editingLogId !== null && canEditTeamLogs}
        startedAt={editStartedAt}
        endedAt={editEndedAt}
        saving={updateLogMutation.isPending}
        onClose={closeEditLogModal}
        onSave={saveEditedLog}
        onChangeStartedAt={setEditStartedAt}
        onChangeEndedAt={setEditEndedAt}
      />
    </TimeRouteFrame>
  );
}
