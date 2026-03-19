import type { RoadmapEpic } from "@/types/roadmap";
import { MS_PER_DAY } from "./constants";
import type { Granularity, SuperGroup } from "./types";

export function floorToUnit(d: Date, g: Granularity): Date {
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

export function addInterval(d: Date, g: Granularity, n = 1): Date {
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

export function getColumns(start: Date, end: Date, g: Granularity): Date[] {
	const cols: Date[] = [];
	let cur = floorToUnit(start, g);
	while (cur.getTime() <= end.getTime()) {
		cols.push(new Date(cur));
		cur = addInterval(cur, g);
	}
	return cols;
}

export function getISOWeek(d: Date): number {
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

export function subLabel(d: Date, g: Granularity): string {
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

export function getISOWeekYear(d: Date): number {
	const tmp = new Date(d);
	tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
	return tmp.getFullYear();
}

export function getSuperGroups(
	columns: Date[],
	g: Granularity,
): SuperGroup[] | null {
	if (g === "year") return null;

	const groups: SuperGroup[] = [];
	let cur = "";
	let count = 0;

	for (const col of columns) {
		const label =
			g === "month"
				? String(col.getFullYear())
				: g === "week"
					? String(getISOWeekYear(col))
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

export function daysBetween(a: Date, b: Date): number {
	return (b.getTime() - a.getTime()) / MS_PER_DAY;
}

export function getDaysInMonth(d: Date): number {
	return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function getDaysInYear(year: number): number {
	return new Date(year, 1, 29).getMonth() === 1 ? 366 : 365;
}

export function getDayOfYear(d: Date): number {
	const start = new Date(d.getFullYear(), 0, 1);
	return Math.floor(daysBetween(start, d)) + 1;
}

export function toTimelinePx(
	date: Date,
	timelineStart: Date,
	g: Granularity,
	colWidth: number,
): number {
	const d = floorToUnit(date, "day");
	const s = floorToUnit(timelineStart, "day");

	switch (g) {
		case "day":
			return daysBetween(s, d) * colWidth;
		case "week":
			return (daysBetween(s, d) / 7) * colWidth;
		case "month": {
			const monthStart = new Date(s.getFullYear(), s.getMonth(), 1);
			const monthsSinceStart =
				(d.getFullYear() - monthStart.getFullYear()) * 12 +
				(d.getMonth() - monthStart.getMonth());
			const dayProgress = (d.getDate() - 1) / getDaysInMonth(d);
			return (monthsSinceStart + dayProgress) * colWidth;
		}
		case "year": {
			const yearsSinceStart = d.getFullYear() - s.getFullYear();
			const dayProgress =
				(getDayOfYear(d) - 1) / getDaysInYear(d.getFullYear());
			return (yearsSinceStart + dayProgress) * colWidth;
		}
	}
}

export function computeEpicRange(
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

export function getTimelineRange(
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

export function fmtShort(iso: string): string {
	return new Date(iso).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export function fmtMonthDay(d: Date): string {
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function fmtEpicDateRange(start: Date, end: Date): string {
	const sameMonthYear =
		start.getFullYear() === end.getFullYear() &&
		start.getMonth() === end.getMonth();
	if (sameMonthYear) {
		return `${start.toLocaleDateString("en-US", { month: "short" })} ${start.getDate()} - ${end.getDate()}`;
	}
	return `${fmtMonthDay(start)} - ${fmtMonthDay(end)}`;
}

export function getInclusiveDays(start: Date, end: Date): number {
	const s = floorToUnit(start, "day");
	const e = floorToUnit(end, "day");
	return Math.max(1, Math.round(daysBetween(s, e)) + 1);
}

export function isInteractivePanTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	return Boolean(
		target.closest(
			'button, a, input, textarea, select, label, [role="button"], [data-no-pan="true"]',
		),
	);
}
