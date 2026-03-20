import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { projectTimeService, type TaskTimeLog } from "@/services/project-time.service";
import { projectService, type ProjectPermissions } from "@/services/project.service";

type TimeTab = "my_logs" | "team_logs" | "approvals";

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
  canReview,
  onApprove,
  onReject,
  disabled,
  nowMs,
}: {
  log: TaskTimeLog;
  canReview: boolean;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  disabled?: boolean;
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
            {new Date(log.started_at).toLocaleString()}{" "}
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

      {canReview && (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => void onApprove(log.id)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approve
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => void onReject(log.id)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" />
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

function TimePage() {
  const { projectId } = Route.useParams();

  const [permissions, setPermissions] = useState<ProjectPermissions | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TimeTab>("my_logs");
  const [myLogs, setMyLogs] = useState<TaskTimeLog[]>([]);
  const [approvalLogs, setApprovalLogs] = useState<TaskTimeLog[]>([]);
  const [teamLogs, setTeamLogs] = useState<TaskTimeLog[]>([]);
  const [loadingMyLogs, setLoadingMyLogs] = useState(false);
  const [loadingTeamLogs, setLoadingTeamLogs] = useState(false);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timerNowMs, setTimerNowMs] = useState(Date.now());

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

  const canApprove = permissions?.time?.approve === true;
  const canEditTeamLogs = permissions?.time?.edit_team === true;

  const loadMyLogs = async () => {
    try {
      setLoadingMyLogs(true);
      setError(null);
      const result = await projectTimeService.listMyLogs(projectId, {
        page: 1,
        limit: 50,
      });
      setMyLogs(result.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load your logs.");
      setMyLogs([]);
    } finally {
      setLoadingMyLogs(false);
    }
  };

  const loadApprovalLogs = async () => {
    if (!canApprove) return;
    try {
      setLoadingApprovals(true);
      setError(null);
      const result = await projectTimeService.listApprovals(projectId, {
        page: 1,
        limit: 50,
        status: "pending",
      });
      setApprovalLogs(result.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load approvals.");
      setApprovalLogs([]);
    } finally {
      setLoadingApprovals(false);
    }
  };

  const loadTeamLogs = async () => {
    if (!canEditTeamLogs) return;
    try {
      setLoadingTeamLogs(true);
      setError(null);
      const result = await projectTimeService.listTeamLogs(projectId, {
        page: 1,
        limit: 50,
      });
      setTeamLogs(result.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load team logs.");
      setTeamLogs([]);
    } finally {
      setLoadingTeamLogs(false);
    }
  };

  useEffect(() => {
    void loadMyLogs();
  }, [projectId]);

  useEffect(() => {
    if (!canApprove) return;
    void loadApprovalLogs();
  }, [projectId, canApprove]);

  useEffect(() => {
    if (!canEditTeamLogs) return;
    void loadTeamLogs();
  }, [projectId, canEditTeamLogs]);

  const hasActiveLog = useMemo(() => {
    return (
      myLogs.some((log) => !log.ended_at) ||
      teamLogs.some((log) => !log.ended_at) ||
      approvalLogs.some((log) => !log.ended_at)
    );
  }, [myLogs, teamLogs, approvalLogs]);

  useEffect(() => {
    if (!hasActiveLog) return;
    const interval = window.setInterval(() => setTimerNowMs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [hasActiveLog]);

  const approve = async (id: string) => {
    try {
      setActionLoading(true);
      await projectTimeService.review(id, "approved");
      await Promise.all([loadMyLogs(), loadApprovalLogs()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to approve log.");
    } finally {
      setActionLoading(false);
    }
  };

  const reject = async (id: string) => {
    try {
      setActionLoading(true);
      await projectTimeService.review(id, "rejected");
      await Promise.all([loadMyLogs(), loadApprovalLogs()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reject log.");
    } finally {
      setActionLoading(false);
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
          Track task time logs and approve member entries.
        </p>
      </div>

      {loadingPermissions ? (
        <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full p-1 mb-5 animate-pulse">
          <div className="h-8 w-24 rounded-full bg-gray-200" />
          <div className="h-8 w-24 rounded-full bg-gray-200" />
          <div className="h-8 w-24 rounded-full bg-gray-200" />
        </div>
      ) : (
        <div className="inline-flex items-center gap-1 bg-gray-100 rounded-full p-1 mb-5">
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
          {canEditTeamLogs && (
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
          {canApprove && (
            <button
              type="button"
              onClick={() => setActiveTab("approvals")}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === "approvals"
                  ? "bg-[#ff9933] text-white"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              Approvals
            </button>
          )}
        </div>
      )}

      {(error || permissionsError) && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error || permissionsError}
        </div>
      )}

      {activeTab === "my_logs" && (
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
                canReview={false}
                onApprove={approve}
                onReject={reject}
                nowMs={timerNowMs}
              />
            ))
          )}
        </div>
      )}

      {activeTab === "approvals" && canApprove && (
        <div className="space-y-3">
          {loadingApprovals ? (
            <>
              <TimeLogRowSkeleton />
              <TimeLogRowSkeleton />
              <TimeLogRowSkeleton />
            </>
          ) : approvalLogs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <p className="text-sm text-gray-500">No pending logs to review.</p>
            </div>
          ) : (
            approvalLogs.map((log) => (
              <TimeLogRow
                key={log.id}
                log={log}
                canReview
                onApprove={approve}
                onReject={reject}
                disabled={actionLoading}
                nowMs={timerNowMs}
              />
            ))
          )}
        </div>
      )}

      {activeTab === "team_logs" && canEditTeamLogs && (
        <div className="space-y-3">
          {loadingTeamLogs ? (
            <>
              <TimeLogRowSkeleton />
              <TimeLogRowSkeleton />
              <TimeLogRowSkeleton />
            </>
          ) : teamLogs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <p className="text-sm text-gray-500">No team logs yet.</p>
            </div>
          ) : (
            teamLogs.map((log) => (
              <TimeLogRow
                key={log.id}
                log={log}
                canReview={false}
                onApprove={approve}
                onReject={reject}
                disabled={actionLoading}
                nowMs={timerNowMs}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
