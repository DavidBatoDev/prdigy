import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";
import {
  projectTimeService,
  type ProjectMemberTimeRate,
  type TaskTimeLog,
} from "@/services/project-time.service";
import {
  projectService,
  type ProjectMember,
} from "@/services/project.service";
import { MyLogsGrid } from "@/components/project/time/MyLogsGrid";
import { TeamRatesSection } from "@/components/project/time/TeamRatesSection";
import {
  AddLogModal,
  AddRateModal,
  DeleteRateModal,
  EditLogModal,
  EditRateModal,
} from "@/components/project/time/TimeModals";
import {
  fromLocalDateTimeInput,
  liveDurationSecondsFromLog,
  toLocalDateTimeInput,
} from "@/components/project/time/time-utils";
import {
  getErrorMessage,
  isForbiddenError,
  isRateRequiredError,
  projectTimeKeys,
} from "@/queries/project-time";
import { useAuth } from "@/hooks/useAuth";

type TimeTab = "my_logs" | "team_logs";

const MY_LOGS_PAGE = 1;
const MY_LOGS_LIMIT = 100;

export const Route = createFileRoute("/project/$projectId/time")({
  component: TimePage,
});

function TimePage() {
  const { projectId } = Route.useParams();
  const queryClient = useQueryClient();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const { user, guestUserId, isLoading: authLoading } = useAuth();
  const actorKey = user?.id ?? guestUserId ?? "anonymous";
  const canRunQueries = Boolean(projectId) && !authLoading;

  const [activeTab, setActiveTab] = useState<TimeTab>("my_logs");

  const [error, setError] = useState<string | null>(null);
  const [timerNowMs, setTimerNowMs] = useState(Date.now());
  const [rowActionLoadingById, setRowActionLoadingById] = useState<
    Record<string, boolean>
  >({});
  const [taskSavingById, setTaskSavingById] = useState<Record<string, boolean>>(
    {},
  );

  const [isAddRateModalOpen, setIsAddRateModalOpen] = useState(false);
  const [isAddLogModalOpen, setIsAddLogModalOpen] = useState(false);
  const [newLogTaskId, setNewLogTaskId] = useState("");
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editStartedAt, setEditStartedAt] = useState("");
  const [editEndedAt, setEditEndedAt] = useState("");

  const [newRateMemberId, setNewRateMemberId] = useState("");
  const [newRateCustomId, setNewRateCustomId] = useState("");
  const [newRateValue, setNewRateValue] = useState("");
  const [newRateCurrency, setNewRateCurrency] = useState("USD");
  const [newRateStartDate, setNewRateStartDate] = useState("");
  const [newRateEndDate, setNewRateEndDate] = useState("");

  const [isEditRateModalOpen, setIsEditRateModalOpen] = useState(false);
  const [isDeleteRateModalOpen, setIsDeleteRateModalOpen] = useState(false);
  const [deleteRateVerificationText, setDeleteRateVerificationText] = useState("");
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [editingRateCustomId, setEditingRateCustomId] = useState("");
  const [editingRateValue, setEditingRateValue] = useState("");
  const [editingRateCurrency, setEditingRateCurrency] = useState("USD");
  const [editingRateStartDate, setEditingRateStartDate] = useState("");
  const [editingRateEndDate, setEditingRateEndDate] = useState("");
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const permissionsQuery = useQuery({
    queryKey: projectTimeKeys.permissions(projectId, actorKey),
    queryFn: () => projectService.getMyPermissions(projectId),
    enabled: canRunQueries,
    retry: false,
  });

  const permissions = permissionsQuery.data ?? null;
  const canManageRates = permissions?.time?.manage_rates === true;
  const canViewTeamRates =
    (permissions?.time?.edit_team === true) || canManageRates;
  const canViewTime = permissions?.time?.view === true;

  const ownRateQuery = useQuery({
    queryKey: projectTimeKeys.myRate(projectId, actorKey),
    queryFn: () => projectTimeService.getMyProjectMemberRate(projectId),
    enabled: canRunQueries && canViewTime,
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
    enabled: canRunQueries && canViewTime,
    retry: false,
  });

  const projectTasksQuery = useQuery({
    queryKey: projectTimeKeys.tasks(projectId, actorKey),
    queryFn: () => projectTimeService.listProjectTasks(projectId),
    enabled: canRunQueries && canViewTime,
    retry: false,
  });

  const ratesQuery = useQuery({
    queryKey: projectTimeKeys.rates(projectId, actorKey),
    queryFn: () => projectTimeService.listProjectMemberRates(projectId),
    enabled: canRunQueries && canViewTeamRates,
    retry: false,
  });

  const teamMembersQuery = useQuery({
    queryKey: projectTimeKeys.teamMembers(projectId, actorKey),
    queryFn: () => projectService.getMembers(projectId),
    enabled: canRunQueries && canManageRates,
    retry: false,
  });

  const ownRate = ownRateQuery.data ?? null;
  const myLogs = myLogsQuery.data ?? [];
  const projectTasks = projectTasksQuery.data ?? [];
  const rates = ratesQuery.data ?? [];
  const teamMembers = teamMembersQuery.data ?? [];

  const loadingPermissions = authLoading || permissionsQuery.isPending;
  const loadingMyLogs = myLogsQuery.isPending;
  const loadingProjectTasks = projectTasksQuery.isPending;
  const loadingRates = ratesQuery.isPending;
  const loadingOwnRate = ownRateQuery.isPending;
  const loadingMembers = teamMembersQuery.isPending;

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

  const invalidateRates = () =>
    queryClient.invalidateQueries({
      queryKey: projectTimeKeys.rates(projectId, actorKey),
    });

  const invalidateOwnRate = () =>
    queryClient.invalidateQueries({
      queryKey: projectTimeKeys.myRate(projectId, actorKey),
    });

  const invalidateTeamMembers = () =>
    queryClient.invalidateQueries({
      queryKey: projectTimeKeys.teamMembers(projectId, actorKey),
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

  const createRateMutation = useMutation({
    mutationFn: (payload: {
      project_member_id: string;
      hourly_rate: number;
      currency: string;
      custom_id: string;
      start_date: string;
      end_date?: string;
    }) => projectTimeService.createProjectMemberRate(projectId, payload),
    onSuccess: async () => {
      await Promise.all([
        invalidateRates(),
        invalidateOwnRate(),
        invalidateMyLogs(),
        invalidateTeamMembers(),
      ]);
    },
  });

  const updateRateMutation = useMutation({
    mutationFn: ({
      rateId,
      payload,
    }: {
      rateId: string;
      payload: {
        hourly_rate: number;
        currency: string;
        custom_id: string;
        start_date: string;
        end_date?: string;
      };
    }) => projectTimeService.updateProjectMemberRate(projectId, rateId, payload),
    onSuccess: async () => {
      await Promise.all([invalidateRates(), invalidateOwnRate(), invalidateMyLogs()]);
    },
  });

  const deleteRateMutation = useMutation({
    mutationFn: (rateId: string) =>
      projectTimeService.deleteProjectMemberRate(projectId, rateId),
    onSuccess: async () => {
      await Promise.all([
        invalidateRates(),
        invalidateOwnRate(),
        invalidateMyLogs(),
        invalidateTeamMembers(),
      ]);
    },
  });

  const myRateForbidden = isForbiddenError(ownRateQuery.error);
  const myLogsForbidden = isForbiddenError(myLogsQuery.error);
  const tasksForbidden = isForbiddenError(projectTasksQuery.error);

  const rateRequiredError =
    isRateRequiredError(ownRateQuery.error) ||
    isRateRequiredError(myLogsQuery.error) ||
    isRateRequiredError(projectTasksQuery.error);

  const isTimeBlocked =
    canViewTime && (rateRequiredError || myRateForbidden || myLogsForbidden || tasksForbidden);
  const isResolvingMyLogsAccess =
    canViewTime &&
    !canManageRates &&
    (loadingOwnRate || loadingMyLogs || loadingProjectTasks);

  const queryErrorMessage = useMemo(() => {
    if (permissionsQuery.error) {
      return getErrorMessage(permissionsQuery.error, "Failed to load permissions.");
    }

    const candidates: Array<{ error: unknown; fallback: string }> = [
      { error: ownRateQuery.error, fallback: "Failed to load your time rate." },
      { error: myLogsQuery.error, fallback: "Failed to load your logs." },
      { error: projectTasksQuery.error, fallback: "Failed to load project tasks." },
      { error: ratesQuery.error, fallback: "Failed to load time rates." },
      { error: teamMembersQuery.error, fallback: "Failed to load project members." },
    ];

    for (const candidate of candidates) {
      if (!candidate.error) continue;
      if (isForbiddenError(candidate.error) || isRateRequiredError(candidate.error)) {
        continue;
      }
      return getErrorMessage(candidate.error, candidate.fallback);
    }

    return null;
  }, [
    myLogsQuery.error,
    ownRateQuery.error,
    permissionsQuery.error,
    projectTasksQuery.error,
    ratesQuery.error,
    teamMembersQuery.error,
  ]);

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

  const canShowMyLogsTab = useMemo(() => {
    if (!canViewTime) return false;
    if (isResolvingMyLogsAccess) return false;
    return Boolean(ownRate) && !isTimeBlocked;
  }, [canViewTime, isResolvingMyLogsAccess, ownRate, isTimeBlocked]);
  const showMyLogsTabSkeleton =
    canViewTime && isResolvingMyLogsAccess && !canShowMyLogsTab;

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
  }, [updateScrollButtons, myLogs.length, activeTab, showMyLogsTabSkeleton]);

  const scrollToTop = useCallback(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!canShowMyLogsTab && activeTab === "my_logs" && canViewTeamRates) {
      setActiveTab("team_logs");
    }
  }, [canShowMyLogsTab, activeTab, canViewTeamRates]);

  const shouldBlockPage = !canManageRates && isTimeBlocked && !ownRate;
  const shouldShowAccessDenied =
    !loadingPermissions && !permissionsQuery.error && !canViewTime && !canViewTeamRates;

  const editingRateTarget = useMemo(
    () => rates.find((rate) => rate.id === editingRateId) ?? null,
    [rates, editingRateId],
  );

  const membersWithoutRate = useMemo(() => {
    const userIdsWithRate = new Set(rates.map((rate) => rate.member_user_id));
    return teamMembers.filter(
      (member) => member.user_id && !userIdsWithRate.has(member.user_id),
    );
  }, [rates, teamMembers]);

  const formatMemberRole = (member: ProjectMember) => {
    const role = member.role ? member.role.replace(/_/g, " ") : "member";
    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
    const position = (member.position || "").trim();
    return position ? `${roleLabel} | ${position}` : roleLabel;
  };

  const openEditRateModal = (rate: ProjectMemberTimeRate) => {
    setIsEditRateModalOpen(true);
    setEditingRateId(rate.id);
    setEditingRateCustomId(rate.custom_id || "");
    setEditingRateValue(String(rate.hourly_rate ?? ""));
    setEditingRateCurrency(rate.currency || "USD");
    setEditingRateStartDate(rate.start_date || "");
    setEditingRateEndDate(rate.end_date || "");
  };

  const closeEditRateModal = () => {
    setIsEditRateModalOpen(false);
    setIsDeleteRateModalOpen(false);
    setDeleteRateVerificationText("");
    setEditingRateId(null);
    setEditingRateCustomId("");
    setEditingRateValue("");
    setEditingRateCurrency("USD");
    setEditingRateStartDate("");
    setEditingRateEndDate("");
  };

  const saveEditedRate = async (rateId: string) => {
    const hourly = Number(editingRateValue);
    if (!Number.isFinite(hourly) || hourly < 0) {
      setError("Hourly rate must be a non-negative number.");
      return;
    }
    if (!editingRateStartDate) {
      setError("Start date is required.");
      return;
    }

    try {
      setError(null);
      await updateRateMutation.mutateAsync({
        rateId,
        payload: {
          hourly_rate: hourly,
          currency: editingRateCurrency.trim().toUpperCase() || "USD",
          custom_id: editingRateCustomId.trim(),
          start_date: editingRateStartDate,
          ...(editingRateEndDate ? { end_date: editingRateEndDate } : {}),
        },
      });
      closeEditRateModal();
    } catch (e) {
      setError(getErrorMessage(e, "Failed to update rate."));
    }
  };

  const createRate = async () => {
    if (!newRateMemberId) {
      setError("Select a member to add a time rate.");
      return;
    }

    const hourly = Number(newRateValue);
    if (!Number.isFinite(hourly) || hourly < 0) {
      setError("Hourly rate must be a non-negative number.");
      return;
    }
    if (!newRateStartDate) {
      setError("Start date is required.");
      return;
    }

    try {
      setError(null);
      await createRateMutation.mutateAsync({
        project_member_id: newRateMemberId,
        hourly_rate: hourly,
        currency: newRateCurrency.trim().toUpperCase() || "USD",
        custom_id: newRateCustomId.trim(),
        start_date: newRateStartDate,
        ...(newRateEndDate ? { end_date: newRateEndDate } : {}),
      });
      setIsAddRateModalOpen(false);
      setNewRateMemberId("");
      setNewRateCustomId("");
      setNewRateValue("");
      setNewRateCurrency("USD");
      setNewRateStartDate("");
      setNewRateEndDate("");
    } catch (e) {
      setError(getErrorMessage(e, "Failed to create rate."));
    }
  };

  const deleteEditedRate = async (rateId: string) => {
    if (deleteRateVerificationText.trim().toUpperCase() !== "DELETE") return;
    try {
      setError(null);
      await deleteRateMutation.mutateAsync(rateId);
      closeEditRateModal();
    } catch (e) {
      setError(getErrorMessage(e, "Failed to delete rate."));
    }
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
  const savingRate = createRateMutation.isPending || updateRateMutation.isPending;
  const deletingRate = deleteRateMutation.isPending;

  return (
    <div ref={scrollContainerRef} className="h-full w-full overflow-y-auto p-8">
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
            <button
              type="button"
              onClick={() => setActiveTab("my_logs")}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === "my_logs"
                  ? "bg-[#ff9933] text-white"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              My Logs
            </button>
          )}
          {canViewTeamRates && (
            <button
              type="button"
              onClick={() => setActiveTab("team_logs")}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === "team_logs"
                  ? "bg-[#ff9933] text-white"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              Team Logs
            </button>
          )}
        </div>
      )}

      {(error || queryErrorMessage) && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error || queryErrorMessage}
        </div>
      )}

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
          {showMyLogsTabSkeleton && activeTab === "my_logs" && (
            <div className="rounded-xl border border-gray-200 overflow-hidden bg-white animate-pulse">
              <div className="h-10 border-b border-gray-200 bg-gray-100" />
              <div className="p-3 space-y-2">
                {Array.from({ length: 7 }).map((_, idx) => (
                  <div key={idx} className="h-8 rounded bg-gray-100" />
                ))}
              </div>
            </div>
          )}
          {activeTab === "my_logs" && canShowMyLogsTab && (
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
                            <th className="px-2 py-1 text-left border-b border-gray-200">Training</th>
                            <th className="px-2 py-1 text-left border-b border-gray-200">Paid</th>
                            <th className="px-2 py-1 text-left border-b border-gray-200">Deductions</th>
                            <th className="px-2 py-1 text-left border-b border-gray-200">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-2 py-1 font-semibold">{formattedTotalWork}</td>
                            <td className="px-2 py-1">0.00</td>
                            <td className="px-2 py-1">0.00</td>
                            <td className="px-2 py-1">0.00</td>
                            <td className="px-2 py-1 font-semibold">{formattedTotalWork}</td>
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

          {activeTab === "team_logs" && canViewTeamRates && (
            <TeamRatesSection
              rates={rates}
              loadingRates={loadingRates}
              canManageRates={canManageRates}
              onOpenAddRate={() => setIsAddRateModalOpen(true)}
              onOpenEditRate={openEditRateModal}
            />
          )}
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

      <AddRateModal
        isOpen={isAddRateModalOpen}
        canManageRates={canManageRates}
        membersWithoutRate={membersWithoutRate}
        loadingMembers={loadingMembers}
        savingRate={savingRate}
        newRateMemberId={newRateMemberId}
        newRateCustomId={newRateCustomId}
        newRateValue={newRateValue}
        newRateCurrency={newRateCurrency}
        newRateStartDate={newRateStartDate}
        newRateEndDate={newRateEndDate}
        onClose={() => setIsAddRateModalOpen(false)}
        onCreateRate={createRate}
        onChangeMemberId={setNewRateMemberId}
        onChangeCustomId={setNewRateCustomId}
        onChangeRateValue={setNewRateValue}
        onChangeRateCurrency={setNewRateCurrency}
        onChangeStartDate={setNewRateStartDate}
        onChangeEndDate={setNewRateEndDate}
        formatMemberRole={formatMemberRole}
      />

      <EditRateModal
        isOpen={isEditRateModalOpen}
        canManageRates={canManageRates}
        editingRateId={editingRateId}
        editingRateTarget={editingRateTarget}
        editingRateCustomId={editingRateCustomId}
        editingRateValue={editingRateValue}
        editingRateCurrency={editingRateCurrency}
        editingRateStartDate={editingRateStartDate}
        editingRateEndDate={editingRateEndDate}
        savingRate={savingRate}
        onClose={closeEditRateModal}
        onSave={saveEditedRate}
        onRequestDelete={() => setIsDeleteRateModalOpen(true)}
        onChangeCustomId={setEditingRateCustomId}
        onChangeRateValue={setEditingRateValue}
        onChangeRateCurrency={setEditingRateCurrency}
        onChangeStartDate={setEditingRateStartDate}
        onChangeEndDate={setEditingRateEndDate}
      />

      <DeleteRateModal
        isOpen={isDeleteRateModalOpen && Boolean(editingRateId)}
        targetLabel={
          editingRateTarget?.member?.display_name ||
          editingRateTarget?.member?.email ||
          editingRateTarget?.custom_id ||
          editingRateTarget?.member_user_id
        }
        verificationText={deleteRateVerificationText}
        deletingRate={deletingRate}
        onClose={() => {
          setIsDeleteRateModalOpen(false);
          setDeleteRateVerificationText("");
        }}
        onChangeVerificationText={setDeleteRateVerificationText}
        onConfirmDelete={() =>
          editingRateId ? deleteEditedRate(editingRateId) : undefined
        }
      />

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
