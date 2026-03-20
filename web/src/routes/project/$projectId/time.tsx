import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Clock, Plus, Save, X, XCircle } from "lucide-react";
import {
  projectTimeService,
  type ProjectMemberTimeRate,
  type TaskTimeLog,
} from "@/services/project-time.service";
import {
  projectService,
  type ProjectMember,
  type ProjectPermissions,
} from "@/services/project.service";
import { useUser } from "@/stores/authStore";

type TimeTab = "my_logs" | "team_logs";

const RATE_REQUIRED_HINT = "not enabled for time tracking";

export const Route = createFileRoute("/project/$projectId/time")({
  component: TimePage,
});

const formatDuration = (seconds?: number | null) => {
  if (!seconds || seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
};

function TimeLogRowSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="h-4 w-44 rounded bg-gray-200" />
          <div className="h-3 w-60 rounded bg-gray-100" />
          <div className="h-3 w-40 rounded bg-gray-100" />
        </div>
        <div className="space-y-2 text-right">
          <div className="h-4 w-16 rounded bg-gray-200 ml-auto" />
          <div className="h-5 w-20 rounded-full bg-gray-100 ml-auto" />
        </div>
      </div>
    </div>
  );
}

function TimeLogRow({
  log,
  nowMs,
}: {
  log: TaskTimeLog;
  nowMs: number;
}) {
  const liveDurationSeconds = (() => {
    if (log.ended_at) return log.duration_seconds;
    const started = new Date(log.started_at).getTime();
    if (Number.isNaN(started)) return log.duration_seconds;
    return Math.max(0, Math.floor((nowMs - started) / 1000));
  })();

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {log.task?.title ?? "Task"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(log.started_at).toLocaleString()} {" "}
            {log.ended_at
              ? `- ${new Date(log.ended_at).toLocaleString()}`
              : "- Running"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Member: {log.member?.display_name || log.member?.email || log.member_user_id}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">
            {formatDuration(liveDurationSeconds)}
          </p>
          <span
            className={`inline-flex mt-1 px-2 py-0.5 text-[11px] rounded-full ${
              log.status === "approved"
                ? "bg-emerald-100 text-emerald-700"
                : log.status === "rejected"
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
            }`}
          >
            {log.status}
          </span>
        </div>
      </div>
    </div>
  );
}

function RateCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden animate-pulse">
      <div className="h-16 bg-gray-100" />
      <div className="px-4 pb-4 -mt-8">
        <div className="mx-auto h-16 w-16 rounded-full border-4 border-white bg-gray-200" />
        <div className="mt-3 space-y-2 text-center">
          <div className="mx-auto h-4 w-32 rounded bg-gray-200" />
          <div className="mx-auto h-3 w-40 rounded bg-gray-100" />
          <div className="mx-auto h-7 w-24 rounded-full bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

function initialsFromName(name?: string) {
  const base = (name || "?").trim();
  if (!base) return "?";
  return base
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function TimePage() {
  const { projectId } = Route.useParams();
  const user = useUser();

  const [permissions, setPermissions] = useState<ProjectPermissions | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TimeTab>("my_logs");
  const [myLogs, setMyLogs] = useState<TaskTimeLog[]>([]);
  const [rates, setRates] = useState<ProjectMemberTimeRate[]>([]);
  const [teamMembers, setTeamMembers] = useState<ProjectMember[]>([]);

  const [loadingMyLogs, setLoadingMyLogs] = useState(false);
  const [loadingRates, setLoadingRates] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [timerNowMs, setTimerNowMs] = useState(Date.now());

  const [isTimeBlocked, setIsTimeBlocked] = useState(false);
  const [isAddRateModalOpen, setIsAddRateModalOpen] = useState(false);

  const [newRateMemberId, setNewRateMemberId] = useState("");
  const [newRateValue, setNewRateValue] = useState("");
  const [newRateCurrency, setNewRateCurrency] = useState("USD");
  const [savingRate, setSavingRate] = useState(false);

  const [isEditRateModalOpen, setIsEditRateModalOpen] = useState(false);
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [editingRateValue, setEditingRateValue] = useState("");
  const [editingRateCurrency, setEditingRateCurrency] = useState("USD");

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
        limit: 50,
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
    void loadMyLogs();
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

  const ownRate = useMemo(() => {
    if (!user?.id) return null;
    return rates.find((rate) => rate.member_user_id === user.id) ?? null;
  }, [rates, user?.id]);

  const canShowMyLogsTab = useMemo(() => {
    if (ownRate) return true;
    if (loadingRates) return true;
    return !isTimeBlocked;
  }, [ownRate, loadingRates, isTimeBlocked]);

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
    return position ? `${roleLabel} • ${position}` : roleLabel;
  };

  const openEditRateModal = (rate: ProjectMemberTimeRate) => {
    setIsEditRateModalOpen(true);
    setEditingRateId(rate.id);
    setEditingRateValue(String(rate.hourly_rate ?? ""));
    setEditingRateCurrency(rate.currency || "USD");
  };

  const closeEditRateModal = () => {
    setIsEditRateModalOpen(false);
    setEditingRateId(null);
    setEditingRateValue("");
    setEditingRateCurrency("USD");
  };

  const saveEditedRate = async (rateId: string) => {
    const hourly = Number(editingRateValue);
    if (!Number.isFinite(hourly) || hourly < 0) {
      setError("Hourly rate must be a non-negative number.");
      return;
    }

    try {
      setSavingRate(true);
      setError(null);
      await projectTimeService.updateProjectMemberRate(projectId, rateId, {
        hourly_rate: hourly,
        currency: editingRateCurrency.trim().toUpperCase() || "USD",
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

    try {
      setSavingRate(true);
      setError(null);
      await projectTimeService.createProjectMemberRate(projectId, {
        project_member_id: newRateMemberId,
        hourly_rate: hourly,
        currency: newRateCurrency.trim().toUpperCase() || "USD",
      });
      setIsAddRateModalOpen(false);
      setNewRateMemberId("");
      setNewRateValue("");
      setNewRateCurrency("USD");
      await loadRates();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create rate.");
    } finally {
      setSavingRate(false);
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
              {loadingMyLogs ? (
                <>
                  <TimeLogRowSkeleton />
                  <TimeLogRowSkeleton />
                  <TimeLogRowSkeleton />
                </>
              ) : myLogs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                  <p className="text-sm text-gray-500">No logs yet.</p>
                </div>
              ) : (
                myLogs.map((log) => (
                  <TimeLogRow
                    key={log.id}
                    log={log}
                    nowMs={timerNowMs}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === "team_logs" && canViewTeamRates && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Project Member Time Rates</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Members need a rate row here before they can use time tracking.
                  </p>
                </div>
                {canManageRates && (
                  <button
                    type="button"
                    onClick={() => setIsAddRateModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-[#ff9933]/30 bg-[#ff9933]/10 text-[#b35f00] hover:bg-[#ff9933]/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Rate
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {loadingRates ? (
                  <div className="flex flex-wrap gap-4">
                    <RateCardSkeleton />
                    <RateCardSkeleton />
                    <RateCardSkeleton />
                  </div>
                ) : rates.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                    <p className="text-sm text-gray-500">No time rates set yet.</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-4">
                    {rates.map((rate) => {
                      const memberName =
                        rate.member?.display_name ||
                        rate.member?.email ||
                        rate.member_user_id;
                      const roleRaw = rate.project_member?.role || "member";
                      const roleLabel =
                        roleRaw.charAt(0).toUpperCase() + roleRaw.slice(1);
                      const positionLabel =
                        (rate.project_member?.position || "").trim() || "Project Member";
                      const avatarUrl = rate.member?.avatar_url;
                      const bannerUrl = rate.member?.banner_url;

                      return (
                        <div
                          key={rate.id}
                          className="w-full sm:w-[240px] rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden aspect-square flex flex-col"
                        >
                          <div
                            className="h-14 bg-gradient-to-r from-orange-200 via-amber-200 to-orange-100"
                            style={
                              bannerUrl
                                ? {
                                    backgroundImage: `url(${bannerUrl})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                  }
                                : undefined
                            }
                          />
                          <div className="px-3 pb-3 -mt-7 flex-1 flex flex-col">
                            <div className="mx-auto h-14 w-14 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden flex items-center justify-center">
                              {avatarUrl ? (
                                <img
                                  src={avatarUrl}
                                  alt={memberName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-semibold text-gray-700">
                                  {initialsFromName(memberName)}
                                </span>
                              )}
                            </div>

                            <div className="mt-2.5 text-center">
                              <p className="text-sm font-semibold text-gray-900 leading-tight">
                                {memberName}
                              </p>
                              <p className="text-[11px] text-gray-500 mt-1">
                                {roleLabel} | {positionLabel}
                              </p>
                            </div>

                            <div className="mt-auto pt-3 border-t border-gray-100">
                              <div className="flex items-center justify-center gap-2">
                                <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                                  {Number(rate.hourly_rate).toFixed(2)} {rate.currency}
                                </span>
                                {canManageRates && (
                                  <button
                                    type="button"
                                    onClick={() => openEditRateModal(rate)}
                                    className="px-2.5 py-1 text-xs font-semibold rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {isAddRateModalOpen && canManageRates && (
        <div
          className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-900/55 backdrop-blur-[2px] p-4"
          onClick={() => setIsAddRateModalOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-3xl border border-orange-100 bg-white shadow-[0_24px_80px_rgba(2,6,23,0.35)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-orange-100 px-6 py-5 bg-gradient-to-r from-orange-50 to-amber-50">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Add Team Rate</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enable time tracking for a project member by assigning hourly rate.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddRateModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-white/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Select Member
                </label>
                <select
                  value={newRateMemberId}
                  onChange={(e) => setNewRateMemberId(e.target.value)}
                  disabled={savingRate || loadingMembers}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                >
                  <option value="">Select member</option>
                  {membersWithoutRate.map((member) => {
                    const memberName =
                      member.user?.display_name ||
                      member.user?.email ||
                      member.user_id ||
                      member.id;
                    return (
                      <option key={member.id} value={member.id}>
                        {memberName} ({formatMemberRole(member)})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Hourly Rate
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={newRateValue}
                    onChange={(e) => setNewRateValue(e.target.value)}
                    placeholder="e.g. 25.00"
                    disabled={savingRate}
                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Currency
                  </label>
                  <input
                    type="text"
                    value={newRateCurrency}
                    onChange={(e) => setNewRateCurrency(e.target.value)}
                    placeholder="USD"
                    maxLength={8}
                    disabled={savingRate}
                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-orange-200"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-orange-100 bg-orange-50/60 px-3 py-2 text-xs text-slate-600">
                Members with no rate row cannot use the Time page or timer actions.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-orange-100 px-6 py-4 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsAddRateModalOpen(false)}
                disabled={savingRate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void createRate()}
                disabled={savingRate || loadingMembers}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md border border-orange-300 bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                Save Rate
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditRateModalOpen && canManageRates && editingRateId && (
        <div
          className="fixed inset-0 z-[170] flex items-center justify-center bg-slate-900/55 backdrop-blur-[2px] p-4"
          onClick={closeEditRateModal}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Edit Team Rate</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {editingRateTarget?.member?.display_name ||
                    editingRateTarget?.member?.email ||
                    editingRateTarget?.member_user_id}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditRateModal}
                className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Hourly Rate
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={editingRateValue}
                  onChange={(e) => setEditingRateValue(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Currency
                </label>
                <input
                  type="text"
                  maxLength={8}
                  value={editingRateCurrency}
                  onChange={(e) => setEditingRateCurrency(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md uppercase"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-4 bg-gray-50">
              <button
                type="button"
                onClick={closeEditRateModal}
                disabled={savingRate}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveEditedRate(editingRateId)}
                disabled={savingRate}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
