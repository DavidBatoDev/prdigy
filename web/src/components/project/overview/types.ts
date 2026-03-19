import type { RoadmapMilestone } from "@/types/roadmap";

export type ProjectBrief = {
  mission_vision?: string | null;
  scope_statement?: string | null;
  requirements?: unknown;
  constraints?: string | null;
  risk_register?: unknown;
  visibility_mask?: Record<string, unknown> | null;
  notes?: string | null;
};

export type BriefStorageMode = "visibility_mask" | "notes" | "none";

export type OverviewTimelineItem = {
  id: string;
  title: string;
  target_date: string;
  status: RoadmapMilestone["status"];
  kind: "epic" | "feature" | "task";
};
