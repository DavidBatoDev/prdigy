import { useMemo } from "react";
import { Check, Loader2, Pencil, X } from "lucide-react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type {
  ProjectMemberTimeRate,
  TaskTimeLog,
} from "@/services/project-time.service";
import { liveDurationSecondsFromLog } from "./time-utils";

type TeamLogGridRow = {
  id: string;
  is_placeholder?: boolean;
  date: string;
  task_id: string;
  task_title: string;
  time_in: string;
  time_out: string;
  hours_worked: number;
  fees: number | null;
  status: TaskTimeLog["status"];
  is_running: boolean;
  log: TaskTimeLog;
};

function TeamMemberLogsGridSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white animate-pulse">
      <div className="h-10 border-b border-gray-200 bg-gray-100" />
      <div className="p-3 space-y-2">
        {Array.from({ length: 7 }).map((_, idx) => (
          <div key={idx} className="h-8 rounded bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

interface TeamMemberLogsGridProps {
  logs: TaskTimeLog[];
  targetRate: ProjectMemberTimeRate | null;
  loadingLogs: boolean;
  timerNowMs: number;
  canEditTeam: boolean;
  canApprove: boolean;
  selectedLogIds: Set<string>;
  rowPendingById: Record<string, boolean>;
  reviewSyncById: Record<string, boolean>;
  onToggleSelectLog: (logId: string, checked: boolean) => void;
  onToggleSelectAll: (checked: boolean, eligibleLogIds: string[]) => void;
  onEditLog: (log: TaskTimeLog) => void;
  onReviewLog: (
    logId: string,
    decision: "approved" | "rejected" | "pending",
  ) => void | Promise<void>;
}

function statusBadgeClass(status: TaskTimeLog["status"]) {
  if (status === "approved") return "bg-emerald-100 text-emerald-700";
  if (status === "rejected") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}

export function TeamMemberLogsGrid({
  logs,
  targetRate,
  loadingLogs,
  timerNowMs,
  canEditTeam,
  canApprove,
  selectedLogIds,
  rowPendingById,
  reviewSyncById,
  onToggleSelectLog,
  onToggleSelectAll,
  onEditLog,
  onReviewLog,
}: TeamMemberLogsGridProps) {
  const fullDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    [],
  );

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    [],
  );

  const shortDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    [],
  );

  const shortDateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    [],
  );

  const rows = useMemo<TeamLogGridRow[]>(() => {
    const hourlyRate = targetRate ? Number(targetRate.hourly_rate) : null;
    const sortedLogs = [...logs].sort((a, b) => {
      const aMs = new Date(a.started_at).getTime();
      const bMs = new Date(b.started_at).getTime();
      return aMs - bMs;
    });

    const populatedRows = sortedLogs.map((log) => {
      const liveSeconds = liveDurationSecondsFromLog(log, timerNowMs);
      const hoursWorked = Number((liveSeconds / 3600).toFixed(2));
      const fees =
        hourlyRate !== null && Number.isFinite(hourlyRate)
          ? Number((hoursWorked * hourlyRate).toFixed(2))
          : null;

      const startedDate = new Date(log.started_at);
      const endedDate = log.ended_at ? new Date(log.ended_at) : null;
      const nowDate = new Date(timerNowMs);
      const hasValidStart = !Number.isNaN(startedDate.getTime());
      const hasValidEnd = Boolean(endedDate && !Number.isNaN(endedDate.getTime()));
      const hasValidNow = !Number.isNaN(nowDate.getTime());
      const endedDateValue: Date | undefined = hasValidEnd
        ? (endedDate as Date)
        : undefined;
      const isMultiDay =
        hasValidStart &&
        hasValidEnd &&
        startedDate.toDateString() !== endedDateValue?.toDateString();

      return {
        id: log.id,
        date: !hasValidStart
          ? "-"
          : isMultiDay
            ? `${shortDateFormatter.format(startedDate)} - ${shortDateFormatter.format(
                endedDateValue,
              )}`
            : fullDateFormatter.format(startedDate),
        task_id: log.task_id,
        task_title: log.task?.title ?? "Task",
        time_in: !hasValidStart
          ? "-"
          : isMultiDay
            ? shortDateTimeFormatter.format(startedDate)
            : timeFormatter.format(startedDate),
        time_out: hasValidEnd
          ? isMultiDay
            ? shortDateTimeFormatter.format(endedDateValue)
            : timeFormatter.format(endedDateValue)
          : !hasValidNow
            ? "-"
            : hasValidStart && startedDate.toDateString() !== nowDate.toDateString()
              ? shortDateTimeFormatter.format(nowDate)
              : timeFormatter.format(nowDate),
        hours_worked: hoursWorked,
        fees,
        status: log.status,
        is_running: !log.ended_at,
        log,
      };
    });

    const minimumRows = Math.max(4, populatedRows.length);
    if (populatedRows.length >= minimumRows) return populatedRows;

    const emptyCount = minimumRows - populatedRows.length;
    const emptyRows: TeamLogGridRow[] = Array.from({ length: emptyCount }).map(
      (_, idx) => ({
        id: `empty-${idx}`,
        is_placeholder: true,
        date: "",
        task_id: "",
        task_title: "",
        time_in: "",
        time_out: "",
        hours_worked: 0,
        fees: null,
        status: "pending",
        is_running: false,
        log: null as unknown as TaskTimeLog,
      }),
    );

    return [...populatedRows, ...emptyRows];
  }, [
    logs,
    targetRate,
    timerNowMs,
    shortDateFormatter,
    fullDateFormatter,
    shortDateTimeFormatter,
    timeFormatter,
  ]);

  const columnHelper = createColumnHelper<TeamLogGridRow>();
  const eligibleRowIds = useMemo(
    () => rows.filter((row) => !row.is_placeholder && !row.is_running).map((row) => row.id),
    [rows],
  );
  const allEligibleSelected =
    eligibleRowIds.length > 0 && eligibleRowIds.every((id) => selectedLogIds.has(id));
  const someEligibleSelected =
    eligibleRowIds.some((id) => selectedLogIds.has(id)) && !allEligibleSelected;

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: () =>
          canApprove ? (
            <input
              type="checkbox"
              aria-label="Select all eligible logs"
              checked={allEligibleSelected}
              ref={(el) => {
                if (el) el.indeterminate = someEligibleSelected;
              }}
              disabled={eligibleRowIds.length === 0}
              onChange={(event) =>
                onToggleSelectAll(event.currentTarget.checked, eligibleRowIds)
              }
              className="h-3.5 w-3.5 rounded border-gray-300"
            />
          ) : null,
        cell: (info) => {
          const row = info.row.original;
          if (row.is_placeholder || !canApprove) return null;
          const isEligible = !row.is_running;
          return (
            <input
              type="checkbox"
              aria-label="Select log row"
              checked={selectedLogIds.has(row.id)}
              disabled={!isEligible || rowPendingById[row.id]}
              onChange={(event) => onToggleSelectLog(row.id, event.currentTarget.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300"
            />
          );
        },
      }),
      columnHelper.accessor("date", {
        id: "date",
        header: "Dates",
        cell: (info) => (info.row.original.is_placeholder ? null : info.getValue()),
      }),
      columnHelper.accessor("task_id", {
        id: "task_id",
        header: "Task",
        cell: (info) => {
          const row = info.row.original;
          if (row.is_placeholder) return null;
          return <span>{row.task_title || "-"}</span>;
        },
      }),
      columnHelper.accessor("time_in", {
        id: "time_in",
        header: "Time-in",
        cell: (info) =>
          info.row.original.is_placeholder ? null : (
            <span className="tabular-nums">{info.getValue()}</span>
          ),
      }),
      columnHelper.accessor("time_out", {
        id: "time_out",
        header: "Time-Out",
        cell: (info) =>
          info.row.original.is_placeholder ? null : (
            <span className="tabular-nums">{info.getValue()}</span>
          ),
      }),
      columnHelper.accessor("hours_worked", {
        id: "hours_worked",
        header: "Hours",
        cell: (info) => {
          const row = info.row.original;
          if (row.is_placeholder) return null;
          return (
            <span className="text-xs font-semibold text-gray-700">
              {row.hours_worked.toFixed(2)}
            </span>
          );
        },
      }),
      columnHelper.accessor("fees", {
        id: "fees",
        header: "Fees",
        cell: (info) => {
          const row = info.row.original;
          if (row.is_placeholder) return null;
          return (
            <span className="text-xs font-semibold text-emerald-700">
              {row.fees === null
                ? "-"
                : `${row.fees.toFixed(2)} ${targetRate?.currency || "USD"}`}
            </span>
          );
        },
      }),
      columnHelper.accessor("status", {
        id: "status",
        header: "Status",
        cell: (info) => {
          const row = info.row.original;
          if (row.is_placeholder) return null;
          return (
            <div className="flex items-center gap-1">
              {row.is_running && (
                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 text-sky-700">
                  running
                </span>
              )}
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusBadgeClass(
                  info.getValue(),
                )}`}
              >
                {info.getValue()}
              </span>
              {(rowPendingById[row.id] || reviewSyncById[row.id]) && (
                <Loader2
                  className="h-3.5 w-3.5 animate-spin text-[#b35f00]"
                  aria-label="Review syncing"
                />
              )}
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => {
          const row = info.row.original;
          if (row.is_placeholder) return null;
          const isRunning = row.is_running;

          return (
            <div className="flex items-center gap-1">
              {canApprove && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      void onReviewLog(
                        row.id,
                        row.status === "approved" ? "pending" : "approved",
                      )
                    }
                    disabled={isRunning || rowPendingById[row.id]}
                    title={isRunning ? "Cannot review a running log" : "Approve"}
                    aria-label="Approve"
                    className={
                      row.status === "approved"
                        ? "inline-flex items-center justify-center h-7 w-8 rounded-md border border-emerald-600 bg-emerald-600 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        : "inline-flex items-center justify-center h-7 w-8 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    }
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void onReviewLog(
                        row.id,
                        row.status === "rejected" ? "pending" : "rejected",
                      )
                    }
                    disabled={isRunning || rowPendingById[row.id]}
                    title={isRunning ? "Cannot review a running log" : "Disapprove"}
                    aria-label="Disapprove"
                    className={
                      row.status === "rejected"
                        ? "inline-flex items-center justify-center h-7 w-8 rounded-md border border-amber-600 bg-amber-600 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        : "inline-flex items-center justify-center h-7 w-8 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    }
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
              {canEditTeam && (
                <button
                  type="button"
                  onClick={() => onEditLog(row.log)}
                  disabled={rowPendingById[row.id]}
                  title="Edit Log"
                  aria-label="Edit Log"
                  className="inline-flex items-center justify-center h-7 w-8 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        },
      }),
    ],
    [
      canApprove,
      canEditTeam,
      columnHelper,
      onEditLog,
      onReviewLog,
      onToggleSelectAll,
      onToggleSelectLog,
      allEligibleSelected,
      eligibleRowIds,
      rowPendingById,
      reviewSyncById,
      selectedLogIds,
      someEligibleSelected,
      targetRate?.currency,
    ],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loadingLogs) return <TeamMemberLogsGridSkeleton />;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <table className="w-full table-fixed text-[11px]">
        <colgroup>
          <col className="w-[4%]" />
          <col className="w-[17%]" />
          <col className="w-[17%]" />
          <col className="w-[12%]" />
          <col className="w-[12%]" />
          <col className="w-[8%]" />
          <col className="w-[9%]" />
          <col className="w-[9%]" />
          <col className="w-[12%]" />
        </colgroup>
        <thead className="bg-[var(--primary)] text-white">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-2 py-2.5 text-left text-sm font-bold border-r border-white/30 last:border-r-0"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className={`border-t border-gray-200 ${
                !row.original.is_placeholder && rowPendingById[row.original.id]
                  ? "bg-amber-50/40"
                  : ""
              }`}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-2 py-1.5 align-middle">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
