// Widget components for ReactFlow
export { EpicWidget, type EpicWidgetData } from "./widgets/EpicWidget";
export { FeatureWidget, type FeatureWidgetData } from "./widgets/FeatureWidget";
export { TaskWidget, type TaskWidgetData } from "./widgets/TaskWidget";
export { TaskListItem } from "./widgets/TaskListItem";

// View components
export { RoadmapCanvas } from "./views/RoadmapCanvas";
export { RoadmapView } from "./views/RoadmapView";
export { RoadmapViewContent } from "./views/RoadmapViewContent";
export { RoadmapTopBar } from "./views/RoadmapTopBar";
export { EpicTab } from "./views/EpicTab";
export { MilestonesView } from "./views/MilestonesView";

// Panel components
export {
  RoadmapLeftSidePanel,
  RoadmapLeftSidePanel as LeftSidePanel,
  type Message,
} from "./panels/RoadmapLeftSidePanel";
export { SidePanel } from "./panels/SidePanel";
export { ChatPanel } from "./panels/ChatPanel";

// Modal components
export { AddEpicModal } from "./modals/AddEpicModal";
export { AddFeatureModal } from "./modals/AddFeatureModal";
export { ShareRoadmapModal } from "./modals/ShareRoadmapModal";
export {
  ProjectBriefModal,
  type FormData,
  type ProjectState,
} from "./modals/ProjectBriefModal";
export { MakeProjectDialog } from "./modals/MakeProjectDialog";
export { RoadmapModalLayout } from "./modals/RoadmapModalLayout";

// Shared utilities
export { CommentsSection } from "./shared/CommentsSection";
