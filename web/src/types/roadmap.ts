// Roadmap Canvas Types
// Matching the database schema from ROADMAP_CANVAS_SCHEMA.md

export type RoadmapStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "archived";
export type MilestoneStatus =
  | "not_started"
  | "in_progress"
  | "at_risk"
  | "completed"
  | "missed";
export type EpicStatus =
  | "backlog"
  | "planned"
  | "in_progress"
  | "in_review"
  | "completed"
  | "on_hold";
export type EpicPriority =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "nice_to_have";
export type FeatureStatus =
  | "not_started"
  | "in_progress"
  | "in_review"
  | "completed"
  | "blocked";
export type TaskStatus =
  | "todo"
  | "in_progress"
  | "in_review"
  | "done"
  | "blocked";
export type TaskPriority = "urgent" | "high" | "medium" | "low";

export interface Roadmap {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  owner_id: string;
  status: RoadmapStatus;
  start_date?: string;
  end_date?: string;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface RoadmapMilestone {
  id: string;
  roadmap_id: string;
  title: string;
  description?: string;
  target_date: string;
  completed_date?: string;
  status: MilestoneStatus;
  position: number;
  color?: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  progress?: number;
  linked_features?: RoadmapFeature[]; // v2.0: Milestones now link to features, not epics
}

export interface RoadmapEpic {
  id: string;
  roadmap_id: string;
  title: string;
  description?: string;
  priority: EpicPriority;
  status: EpicStatus;
  position: number;
  color?: string;
  estimated_hours?: number;
  actual_hours?: number;
  start_date?: string;
  due_date?: string;
  completed_date?: string;
  tags?: string[]; // Legacy: kept for backward compatibility
  labels?: Array<{ id: string; name: string; color: string }>; // New: label objects with colors
  created_at: string;
  updated_at: string;
  // Computed fields
  progress?: number;
  features?: RoadmapFeature[];
}

export interface MilestoneFeatureLink {
  id: string;
  milestone_id: string;
  feature_id: string; // v2.0: Changed from epic_id to feature_id
  position: number;
  created_at: string;
}

export interface RoadmapFeature {
  id: string;
  roadmap_id: string; // v2.0: Denormalized for performance
  epic_id: string;
  title: string;
  description?: string;
  status: FeatureStatus;
  position: number;
  is_deliverable: boolean; // v2.0: Whether this feature counts toward milestone progress
  estimated_hours?: number;
  actual_hours?: number;
  created_at: string;
  updated_at: string;
  // Computed fields
  progress?: number;
  tasks?: RoadmapTask[];
}

export interface RoadmapTask {
  id: string;
  feature_id: string;
  title: string;
  description?: string;
  assignee_id?: string;
  reporter_id?: string;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  estimated_hours?: number;
  actual_hours?: number;
  due_date?: string;
  completed_at?: string;
  labels?: string[];
  checklist?: ChecklistItem[];
  background_color?: string;
  created_at: string;
  updated_at: string;
  // Populated fields
  assignee?: {
    id: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  edited_at?: string;
  created_at: string;
  // Populated fields
  author?: {
    id: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  uploaded_by: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
}

// View modes for the roadmap canvas
export type RoadmapViewMode = "milestone" | "roadmap";

// UI State
export interface RoadmapCanvasState {
  viewMode: RoadmapViewMode;
  selectedMilestoneId?: string;
  selectedEpicId?: string;
  selectedFeatureId?: string;
  selectedTaskId?: string;
  sidePanelOpen: boolean;
  sidePanelContent?: "details" | "comments" | "attachments";
}
