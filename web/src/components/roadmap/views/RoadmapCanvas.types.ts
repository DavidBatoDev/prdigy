import type {
  Roadmap,
  RoadmapMilestone,
  RoadmapEpic,
  RoadmapFeature,
  RoadmapTask,
  FeatureStatus,
} from "@/types/roadmap";

export interface RoadmapCanvasControllerProps {
  roadmap?: Roadmap | null;
  milestones?: RoadmapMilestone[];
  epics?: RoadmapEpic[];
  onUpdateMilestone?: (milestone: RoadmapMilestone) => void;
  onDeleteMilestone?: (id: string) => void;
  onAddEpic?: (
    milestoneId?: string,
    epicInput?: Partial<RoadmapEpic>,
  ) => void | Promise<void>;
  onUpdateEpic?: (epic: RoadmapEpic) => void | Promise<void>;
  onDeleteEpic?: (epicId: string) => void | Promise<void>;
  onAddFeature?: (
    epicId: string,
    data: {
      title: string;
      description: string;
      status: FeatureStatus;
      is_deliverable: boolean;
    },
  ) => void | Promise<void>;
  onUpdateFeature?: (feature: RoadmapFeature) => void | Promise<void>;
  onDeleteFeature?: (featureId: string) => void | Promise<void>;
  onAddTask?: (
    featureId: string,
    taskData: Partial<RoadmapTask>,
  ) => void | Promise<void>;
  onUpdateTask?: (task: RoadmapTask) => void | Promise<void>;
  onDeleteTask?: (taskId: string) => void | Promise<void>;
  focusNodeId?: string | null;
  focusNodeOffsetX?: number;
  onFocusComplete?: () => void;
  navigateToEpicId?: string | null;
  onNavigateToEpicHandled?: () => void;
  navigateToFeature?: { epicId: string; featureId: string } | null;
  onNavigateToFeatureHandled?: () => void;
  openEpicEditorId?: string | null;
  onOpenEpicEditorHandled?: () => void;
  openFeatureEditor?: { epicId: string; featureId: string } | null;
  onOpenFeatureEditorHandled?: () => void;
  openTaskDetailId?: string | null;
  onOpenTaskDetailHandled?: () => void;
  onActiveEpicChange?: (epicId: string | null) => void;
}

export interface RoadmapCanvasProps extends RoadmapCanvasControllerProps {
  projectTitle?: string;
  onUpdateRoadmap?: (roadmap: Roadmap) => void | Promise<void>;
  onAddMilestone?: () => void;
  onShare?: () => void;
  onExport?: () => void;
}

export type UseRoadmapCanvasControllerArgs = RoadmapCanvasControllerProps;