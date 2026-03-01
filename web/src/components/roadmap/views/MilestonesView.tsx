import { useState, useMemo, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  BarChart2,
  ExternalLink,
} from "lucide-react";
import type { Roadmap, RoadmapEpic, RoadmapMilestone } from "@/types/roadmap";
import { calculateFeatureProgressFromTasks } from "../shared/featureProgress";

// ─── Types ────────────────────────────────────────────────────────────────────

type Granularity = "day" | "week" | "month" | "year";

// ─── Constants ────────────────────────────────────────────────────────────────

const COL_WIDTH: Record<Granularity, number> = {
  day: 40,
  week: 100,
  month: 96,
  year: 160,
};

// Pixels per calendar day for each granularity
const PX_PER_DAY: Record<Granularity, number> = {
  day: 40,
  week: 100 / 7,
  month: 96 / 30,
  year: 160 / 365,
};

const MS_PER_DAY = 86_400_000;
const LEFT_WIDTH = 320;
const ROW_HEIGHT = 44;
const SUPER_ROW_H = 22;
const SUB_ROW_H = 30;
const HEADER_HEIGHT = SUPER_ROW_H + SUB_ROW_H;
const FEATURE_BAR_HEIGHT = 28;
const FEATURE_BAR_ROUNDED_CLASS = "rounded-sm";
const FEATURE_BAR_TRACK_COLOR = "#cbd5e1";
const FEATURE_BAR_FILL_COLOR = "#2563eb";
const FEATURE_BAR_BORDER_COLOR = "#94a3b8";
const FEATURE_LABEL_CHAR_PX = 6;
const FEATURE_LABEL_HORIZONTAL_PADDING = 16;
const FEATURE_LABEL_MIN_INSIDE_WIDTH = 52;
const FEATURE_LABEL_OUTSIDE_GAP = 8;
const EPIC_LINE_HEIGHT = 4;
const EPIC_LINE_OPACITY = 0.4;

// ─── Date helpers ─────────────────────────────────────────────────────────────

function floorToUnit(d: Date, g: Granularity): Date {
  switch (g) {
    case "day":
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    case "week": {
      const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
      return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
    }
    case "month":
      return new Date(d.getFullYear(), d.getMonth(), 1);
    case "year":
      return new Date(d.getFullYear(), 0, 1);
  }
}

function addInterval(d: Date, g: Granularity, n = 1): Date {
  const r = new Date(d);
  switch (g) {
    case "day":
      r.setDate(r.getDate() + n);
      break;
    case "week":
      r.setDate(r.getDate() + n * 7);
      break;
    case "month":
      r.setMonth(r.getMonth() + n);
      break;
    case "year":
      r.setFullYear(r.getFullYear() + n);
      break;
  }
  return r;
}

function getColumns(start: Date, end: Date, g: Granularity): Date[] {
  const cols: Date[] = [];
  let cur = floorToUnit(start, g);
  while (cur.getTime() <= end.getTime()) {
    cols.push(new Date(cur));
    cur = addInterval(cur, g);
  }
  return cols;
}

// ISO week number (Mon-based)
function getISOWeek(d: Date): number {
  const tmp = new Date(d);
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const w1 = new Date(tmp.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((tmp.getTime() - w1.getTime()) / MS_PER_DAY -
        3 +
        ((w1.getDay() + 6) % 7)) /
        7,
    )
  );
}

// Sub-row label per column
function subLabel(d: Date, g: Granularity): string {
  switch (g) {
    case "day":
      return String(d.getDate());
    case "week": {
      const wn = getISOWeek(d);
      return `W${String(wn).padStart(2, "0")}`;
    }
    case "month":
      return d.toLocaleDateString("en-US", { month: "short" });
    case "year":
      return String(d.getFullYear());
  }
}

// ISO week year — the year the ISO week logically belongs to (W01 of 2026 starts Dec 29 2025, so year = 2026)
function getISOWeekYear(d: Date): number {
  const tmp = new Date(d);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  return tmp.getFullYear();
}

type SuperGroup = { label: string; colCount: number };

// Super-row groups (null = no super row, i.e. year granularity)
function getSuperGroups(columns: Date[], g: Granularity): SuperGroup[] | null {
  if (g === "year") return null;

  const groups: SuperGroup[] = [];
  let cur = "";
  let count = 0;

  for (const col of columns) {
    const label =
      g === "month"
        ? String(col.getFullYear())
        : g === "week"
          ? String(getISOWeekYear(col)) // group by ISO week year so W01 always sits under its own year
          : col.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    if (label !== cur) {
      if (cur) groups.push({ label: cur, colCount: count });
      cur = label;
      count = 1;
    } else {
      count++;
    }
  }
  if (cur) groups.push({ label: cur, colCount: count });
  return groups;
}

function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / MS_PER_DAY;
}

function toPx(date: Date, timelineStart: Date, pxPerDay: number): number {
  return daysBetween(timelineStart, date) * pxPerDay;
}

function computeEpicRange(
  epic: RoadmapEpic,
): { start: Date; end: Date } | null {
  const ts: number[] = [];
  for (const f of epic.features ?? []) {
    if (f.start_date) ts.push(new Date(f.start_date).getTime());
    if (f.end_date) ts.push(new Date(f.end_date).getTime());
  }
  if (ts.length === 0) return null;
  return {
    start: new Date(Math.min(...ts)),
    end: new Date(Math.max(...ts)),
  };
}

function getTimelineRange(
  epics: RoadmapEpic[],
  g: Granularity,
): { start: Date; end: Date } {
  const ts: number[] = [];
  for (const e of epics) {
    for (const f of e.features ?? []) {
      if (f.start_date) ts.push(new Date(f.start_date).getTime());
      if (f.end_date) ts.push(new Date(f.end_date).getTime());
    }
  }

  const today = new Date();
  const anchor =
    ts.length === 0
      ? { min: today, max: today }
      : { min: new Date(Math.min(...ts)), max: new Date(Math.max(...ts)) };

  const { min, max } = anchor;

  switch (g) {
    case "day": {
      const start = new Date(min);
      start.setDate(start.getDate() - 28);
      const end = new Date(max);
      end.setDate(end.getDate() + 28);
      return { start, end };
    }
    case "week": {
      const start = new Date(min);
      start.setDate(start.getDate() - 20 * 7);
      const end = new Date(max);
      end.setDate(end.getDate() + 20 * 7);
      return { start, end };
    }
    case "month": {
      return {
        start: new Date(min.getFullYear(), min.getMonth() - 12, 1),
        end: new Date(max.getFullYear(), max.getMonth() + 12, 1),
      };
    }
    case "year": {
      return {
        start: new Date(min.getFullYear() - 4, 0, 1),
        end: new Date(max.getFullYear() + 4, 0, 1),
      };
    }
  }
}

function fmtShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtMonthDay(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtEpicDateRange(start: Date, end: Date): string {
  const sameMonthYear =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth();
  if (sameMonthYear) {
    return `${start.toLocaleDateString("en-US", { month: "short" })} ${start.getDate()} - ${end.getDate()}`;
  }
  return `${fmtMonthDay(start)} - ${fmtMonthDay(end)}`;
}

function getInclusiveDays(start: Date, end: Date): number {
  const s = floorToUnit(start, "day");
  const e = floorToUnit(end, "day");
  return Math.max(1, Math.round(daysBetween(s, e)) + 1);
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface MilestonesViewProps {
  roadmap: Roadmap;
  milestones: RoadmapMilestone[];
  epics: RoadmapEpic[];
  onUpdateMilestone: (milestone: RoadmapMilestone) => void;
  onDeleteMilestone: (id: string) => void;
}

export const MilestonesView = ({ epics }: MilestonesViewProps) => {
  const [granularity, setGranularity] = useState<Granularity>("month");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const toggle = (id: string) =>
    setCollapsed((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const sortedEpics = useMemo(
    () => [...epics].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [epics],
  );

  const { rangeStart, columns, pxPerDay, superGroups } = useMemo(() => {
    const range = getTimelineRange(sortedEpics, granularity);
    const cols = getColumns(range.start, range.end, granularity);
    return {
      rangeStart: cols[0] ?? range.start, // must match the first column — not the raw range start
      columns: cols,
      pxPerDay: PX_PER_DAY[granularity],
      superGroups: getSuperGroups(cols, granularity),
    };
  }, [sortedEpics, granularity]);

  const cw = COL_WIDTH[granularity];
  const totalWidth = columns.length * cw;
  const todayPx = toPx(new Date(), rangeStart, pxPerDay);
  // Column highlight: find which column bucket today falls in
  const todayColIndex = todayPx >= 0 ? Math.floor(todayPx / cw) : -1;
  const todayColLeft = todayColIndex * cw;
  const todayColInRange = todayColIndex >= 0 && todayColLeft < totalWidth;
  const hasAnyDates = sortedEpics.some((e) =>
    (e.features ?? []).some((f) => f.start_date || f.end_date),
  );

  // Scroll to center today whenever granularity changes or on first mount.
  // Use rAF so the browser has painted the new column layout before we measure clientWidth.
  useEffect(() => {
    let raf: number;
    const run = () => {
      const el = scrollRef.current;
      if (!el) return;
      const visibleWidth = el.clientWidth - LEFT_WIDTH;
      // todayPx is relative to the grid area that starts after the sticky LEFT_WIDTH panel.
      // scrollLeft=0 means the grid left-edge is already offset by LEFT_WIDTH on-screen,
      // so we must NOT add LEFT_WIDTH again here.
      const target = todayPx - visibleWidth / 2;
      el.scrollLeft = Math.max(0, target);
    };
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, [todayPx, granularity]);

  // Repeating grid-line background aligned to columns
  const gridBg = {
    backgroundImage: `repeating-linear-gradient(90deg, transparent 0px, transparent ${cw - 1}px, #e5e7eb ${cw - 1}px, #e5e7eb ${cw}px)`,
  };

  const GRANULARITIES: Granularity[] = ["day", "week", "month", "year"];
  const G_LABELS: Record<Granularity, string> = {
    day: "Day",
    week: "Week",
    month: "Month",
    year: "Year",
  };

  return (
    /* Absolute inset-0 ensures the scroll container is always bounded by the parent,
       making overflow-auto actually trigger scrollbars regardless of flex context. */
    <div ref={scrollRef} className="absolute inset-0 overflow-auto bg-white">
      <div style={{ minWidth: LEFT_WIDTH + totalWidth }}>
        {/* ── Sticky Two-Row Header ── */}
        {/* Outer: single flex row — corner spans full height, right side stacks two rows */}
        <div
          className="sticky top-0 z-30 bg-white border-b border-gray-200 flex"
          style={{ height: HEADER_HEIGHT }}
        >
          {/* Corner: pills — spans full header height */}
          <div
            className="shrink-0 sticky left-0 z-40 bg-white border-r border-gray-200 flex items-center gap-1 px-3"
            style={{ width: LEFT_WIDTH, height: HEADER_HEIGHT }}
          >
            {GRANULARITIES.map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                  granularity === g
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-gray-200 bg-white"
                }`}
              >
                {G_LABELS[g]}
              </button>
            ))}
          </div>

          {/* Right side: two stacked rows */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Row 1: super-group spans */}
            <div
              className="flex"
              style={{ height: SUPER_ROW_H, width: totalWidth }}
            >
              {superGroups
                ? superGroups.map((grp, i) => (
                    <div
                      key={i}
                      className="shrink-0 flex items-center justify-center border-r border-gray-200 overflow-hidden"
                      style={{ width: grp.colCount * cw }}
                    >
                      <span className="text-[11px] font-semibold text-blue-500 truncate">
                        {grp.label}
                      </span>
                    </div>
                  ))
                : null}
            </div>

            {/* Row 2: sub-labels */}
            <div
              className="flex border-t border-gray-100"
              style={{ height: SUB_ROW_H, width: totalWidth, ...gridBg }}
            >
              {columns.map((col, i) => (
                <div
                  key={i}
                  className="shrink-0 flex items-center justify-center select-none"
                  style={{
                    width: cw,
                    backgroundColor:
                      i === todayColIndex ? "#fff7ed" : undefined,
                  }}
                >
                  <span
                    className={`text-[11px] font-medium ${
                      i === todayColIndex
                        ? "text-orange-500 font-semibold"
                        : "text-gray-500"
                    }`}
                  >
                    {subLabel(col, granularity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Empty State ── */}
        {!hasAnyDates && (
          <div className="flex items-center justify-center py-24 text-center">
            <div>
              <BarChart2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium text-base">
                No dates set yet
              </p>
              <p className="text-gray-400 text-sm mt-1 max-w-xs">
                Add start and end dates to features to see them on the timeline
              </p>
            </div>
          </div>
        )}

        {/* ── Body ── */}
        {sortedEpics.map((epic) => {
          const isCollapsed = collapsed.has(epic.id);
          const epicColor = epic.color ?? "#6366f1";
          const epicRange = computeEpicRange(epic);
          const features = epic.features ?? [];

          return (
            <div key={epic.id}>
              {/* Epic row */}
              <div
                className="flex border-b border-gray-200"
                style={{ height: ROW_HEIGHT }}
              >
                {/* LEFT: epic label — sticky */}
                <div
                  className="flex items-center gap-1.5 px-3 shrink-0 sticky left-0 z-10 bg-white border-r border-gray-200 cursor-pointer hover:bg-gray-50 select-none group/epic"
                  style={{ width: LEFT_WIDTH }}
                  onClick={() => toggle(epic.id)}
                >
                  <span className="text-gray-400 shrink-0">
                    {isCollapsed ? (
                      <ChevronRight size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </span>
                  <span className="text-sm font-semibold text-gray-800 truncate flex-1">
                    {epic.title}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {features.length}
                  </span>
                  <ExternalLink
                    size={12}
                    className="text-gray-300 shrink-0 opacity-0 group-hover/epic:opacity-100 transition-opacity"
                  />
                </div>

                {/* RIGHT: epic span bar */}
                <div
                  className="relative"
                  style={{ width: totalWidth, ...gridBg }}
                >
                  {/* Today column highlight */}
                  {todayColInRange && (
                    <div
                      className="absolute top-0 bottom-0 pointer-events-none"
                      style={{
                        left: todayColLeft,
                        width: cw,
                        backgroundColor: "#f97316",
                        opacity: 0.07,
                      }}
                    />
                  )}
                  {/* Epic span marker: text + thin line */}
                  {epicRange &&
                    (() => {
                      const left = toPx(epicRange.start, rangeStart, pxPerDay);
                      const right = toPx(epicRange.end, rangeStart, pxPerDay);
                      const lineLeft = Math.max(0, left);
                      const lineWidth = Math.max(6, right - left);
                      const durationDays = getInclusiveDays(
                        epicRange.start,
                        epicRange.end,
                      );
                      const epicLabel = `${epic.title} • ${fmtEpicDateRange(epicRange.start, epicRange.end)} • (${durationDays} day${durationDays > 1 ? "s" : ""})`;
                      return (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
                          style={{
                            left: lineLeft,
                          }}
                        >
                          <div className="text-[11px] text-gray-700 font-medium whitespace-nowrap truncate max-w-[420px]">
                            {epicLabel}
                          </div>
                          <div
                            className="mt-1 rounded-sm"
                            style={{
                              width: lineWidth,
                              height: EPIC_LINE_HEIGHT,
                              backgroundColor: epicColor,
                              opacity: EPIC_LINE_OPACITY,
                            }}
                          />
                        </div>
                      );
                    })()}
                </div>
              </div>

              {/* Feature rows */}
              {!isCollapsed &&
                features.map((feature) => {
                  const hasDates = !!(feature.start_date && feature.end_date);
                  const taskProgress = calculateFeatureProgressFromTasks(
                    feature.tasks,
                  );
                  const clampedProgress = Math.max(
                    0,
                    Math.min(100, taskProgress),
                  );
                  const barLeft = hasDates
                    ? toPx(new Date(feature.start_date!), rangeStart, pxPerDay)
                    : 0;
                  const barRight = hasDates
                    ? toPx(new Date(feature.end_date!), rangeStart, pxPerDay)
                    : 0;
                  const barWidth = Math.max(6, barRight - barLeft);
                  const rawFillWidth = (barWidth * clampedProgress) / 100;
                  const fillWidth =
                    clampedProgress > 0 ? Math.max(3, rawFillWidth) : 0;
                  const estimatedLabelWidth =
                    feature.title.length * FEATURE_LABEL_CHAR_PX +
                    FEATURE_LABEL_HORIZONTAL_PADDING;
                  const labelFitsInside =
                    barWidth >=
                    Math.max(
                      FEATURE_LABEL_MIN_INSIDE_WIDTH,
                      estimatedLabelWidth,
                    );
                  const tooltip = hasDates
                    ? `${fmtShort(feature.start_date!)} → ${fmtShort(feature.end_date!)} • ${clampedProgress}%`
                    : "No dates set";

                  return (
                    <div
                      key={feature.id}
                      className="flex border-b border-gray-100"
                      style={{ height: ROW_HEIGHT }}
                    >
                      {/* LEFT: feature label — sticky */}
                      <div
                        className="flex items-center gap-1.5 px-3 pl-7 shrink-0 sticky left-0 z-10 bg-white border-r border-gray-200 hover:bg-gray-50/60"
                        style={{ width: LEFT_WIDTH }}
                      >
                        {(feature.tasks?.length ?? 0) > 0 ? (
                          <ChevronRight
                            size={12}
                            className="text-gray-400 shrink-0"
                          />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0 mx-px" />
                        )}
                        <span className="text-xs text-gray-600 truncate flex-1">
                          {feature.title}
                        </span>
                        {(feature.tasks?.length ?? 0) > 0 && (
                          <span className="text-xs text-gray-400 shrink-0">
                            {feature.tasks!.length}
                          </span>
                        )}
                      </div>

                      {/* RIGHT: feature bar */}
                      <div
                        className="relative"
                        style={{ width: totalWidth, ...gridBg }}
                      >
                        {/* Today column highlight */}
                        {todayColInRange && (
                          <div
                            className="absolute top-0 bottom-0 pointer-events-none"
                            style={{
                              left: todayColLeft,
                              width: cw,
                              backgroundColor: "#f97316",
                              opacity: 0.07,
                            }}
                          />
                        )}
                        {/* Bar */}
                        {hasDates && (
                          <>
                            <div
                              className={`absolute top-1/2 -translate-y-1/2 ${FEATURE_BAR_ROUNDED_CLASS} group cursor-default`}
                              style={{
                                left: Math.max(0, barLeft),
                                width: barWidth,
                                height: FEATURE_BAR_HEIGHT,
                                backgroundColor: FEATURE_BAR_TRACK_COLOR,
                                borderColor: FEATURE_BAR_BORDER_COLOR,
                                borderWidth: 1,
                              }}
                            >
                              <div
                                className={`absolute left-0 top-0 bottom-0 ${FEATURE_BAR_ROUNDED_CLASS}`}
                                style={{
                                  width: fillWidth,
                                  backgroundColor: FEATURE_BAR_FILL_COLOR,
                                }}
                              />

                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
                                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap shadow-xl">
                                  <div className="font-semibold mb-0.5">
                                    {feature.title}
                                  </div>
                                  <div className="text-gray-300 text-[11px]">
                                    {tooltip}
                                  </div>
                                </div>
                              </div>

                              {/* Inline label when title fits in the bar */}
                              {labelFitsInside && (
                                <span className="absolute inset-0 flex items-center px-2 text-[10px] text-gray-800 font-medium truncate select-none">
                                  {feature.title}
                                </span>
                              )}
                            </div>

                            {/* Outside label when title doesn't fit in the bar */}
                            {!labelFitsInside && (
                              <span
                                className="absolute top-1/2 -translate-y-1/2 text-[11px] text-gray-700 font-medium whitespace-nowrap select-none pointer-events-none"
                                style={{
                                  left:
                                    Math.max(0, barLeft) +
                                    barWidth +
                                    FEATURE_LABEL_OUTSIDE_GAP,
                                }}
                              >
                                {feature.title}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
