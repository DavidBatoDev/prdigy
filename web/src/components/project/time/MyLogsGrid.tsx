import { useMemo, type CSSProperties } from "react";
import { Pencil, Plus, Square, Trash2 } from "lucide-react";
import DataGrid, { type Column, type RenderCellProps } from "react-data-grid";
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
  taskSavingById: Record<string, boolean>;
  rowActionLoadingById: Record<string, boolean>;
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
  taskSavingById,
  rowActionLoadingById,
  onTaskChange,
  onStopLog,
  onDeleteLog,
  onEditLog,
  onOpenAddLog,
}: MyLogsGridProps) {
  const rowHeight = 52;
  const headerRowHeight = 44;
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
      return {
        id: log.id,
        date: Number.isNaN(startedDate.getTime())
          ? "-"
          : fullDateFormatter.format(startedDate),
        task_id: log.task_id,
        task_title: log.task?.title ?? taskTitleById.get(log.task_id) ?? "Task",
        time_in: Number.isNaN(startedDate.getTime())
          ? "-"
          : timeFormatter.format(startedDate),
        time_out:
          endedDate && !Number.isNaN(endedDate.getTime())
            ? timeFormatter.format(endedDate)
            : "Running",
        hours_worked: hoursWorked,
        fees,
        is_running: !log.ended_at,
        log,
      };
    });
    const minimumRows = 10;
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
  }, [fullDateFormatter, logs, ownRate, taskTitleById, timeFormatter, timerNowMs]);

  const columns = useMemo<Column<MyLogGridRow>[]>(() => {
    return [
      { key: "date", name: "Dates", minWidth: 260, width: 300 },
      {
        key: "task_id",
        name: "Task",
        minWidth: 220,
        renderCell: ({ row }: RenderCellProps<MyLogGridRow>) => (
          row.is_placeholder ? null : (
            <TaskTreePicker
              tasks={tasks}
              value={row.task_id}
              onChange={(taskId) => void onTaskChange(row.log, taskId)}
              disabled={taskSavingById[row.id] || loadingTasks || tasks.length === 0}
              triggerClassName="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-left"
              selectedLabelMode="task"
              panelClassName="max-h-72 overflow-auto rounded-md border border-gray-200 bg-white p-1 shadow-lg"
            />
          )
        ),
      },
      { key: "time_in", name: "Time-in", minWidth: 120, width: 140 },
      { key: "time_out", name: "Time-Out", minWidth: 120, width: 140 },
      {
        key: "hours_worked",
        name: "Hours Works (float)",
        minWidth: 130,
        width: 150,
        renderCell: ({ row }: RenderCellProps<MyLogGridRow>) => (
          row.is_placeholder ? null : (
            <span className="text-xs font-semibold text-gray-700">
              {row.hours_worked.toFixed(2)}
            </span>
          )
        ),
      },
      {
        key: "fees",
        name: "Fees",
        minWidth: 120,
        width: 140,
        renderCell: ({ row }: RenderCellProps<MyLogGridRow>) => (
          row.is_placeholder ? null : (
            <span className="text-xs font-semibold text-emerald-700">
              {row.fees === null
                ? "-"
                : `${row.fees.toFixed(2)} ${ownRate?.currency || "USD"}`}
            </span>
          )
        ),
      },
      {
        key: "actions",
        name: "Actions",
        minWidth: 130,
        width: 150,
        renderCell: ({ row }: RenderCellProps<MyLogGridRow>) => (
          row.is_placeholder ? (
            row.placeholder_index === 0 ? (
              <button
                type="button"
                onClick={onOpenAddLog}
                title="Add Log"
                aria-label="Add Log"
                className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-[#ff9933]/40 bg-[#ff9933]/10 text-[#b35f00] hover:bg-[#ff9933]/20"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            ) : null
          ) : (
            <div className="flex items-center gap-1">
              {row.is_running && (
                <button
                  type="button"
                  onClick={() => void onStopLog(row.id)}
                  disabled={rowActionLoadingById[row.id]}
                  title="Stop Timer"
                  aria-label="Stop Timer"
                  className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-rose-200 bg-rose-50 text-rose-700 disabled:opacity-50"
                >
                  <Square className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onEditLog(row.log)}
                title="Edit Log"
                aria-label="Edit Log"
                className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => void onDeleteLog(row.id)}
                disabled={rowActionLoadingById[row.id]}
                title="Delete Log"
                aria-label="Delete Log"
                className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        ),
      },
    ];
  }, [
    loadingTasks,
    onEditLog,
    onDeleteLog,
    onStopLog,
    onTaskChange,
    ownRate?.currency,
    rowActionLoadingById,
    taskSavingById,
    tasks,
  ]);

  if (loadingLogs) return <MyLogsGridSkeleton />;
  return (
    <div className="rounded-xl border border-gray-200">
      <DataGrid
        columns={columns}
        rows={rows}
        rowHeight={rowHeight}
        headerRowHeight={headerRowHeight}
        className="rdg-light text-xs my-logs-rdg"
        style={
          {
            height: rows.length * rowHeight + headerRowHeight + 2,
            "--rdg-header-background-color": "var(--primary)",
          } as CSSProperties
        }
      />
    </div>
  );
}
