import type { Granularity } from "./types";

export const COL_WIDTH: Record<Granularity, number> = {
	day: 40,
	week: 100,
	month: 96,
	year: 160,
};

export const MS_PER_DAY = 86_400_000;
export const LEFT_WIDTH = 320;
export const ROW_HEIGHT = 44;
export const FIRST_EPIC_EXTRA_HEIGHT = 8;
export const SUPER_ROW_H = 28;
export const SUB_ROW_H = 40;
export const DATE_HEADER_HEIGHT = SUPER_ROW_H + SUB_ROW_H;
export const RIGHT_HEADER_HEIGHT = DATE_HEADER_HEIGHT;
export const DEFAULT_EXPLORER_HEADER_HEIGHT = 140;
export const FEATURE_BAR_HEIGHT = 28;
export const FEATURE_BAR_ROUNDED_CLASS = "rounded-sm";
export const FEATURE_BAR_TRACK_COLOR = "#cbd5e1";
export const FEATURE_BAR_FILL_COLOR = "#2563eb";
export const FEATURE_BAR_BORDER_COLOR = "#94a3b8";
export const FEATURE_LABEL_CHAR_PX = 6;
export const FEATURE_LABEL_HORIZONTAL_PADDING = 16;
export const FEATURE_LABEL_MIN_INSIDE_WIDTH = 52;
export const FEATURE_LABEL_OUTSIDE_GAP = 8;
export const EPIC_LINE_HEIGHT = 4;
export const EPIC_LINE_OPACITY = 0.4;

export const GRANULARITIES: Granularity[] = ["day", "week", "month", "year"];

export const G_LABELS: Record<Granularity, string> = {
	day: "Day",
	week: "Week",
	month: "Month",
	year: "Year",
};
