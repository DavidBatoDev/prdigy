import { useMemo } from "react";
import { Loader2, Pencil, Plus, Square, Trash2 } from "lucide-react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type {
  ProjectMemberTimeRate,
  ProjectTaskOption,
  TaskTimeLog,
} from "@/services/project-time.service";
import { liveDurationSecondsFromLog } from "./time-utils";
import { TaskTreePicker } from "./TaskTreePicker";

type MyLogGridRow = {
  id: string;
  is_placeholder?: boolean;
  placeholder_index?: number;
  date: string;
  task_id: string;
  task_title: string;
  time_in: string;
  time_out: string;
  hours_worked: number;
  fees: number | null;
  is_running: boolean;
  log: TaskTimeLog;
};

function MyLogsGridSkeleton() {
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

interface MyLogsGridProps {
  logs: TaskTimeLog[];
  tasks: ProjectTaskOption[];
  ownRate: ProjectMemberTimeRate | null;
  loadingLogs: boolean;
  loadingTasks: boolean;
  timerNowMs: number;
  taskSyncById: Record<string, boolean>;
  rowPendingById: Record<string, boolean>;
  onTaskChange: (log: TaskTimeLog, taskId: string) => void | Promise<void>;
  onStopLog: (logId: string) => void | Promise<void>;
  onDeleteLog: (logId: string) => void | Promise<void>;
  onEditLog: (log: TaskTimeLog) => void;
  onOpenAddLog: () => void;
}

export function MyLogsGrid({
  logs,
  tasks,
  ownRate,
  loadingLogs,
  loadingTasks,
  timerNowMs,
  taskSyncById,
  rowPendingById,
  onTaskChange,
  onStopLog,
  onDeleteLog,
  onEditLog,
  onOpenAddLog,
}: MyLogsGridProps) {
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

  const taskTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const task of tasks) map.set(task.id, task.title);
    return map;
  }, [tasks]);

  const rows = useMemo<MyLogGridRow[]>(() => {
    const hourlyRate = ownRate ? Number(ownRate.hourly_rate) : null;
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
        task_title: log.task?.title ?? taskTitleById.get(log.task_id) ?? "Task",
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
        is_running: !log.ended_at,
        log,
      };
    });
    const minimumRows = Math.max(4, populatedRows.length + 1);
    if (populatedRows.length >= minimumRows) return populatedRows;
    const emptyCount = minimumRows - populatedRows.length;
    const emptyRows: MyLogGridRow[] = Array.from({ length: emptyCount }).map(
      (_, idx) => ({
        id: `empty-${idx}`,
        is_placeholder: true,
        placeholder_index: idx,
        date: "",
        task_id: "",
        task_title: "",
        time_in: "",
        time_out: "",
        hours_worked: 0,
        fees: null,
        is_running: false,
        log: null as unknown as TaskTimeLog,
      }),
    );
    return [...populatedRows, ...emptyRows];
  }, [
    fullDateFormatter,
    logs,
    ownRate,
    shortDateFormatter,
    shortDateTimeFormatter,
    taskTitleById,
    timeFormatter,
    timerNowMs,
  ]);
  const columnHelper = createColumnHelper<MyLogGridRow>();
  const columns = useMemo(
    () => [
      columnHelper.accessor("date", {
        id: "date",
        header: "Dates",
        cell: (info) =>
          info.row.original.is_placeholder ? null : info.getValue(),
      }),
      columnHelper.accessor("task_id", {
        id: "task_id",
        header: "Task",
        cell: (info) => {
          const row = info.row.original;
          if (row.is_placeholder) return null;
          return (
            <div className="flex items-center gap-1.5">
              <TaskTreePicker
                tasks={tasks}
                value={row.task_id}
                onChange={(taskId) => void onTaskChange(row.log, taskId)}
                disabled={loadingTasks || tasks.length === 0}
                triggerClassName="w-full rounded-md border border-gray-300 bg-white px-2 py-0.5 text-[11px] leading-tight text-left"
                selectedLabelMode="task"
                panelClassName="max-h-72 overflow-auto rounded-md border border-gray-200 bg-white p-1 shadow-lg"
              />
              {taskSyncById[row.id] && (
                <Loader2
                  className="h-3.5 w-3.5 shrink-0 animate-spin text-[#b35f00]"
                  aria-label="Task update syncing"
                />
              )}
            </div>
          );
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
                : `${row.fees.toFixed(2)} ${ownRate?.currency || "USD"}`}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => {
          const row = info.row.original;
          if (row.is_placeholder) {
            return row.placeholder_index === 0 ? (
              <button
                type="button"
                onClick={onOpenAddLog}
                title="Add Log"
                aria-label="Add Log"
                className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-[#ff9933]/40 bg-[#ff9933]/10 text-[#b35f00] hover:bg-[#ff9933]/20 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            ) : null;
          }

          return (
            <div className="flex items-center gap-1">
              {row.is_running && (
                <button
                  type="button"
                  onClick={() => void onStopLog(row.id)}
                  disabled={rowPendingById[row.id]}
                  title="Stop Timer"
                  aria-label="Stop Timer"
                  className="inline-flex items-center justify-center h-7 w-8 rounded-md border border-rose-200 bg-rose-50 text-rose-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Square className="h-3.5 w-3.5" />
                </button>
              )}
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
              <button
                type="button"
                onClick={() => void onDeleteLog(row.id)}
                disabled={rowPendingById[row.id]}
                title="Delete Log"
                aria-label="Delete Log"
                className="inline-flex items-center justify-center h-7 w-8 rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              {rowPendingById[row.id] && (
                <Loader2
                  className="h-3.5 w-3.5 shrink-0 animate-spin text-gray-500"
                  aria-label="Row pending"
                />
              )}
            </div>
          );
        },
      }),
    ],
    [
      columnHelper,
      loadingTasks,
      onDeleteLog,
      onEditLog,
      onOpenAddLog,
      onStopLog,
      onTaskChange,
      ownRate?.currency,
      rowPendingById,
      taskSyncById,
      tasks,
    ],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loadingLogs) return <MyLogsGridSkeleton />;
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <table className="w-full table-fixed text-[11px]">
        <colgroup>
          <col className="w-[22%]" />
          <col className="w-[21%]" />
          <col className="w-[15%]" />
          <col className="w-[15%]" />
          <col className="w-[9%]" />
          <col className="w-[9%]" />
          <col className="w-[9%]" />
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
