import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import {
  projectTimeService,
  type ProjectTaskOption,
  type ProjectMemberTimeRate,
  type TaskTimeLog,
} from "@/services/project-time.service";
import {
  projectService,
  type ProjectMember,
  type ProjectPermissions,
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
  toLocalDateTimeInput,
} from "@/components/project/time/time-utils";

type TimeTab = "my_logs" | "team_logs";

const RATE_REQUIRED_HINT = "not enabled for time tracking";

export const Route = createFileRoute("/project/$projectId/time")({
  component: TimePage,
});

function TimePage() {
  const { projectId } = Route.useParams();

  const [permissions, setPermissions] = useState<ProjectPermissions | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TimeTab>("my_logs");
  const [myLogs, setMyLogs] = useState<TaskTimeLog[]>([]);
  const [projectTasks, setProjectTasks] = useState<ProjectTaskOption[]>([]);
  const [rates, setRates] = useState<ProjectMemberTimeRate[]>([]);
  const [ownRate, setOwnRate] = useState<ProjectMemberTimeRate | null>(null);
  const [teamMembers, setTeamMembers] = useState<ProjectMember[]>([]);

  const [loadingMyLogs, setLoadingMyLogs] = useState(false);
  const [loadingProjectTasks, setLoadingProjectTasks] = useState(false);
  const [loadingRates, setLoadingRates] = useState(false);
  const [loadingOwnRate, setLoadingOwnRate] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [timerNowMs, setTimerNowMs] = useState(Date.now());
  const [rowActionLoadingById, setRowActionLoadingById] = useState<
    Record<string, boolean>
  >({});
  const [taskSavingById, setTaskSavingById] = useState<Record<string, boolean>>(
    {},
  );

  const [isTimeBlocked, setIsTimeBlocked] = useState(false);
  const [isAddRateModalOpen, setIsAddRateModalOpen] = useState(false);
  const [isAddLogModalOpen, setIsAddLogModalOpen] = useState(false);
  const [newLogTaskId, setNewLogTaskId] = useState("");
  const [savingAddLog, setSavingAddLog] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editStartedAt, setEditStartedAt] = useState("");
  const [editEndedAt, setEditEndedAt] = useState("");
  const [savingLogEdit, setSavingLogEdit] = useState(false);

  const [newRateMemberId, setNewRateMemberId] = useState("");
  const [newRateCustomId, setNewRateCustomId] = useState("");
  const [newRateValue, setNewRateValue] = useState("");
  const [newRateCurrency, setNewRateCurrency] = useState("USD");
  const [newRateStartDate, setNewRateStartDate] = useState("");
  const [newRateEndDate, setNewRateEndDate] = useState("");
  const [savingRate, setSavingRate] = useState(false);
  const [deletingRate, setDeletingRate] = useState(false);

  const [isEditRateModalOpen, setIsEditRateModalOpen] = useState(false);
  const [isDeleteRateModalOpen, setIsDeleteRateModalOpen] = useState(false);
  const [deleteRateVerificationText, setDeleteRateVerificationText] = useState("");
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [editingRateCustomId, setEditingRateCustomId] = useState("");
  const [editingRateValue, setEditingRateValue] = useState("");
  const [editingRateCurrency, setEditingRateCurrency] = useState("USD");
  const [editingRateStartDate, setEditingRateStartDate] = useState("");
  const [editingRateEndDate, setEditingRateEndDate] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadPermissions = async () => {
      try {
        if (!cancelled) setLoadingPermissions(true);
        const value = await projectService.getMyPermissions(projectId);
        if (!cancelled) {
          setPermissions(value);
          setPermissionsError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setPermissionsError(
            e instanceof Error ? e.message : "Failed to load permissions.",
          );
        }
      } finally {
        if (!cancelled) setLoadingPermissions(false);
      }
    };
    void loadPermissions();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const canManageRates = permissions?.time?.manage_rates === true;
  const canViewTeamRates =
    (permissions?.time?.edit_team === true) || canManageRates;

  const loadMyLogs = async () => {
    try {
      setLoadingMyLogs(true);
      setError(null);
      const result = await projectTimeService.listMyLogs(projectId, {
        page: 1,
        limit: 100,
      });
      setMyLogs(result.items);
      setIsTimeBlocked(false);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to load your logs.";
      if (message.toLowerCase().includes(RATE_REQUIRED_HINT)) {
        setIsTimeBlocked(true);
      } else {
        setError(message);
      }
      setMyLogs([]);
    } finally {
      setLoadingMyLogs(false);
    }
  };

  const loadRates = async () => {
    if (!canViewTeamRates) {
      setRates([]);
      return;
    }
    try {
      setLoadingRates(true);
      setError(null);
      const result = await projectTimeService.listProjectMemberRates(projectId);
      setRates(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load time rates.");
      setRates([]);
    } finally {
      setLoadingRates(false);
    }
  };

  const loadOwnRate = async () => {
    try {
      setLoadingOwnRate(true);
      const rate = await projectTimeService.getMyProjectMemberRate(projectId);
      setOwnRate(rate);
      setIsTimeBlocked(false);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to load your time rate.";
      if (message.toLowerCase().includes(RATE_REQUIRED_HINT)) {
        setIsTimeBlocked(true);
      }
      setOwnRate(null);
    } finally {
      setLoadingOwnRate(false);
    }
  };

  const loadProjectTasks = async () => {
    try {
      setLoadingProjectTasks(true);
      const tasks = await projectTimeService.listProjectTasks(projectId);
      setProjectTasks(tasks);
    } catch {
      setProjectTasks([]);
    } finally {
      setLoadingProjectTasks(false);
    }
  };

  const loadTeamMembers = async () => {
    if (!canManageRates) {
      setTeamMembers([]);
      return;
    }
    try {
      setLoadingMembers(true);
      const members = await projectService.getMembers(projectId);
      setTeamMembers(members);
    } catch {
      setTeamMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (!permissions) return;
    void loadOwnRate();
    void loadMyLogs();
    void loadProjectTasks();
  }, [permissions, projectId]);

  useEffect(() => {
    if (!permissions) return;
    if (!canViewTeamRates) return;
    void loadRates();
  }, [permissions, canViewTeamRates, projectId]);

  useEffect(() => {
    if (!permissions) return;
    if (!canManageRates) return;
    void loadTeamMembers();
  }, [permissions, canManageRates, projectId]);

  const hasActiveLog = useMemo(() => {
    return myLogs.some((log) => !log.ended_at);
  }, [myLogs]);

  useEffect(() => {
    if (!hasActiveLog) return;
    const interval = window.setInterval(() => setTimerNowMs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [hasActiveLog]);

  const canShowMyLogsTab = useMemo(() => {
    if (ownRate) return true;
    if (loadingOwnRate) return true;
    if (loadingRates) return true;
    return !isTimeBlocked;
  }, [ownRate, loadingOwnRate, loadingRates, isTimeBlocked]);

  useEffect(() => {
    if (!canShowMyLogsTab && activeTab === "my_logs" && canViewTeamRates) {
      setActiveTab("team_logs");
    }
  }, [canShowMyLogsTab, activeTab, canViewTeamRates]);

  const shouldBlockPage = !canManageRates && isTimeBlocked && !ownRate;
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
      setSavingRate(true);
      setError(null);
      await projectTimeService.updateProjectMemberRate(projectId, rateId, {
        hourly_rate: hourly,
        currency: editingRateCurrency.trim().toUpperCase() || "USD",
        custom_id: editingRateCustomId.trim(),
        start_date: editingRateStartDate,
        ...(editingRateEndDate ? { end_date: editingRateEndDate } : {}),
      });
      closeEditRateModal();
      await loadRates();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update rate.");
    } finally {
      setSavingRate(false);
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
      setSavingRate(true);
      setError(null);
      await projectTimeService.createProjectMemberRate(projectId, {
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
      await loadRates();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create rate.");
    } finally {
      setSavingRate(false);
    }
  };

  const deleteEditedRate = async (rateId: string) => {
    if (deleteRateVerificationText.trim().toUpperCase() !== "DELETE") return;
    try {
      setDeletingRate(true);
      setError(null);
      await projectTimeService.deleteProjectMemberRate(projectId, rateId);
      closeEditRateModal();
      await loadRates();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete rate.");
    } finally {
      setDeletingRate(false);
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
      setSavingLogEdit(true);
      setError(null);
      await projectTimeService.update(editingLogId, {
        started_at,
        ...(ended_at ? { ended_at } : {}),
      });
      closeEditLogModal();
      await loadMyLogs();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update time log.");
    } finally {
      setSavingLogEdit(false);
    }
  };

  const stopLog = async (logId: string) => {
    try {
      setRowActionLoadingById((prev) => ({ ...prev, [logId]: true }));
      setError(null);
      await projectTimeService.stop(logId);
      await loadMyLogs();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to stop timer.");
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
      await projectTimeService.delete(logId);
      await loadMyLogs();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete log.");
    } finally {
      setRowActionLoadingById((prev) => ({ ...prev, [logId]: false }));
    }
  };

  const taskTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const task of projectTasks) map.set(task.id, task.title);
    return map;
  }, [projectTasks]);

  const handleTaskChange = async (log: TaskTimeLog, nextTaskId: string) => {
    if (!nextTaskId || nextTaskId === log.task_id) return;
    const previousTaskId = log.task_id;
    const previousTitle = log.task?.title;

    setTaskSavingById((prev) => ({ ...prev, [log.id]: true }));
    setMyLogs((prev) =>
      prev.map((entry) =>
        entry.id === log.id
          ? {
              ...entry,
              task_id: nextTaskId,
              task: {
                id: nextTaskId,
                title: taskTitleById.get(nextTaskId) ?? previousTitle ?? "Task",
              },
            }
          : entry,
      ),
    );

    try {
      setError(null);
      const updated = await projectTimeService.update(log.id, { task_id: nextTaskId });
      setMyLogs((prev) =>
        prev.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
    } catch (e) {
      setMyLogs((prev) =>
        prev.map((entry) =>
          entry.id === log.id
            ? {
                ...entry,
                task_id: previousTaskId,
                task: previousTitle
                  ? { id: previousTaskId, title: previousTitle }
                  : entry.task,
              }
            : entry,
        ),
      );
      setError(e instanceof Error ? e.message : "Failed to update task.");
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
      setSavingAddLog(true);
      setError(null);
      await projectTimeService.start(projectId, newLogTaskId);
      setIsAddLogModalOpen(false);
      setNewLogTaskId("");
      await loadMyLogs();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add log.");
    } finally {
      setSavingAddLog(false);
    }
  };

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

      {(error || permissionsError) && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error || permissionsError}
        </div>
      )}

      {shouldBlockPage ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-700 font-semibold">Time tracking is not enabled.</p>
          <p className="text-sm text-gray-500 mt-1">
            Ask a manager to add your hourly rate before using the Time page.
          </p>
        </div>
      ) : (
        <>
          {activeTab === "my_logs" && canShowMyLogsTab && (
            <div className="space-y-3">
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
    </div>
  );
}
