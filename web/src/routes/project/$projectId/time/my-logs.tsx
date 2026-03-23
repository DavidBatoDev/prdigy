import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  projectTimeService,
  type TaskTimeLog,
} from "@/services/project-time.service";
import { MyLogsGrid } from "@/components/project/time/MyLogsGrid";
import { AddLogModal, EditLogModal } from "@/components/project/time/TimeModals";
import { TimeRouteFrame } from "@/components/project/time/TimeRouteFrame";
import {
  fromLocalDateTimeInput,
  liveDurationSecondsFromLog,
  toLocalDateTimeInput,
} from "@/components/project/time/time-utils";
import {
  getErrorMessage,
  projectTimeKeys,
} from "@/queries/project-time";
import {
  MY_LOGS_LIMIT,
  MY_LOGS_PAGE,
  useTimeRouteData,
} from "@/components/project/time/useTimeRouteData";

export const Route = createFileRoute("/project/$projectId/time/my-logs")({
  component: TimeMyLogsPage,
});

function TimeMyLogsPage() {
  const { projectId } = Route.useParams();
  const queryClient = useQueryClient();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    actorKey,
    canShowMyLogsTab,
    canViewTeamLogs,
    loadingPermissions,
    loadingMyLogs,
    loadingProjectTasks,
    ownRate,
    myLogs,
    projectTasks,
    queryErrorMessage,
    showMyLogsTabSkeleton,
    shouldBlockPage,
    shouldShowAccessDenied,
  } = useTimeRouteData(projectId, {
    includeOwnRate: true,
    includeMyLogs: true,
    includeTasks: true,
  });

  const [error, setError] = useState<string | null>(null);
  const [timerNowMs, setTimerNowMs] = useState(Date.now());
  const [rowActionLoadingById, setRowActionLoadingById] = useState<
    Record<string, boolean>
  >({});
  const [taskSavingById, setTaskSavingById] = useState<Record<string, boolean>>(
    {},
  );

  const [isAddLogModalOpen, setIsAddLogModalOpen] = useState(false);
  const [newLogTaskId, setNewLogTaskId] = useState("");
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editStartedAt, setEditStartedAt] = useState("");
  const [editEndedAt, setEditEndedAt] = useState("");

  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const taskTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const task of projectTasks) map.set(task.id, task.title);
    return map;
  }, [projectTasks]);

  const invalidateMyLogs = () =>
    queryClient.invalidateQueries({
      queryKey: projectTimeKeys.myLogs(
        projectId,
        actorKey,
        MY_LOGS_PAGE,
        MY_LOGS_LIMIT,
      ),
    });

  const invalidateOwnRate = () =>
    queryClient.invalidateQueries({
      queryKey: projectTimeKeys.myRate(projectId, actorKey),
    });

  const invalidateTasks = () =>
    queryClient.invalidateQueries({
      queryKey: projectTimeKeys.tasks(projectId, actorKey),
    });

  const updateTaskMutation = useMutation({
    mutationFn: ({ logId, taskId }: { logId: string; taskId: string }) =>
      projectTimeService.update(logId, { task_id: taskId }),
    onMutate: async ({ logId, taskId }) => {
      const queryKey = projectTimeKeys.myLogs(
        projectId,
        actorKey,
        MY_LOGS_PAGE,
        MY_LOGS_LIMIT,
      );
      await queryClient.cancelQueries({ queryKey });
      const previousLogs = queryClient.getQueryData<TaskTimeLog[]>(queryKey);

      queryClient.setQueryData<TaskTimeLog[]>(queryKey, (current) => {
        if (!current) return current;
        return current.map((entry) =>
          entry.id === logId
            ? {
                ...entry,
                task_id: taskId,
                task: {
                  id: taskId,
                  title: taskTitleById.get(taskId) ?? entry.task?.title ?? "Task",
                },
              }
            : entry,
        );
      });

      return { previousLogs, queryKey };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousLogs && context.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousLogs);
      }
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<TaskTimeLog[]>(
        projectTimeKeys.myLogs(projectId, actorKey, MY_LOGS_PAGE, MY_LOGS_LIMIT),
        (current) => {
          if (!current) return [updated];
          return current.map((entry) => (entry.id === updated.id ? updated : entry));
        },
      );
    },
    onSettled: () => {
      void invalidateMyLogs();
    },
  });

  const startLogMutation = useMutation({
    mutationFn: (taskId: string) => projectTimeService.start(projectId, taskId),
    onSuccess: async () => {
      await Promise.all([invalidateMyLogs(), invalidateOwnRate()]);
    },
  });

  const stopLogMutation = useMutation({
    mutationFn: (logId: string) => projectTimeService.stop(logId),
    onSuccess: async () => {
      await invalidateMyLogs();
    },
  });

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
      await invalidateMyLogs();
    },
  });

  const deleteLogMutation = useMutation({
    mutationFn: (logId: string) => projectTimeService.delete(logId),
    onSuccess: async () => {
      await invalidateMyLogs();
    },
  });

  const hasActiveLog = useMemo(() => {
    return myLogs.some((log) => !log.ended_at);
  }, [myLogs]);

  const totalHoursWorked = useMemo(() => {
    return myLogs.reduce((sum, log) => {
      const seconds = liveDurationSecondsFromLog(log, timerNowMs);
      return sum + seconds / 3600;
    }, 0);
  }, [myLogs, timerNowMs]);

  const totalWorkAmount = useMemo(() => {
    if (!ownRate) return 0;
    const hourlyRate = Number(ownRate.hourly_rate);
    if (!Number.isFinite(hourlyRate)) return 0;
    return totalHoursWorked * hourlyRate;
  }, [ownRate, totalHoursWorked]);

  const formattedTotalWork = useMemo(() => {
    const currency = ownRate?.currency || "USD";
    return `${totalWorkAmount.toFixed(2)} ${currency}`;
  }, [ownRate?.currency, totalWorkAmount]);

  const approvedAmount = useMemo(() => {
    if (!ownRate) return 0;
    const hourlyRate = Number(ownRate.hourly_rate);
    if (!Number.isFinite(hourlyRate)) return 0;

    return myLogs.reduce((sum, log) => {
      if (log.status !== "approved") return sum;
      const seconds = liveDurationSecondsFromLog(log, timerNowMs);
      const hours = seconds / 3600;
      return sum + hours * hourlyRate;
    }, 0);
  }, [myLogs, ownRate, timerNowMs]);

  const rejectedAmount = useMemo(() => {
    if (!ownRate) return 0;
    const hourlyRate = Number(ownRate.hourly_rate);
    if (!Number.isFinite(hourlyRate)) return 0;

    return myLogs.reduce((sum, log) => {
      if (log.status !== "rejected") return sum;
      const seconds = liveDurationSecondsFromLog(log, timerNowMs);
      const hours = seconds / 3600;
      return sum + hours * hourlyRate;
    }, 0);
  }, [myLogs, ownRate, timerNowMs]);

  const formattedApprovedAmount = useMemo(() => {
    const currency = ownRate?.currency || "USD";
    return `${approvedAmount.toFixed(2)} ${currency}`;
  }, [approvedAmount, ownRate?.currency]);

  const formattedRejectedAmount = useMemo(() => {
    const currency = ownRate?.currency || "USD";
    return `${rejectedAmount.toFixed(2)} ${currency}`;
  }, [rejectedAmount, ownRate?.currency]);

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

  useEffect(() => {
    if (!hasActiveLog) return;
    const interval = window.setInterval(() => setTimerNowMs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [hasActiveLog]);

  const updateScrollButtons = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) {
      setCanScrollUp(false);
      setCanScrollDown(false);
      return;
    }

    const threshold = 2;
    const isAtTop = el.scrollTop <= threshold;
    const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;

    setCanScrollUp(!isAtTop);
    setCanScrollDown(!isAtBottom);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleScroll = () => updateScrollButtons();
    updateScrollButtons();
    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [updateScrollButtons, myLogs.length, showMyLogsTabSkeleton]);

  const scrollToTop = useCallback(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

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

  const stopLog = async (logId: string) => {
    try {
      setRowActionLoadingById((prev) => ({ ...prev, [logId]: true }));
      setError(null);
      await stopLogMutation.mutateAsync(logId);
    } catch (e) {
      setError(getErrorMessage(e, "Failed to stop timer."));
    } finally {
      setRowActionLoadingById((prev) => ({ ...prev, [logId]: false }));
    }
  };

  const deleteLog = async (logId: string) => {
    const confirmed = window.confirm("Delete this time log?");
    if (!confirmed) return;

    try {
      setRowActionLoadingById((prev) => ({ ...prev, [logId]: true }));
      setError(null);
      await deleteLogMutation.mutateAsync(logId);
    } catch (e) {
      setError(getErrorMessage(e, "Failed to delete time log."));
    } finally {
      setRowActionLoadingById((prev) => ({ ...prev, [logId]: false }));
    }
  };

  const handleTaskChange = async (log: TaskTimeLog, nextTaskId: string) => {
    if (!nextTaskId || nextTaskId === log.task_id) return;

    try {
      setTaskSavingById((prev) => ({ ...prev, [log.id]: true }));
      setError(null);
      await updateTaskMutation.mutateAsync({ logId: log.id, taskId: nextTaskId });
    } catch (e) {
      setError(getErrorMessage(e, "Failed to update task."));
    } finally {
      setTaskSavingById((prev) => ({ ...prev, [log.id]: false }));
    }
  };

  const createLogFromModal = async () => {
    if (!newLogTaskId) {
      setError("Select a task.");
      return;
    }

    try {
      setError(null);
      await startLogMutation.mutateAsync(newLogTaskId);
      setIsAddLogModalOpen(false);
      setNewLogTaskId("");
      void invalidateTasks();
    } catch (e) {
      setError(getErrorMessage(e, "Failed to add log."));
    }
  };

  const savingAddLog = startLogMutation.isPending;
  const savingLogEdit = updateLogMutation.isPending;

  return (
    <div ref={scrollContainerRef} className="h-full w-full overflow-y-auto">
      <TimeRouteFrame
        projectId={projectId}
        activeTab="my_logs"
        loadingPermissions={loadingPermissions}
        showMyLogsTabSkeleton={showMyLogsTabSkeleton}
        canShowMyLogsTab={canShowMyLogsTab}
        canViewTeamLogs={canViewTeamLogs}
        errorMessage={error || queryErrorMessage}
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
        ) : shouldBlockPage ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <p className="text-sm text-gray-700 font-semibold">Time tracking is not enabled.</p>
            <p className="text-sm text-gray-500 mt-1">
              Ask a manager to add your hourly rate before using the Time page.
            </p>
          </div>
        ) : (
          <>
            {showMyLogsTabSkeleton && (
              <div className="rounded-xl border border-gray-200 overflow-hidden bg-white animate-pulse">
                <div className="h-10 border-b border-gray-200 bg-gray-100" />
                <div className="p-3 space-y-2">
                  {Array.from({ length: 7 }).map((_, idx) => (
                    <div key={idx} className="h-8 rounded bg-gray-100" />
                  ))}
                </div>
              </div>
            )}

            {canShowMyLogsTab ? (
              <div className="grid grid-cols-1 xl:grid-cols-10 gap-4 items-start">
                <div className="xl:col-span-7 min-w-0">
                  <MyLogsGrid
                    logs={myLogs}
                    tasks={projectTasks}
                    ownRate={ownRate}
                    loadingLogs={loadingMyLogs}
                    loadingTasks={loadingProjectTasks}
                    timerNowMs={timerNowMs}
                    taskSavingById={taskSavingById}
                    rowActionLoadingById={rowActionLoadingById}
                    onTaskChange={handleTaskChange}
                    onStopLog={stopLog}
                    onDeleteLog={deleteLog}
                    onEditLog={beginEditLog}
                    onOpenAddLog={() => setIsAddLogModalOpen(true)}
                  />
                </div>

                <aside className="xl:col-span-3 xl:sticky xl:top-6">
                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                    <div className="border-b border-gray-200 px-4 py-3 bg-primary">
                      <h3 className="text-sm font-semibold text-white">
                        Project Member Time Rate
                      </h3>
                    </div>

                    <div className="p-4 space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-500">Employee ID</span>
                        <span className="font-semibold text-[#b35f00]">
                          {ownRate?.custom_id || ownRate?.member_user_id || "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-500">Start Date</span>
                        <span className="text-right">{formatRateDate(ownRate?.start_date)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-500">End Date</span>
                        <span className="text-right">{formatRateDate(ownRate?.end_date)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-500">Hourly Rate</span>
                        <span className="font-semibold">
                          {ownRate
                            ? `${Number(ownRate.hourly_rate).toFixed(2)} ${ownRate.currency}`
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
                              <th className="px-2 py-1 text-left border-b border-gray-200">
                                Approved
                              </th>
                              <th className="px-2 py-1 text-left border-b border-gray-200">
                                Rejected
                              </th>
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
            ) : !showMyLogsTabSkeleton ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                <p className="text-sm text-gray-700 font-semibold">
                  Your personal logs are not available.
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Use Team Logs to review member entries and rates.
                </p>
              </div>
            ) : null}
          </>
        )}

        <EditLogModal
          isOpen={editingLogId !== null}
          startedAt={editStartedAt}
          endedAt={editEndedAt}
          saving={savingLogEdit}
          onClose={closeEditLogModal}
          onSave={saveEditedLog}
          onChangeStartedAt={setEditStartedAt}
          onChangeEndedAt={setEditEndedAt}
        />

        <AddLogModal
          isOpen={isAddLogModalOpen}
          tasks={projectTasks}
          selectedTaskId={newLogTaskId}
          saving={savingAddLog}
          onClose={() => {
            setIsAddLogModalOpen(false);
            setNewLogTaskId("");
          }}
          onSave={createLogFromModal}
          onChangeTaskId={setNewLogTaskId}
        />
      </TimeRouteFrame>

      {(canScrollUp || canScrollDown) && (
        <div className="fixed right-5 bottom-5 z-50 flex flex-col gap-1.5">
          <div className="h-7 w-7">
            {canScrollUp && (
              <button
                type="button"
                onClick={scrollToTop}
                aria-label="Scroll to top"
                className="h-7 w-7 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors flex items-center justify-center"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="h-7 w-7">
            {canScrollDown && (
              <button
                type="button"
                onClick={scrollToBottom}
                aria-label="Scroll to bottom"
                className="h-7 w-7 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors flex items-center justify-center"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
