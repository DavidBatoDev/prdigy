import type { RoadmapMilestone } from "@/types/roadmap";

export type Granularity = "day" | "week" | "month" | "year";

export type SuperGroup = {
	label: string;
	colCount: number;
};

export type MilestoneMarker = {
	milestone: RoadmapMilestone;
	left: number;
};
