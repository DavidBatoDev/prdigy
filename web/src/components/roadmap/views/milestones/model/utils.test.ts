import { describe, expect, it } from "vitest";
import {
	addDays,
	clampDate,
	dateFromTimelinePx,
	toISODateString,
	toTimelinePx,
} from "./utils";

describe("milestones timeline utils", () => {
	it("keeps day precision when adding days", () => {
		const base = new Date("2026-03-10T15:20:00.000Z");
		expect(toISODateString(addDays(base, 3))).toBe("2026-03-13");
	});

	it("clamps date between min and max", () => {
		const min = new Date("2026-03-05");
		const max = new Date("2026-03-10");
		expect(toISODateString(clampDate(new Date("2026-03-01"), min, max))).toBe(
			"2026-03-05",
		);
		expect(toISODateString(clampDate(new Date("2026-03-20"), min, max))).toBe(
			"2026-03-10",
		);
	});

	it("converts day granularity pixels back to dates", () => {
		const start = new Date("2026-03-01");
		const px = toTimelinePx(new Date("2026-03-12"), start, "day", 40);
		const date = dateFromTimelinePx(px, start, "day", 40);
		expect(toISODateString(date)).toBe("2026-03-12");
	});

	it("converts week granularity pixels back to dates", () => {
		const start = new Date("2026-03-01");
		const px = toTimelinePx(new Date("2026-03-15"), start, "week", 100);
		const date = dateFromTimelinePx(px, start, "week", 100);
		expect(toISODateString(date)).toBe("2026-03-15");
	});
});
