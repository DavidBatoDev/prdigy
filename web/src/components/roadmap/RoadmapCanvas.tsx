import { useEffect, useState } from "react";
import { X, Plus, Settings, Download, Share2, Briefcase } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  Roadmap,
  RoadmapMilestone,
  RoadmapEpic,
  RoadmapFeature,
  RoadmapTask,
  EpicPriority,
  FeatureStatus,
} from "@/types/roadmap";
import { RoadmapView } from "./RoadmapView";
import { EpicTab } from "./EpicTab";
import { MilestonesView } from "./MilestonesView";
import { SidePanel } from "./SidePanel";
import { AddEpicModal } from "./AddEpicModal";
import { AddFeatureModal } from "./AddFeatureModal";

type ViewMode = "roadmap" | "epic" | "milestones";

// Sortable Epic Tab Component
interface SortableEpicTabProps {
  epic: RoadmapEpic;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}

const SortableEpicTab = ({
  epic,
  isActive,
  onClick,
  onClose,
}: SortableEpicTabProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: epic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 border-b-2 shrink-0 cursor-pointer transition-colors text-sm font-medium ${
        isActive
          ? "text-gray-900 border-gray-900"
          : "text-gray-600 hover:text-gray-900 border-transparent"
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <span className="text-sm font-medium">{epic.title}</span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="p-0.5 rounded hover:bg-gray-200 transition-colors"
        aria-label="Close tab"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

interface RoadmapCanvasProps {
  roadmap: Roadmap;
  milestones: RoadmapMilestone[];
  epics: RoadmapEpic[];
  projectTitle?: string;
  onUpdateRoadmap: (roadmap: Roadmap) => void | Promise<void>;
  onAddMilestone: () => void;
  onUpdateMilestone: (milestone: RoadmapMilestone) => void;
  onDeleteMilestone: (id: string) => void;
  onAddEpic: (
    milestoneId?: string,
    epicInput?: Partial<RoadmapEpic>,
  ) => void | Promise<void>;
  onUpdateEpic: (epic: RoadmapEpic) => void | Promise<void>;
  onDeleteEpic: (epicId: string) => void | Promise<void>;
  onAddFeature: (
    epicId: string,
    data: {
      title: string;
      description: string;
      status: FeatureStatus;
      is_deliverable: boolean;
    },
  ) => void | Promise<void>;
  onUpdateFeature: (feature: RoadmapFeature) => void | Promise<void>;
  onDeleteFeature: (featureId: string) => void | Promise<void>;
  onAddTask: (
    featureId: string,
    taskData: Partial<RoadmapTask>,
  ) => void | Promise<void>;
  onUpdateTask: (task: RoadmapTask) => void | Promise<void>;
  onDeleteTask: (taskId: string) => void | Promise<void>;
  onEditBrief?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  onMakeProject?: () => void;
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

const RoadmapCanvas = ({
  roadmap,
  milestones,
  epics,
  projectTitle,
  onUpdateRoadmap: _onUpdateRoadmap,
  onAddMilestone: _onAddMilestone,
  onUpdateMilestone,
  onDeleteMilestone,
  onAddEpic,
  onUpdateEpic,
  onDeleteEpic,
  onAddFeature,
  onUpdateFeature,
  onDeleteFeature,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onEditBrief,
  onExport,
  onShare,
  onMakeProject,
  focusNodeId,
  focusNodeOffsetX,
  onFocusComplete,
  navigateToEpicId,
  onNavigateToEpicHandled,
  navigateToFeature,
  onNavigateToFeatureHandled,
  openEpicEditorId,
  onOpenEpicEditorHandled,
  openFeatureEditor,
  onOpenFeatureEditorHandled,
  openTaskDetailId,
  onOpenTaskDetailHandled,
  onActiveEpicChange,
}: RoadmapCanvasProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>("roadmap");
  const [selectedEpic, setSelectedEpic] = useState<string | null>(null);
  const [openEpicTabs, setOpenEpicTabs] = useState<string[]>([]); // Track opened epic tabs
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [targetFeatureForTask, setTargetFeatureForTask] = useState<
    string | null
  >(null);
  const [isAddEpicModalOpen, setIsAddEpicModalOpen] = useState(false);
  const [isEditEpicModalOpen, setIsEditEpicModalOpen] = useState(false);
  const [editingEpicId, setEditingEpicId] = useState<string | null>(null);
  const [targetEpicForAddBelow, setTargetEpicForAddBelow] = useState<
    string | null
  >(null);
  const [isAddFeatureModalOpen, setIsAddFeatureModalOpen] = useState(false);
  const [targetEpicForFeature, setTargetEpicForFeature] = useState<
    string | null
  >(null);
  const [isEditFeatureModalOpen, setIsEditFeatureModalOpen] = useState(false);
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [editingFeatureEpicId, setEditingFeatureEpicId] = useState<
    string | null
  >(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "epic" | "feature";
    id: string;
    label: string;
  } | null>(null);
  const [scrollToFeatureId, setScrollToFeatureId] = useState<string | null>(
    null,
  );

  // Loading states
  const [isEpicLoading, setIsEpicLoading] = useState(false);
  const [isFeatureLoading, setIsFeatureLoading] = useState(false);
  const [isTaskLoading, setIsTaskLoading] = useState(false);

  // DnD Kit sensors for epic tabs
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    if (!navigateToEpicId) {
      return;
    }

    const epicExists = epics.some((epic) => epic.id === navigateToEpicId);
    if (!epicExists) {
      onNavigateToEpicHandled?.();
      return;
    }

    setSelectedEpic(navigateToEpicId);
    setViewMode("epic");
    setOpenEpicTabs((prevTabs) =>
      prevTabs.includes(navigateToEpicId)
        ? prevTabs
        : [...prevTabs, navigateToEpicId],
    );
    onNavigateToEpicHandled?.();
  }, [epics, navigateToEpicId, onNavigateToEpicHandled]);

  useEffect(() => {
    if (!navigateToFeature) {
      return;
    }

    const targetEpic = epics.find(
      (epic) => epic.id === navigateToFeature.epicId,
    );
    if (!targetEpic) {
      onNavigateToFeatureHandled?.();
      return;
    }

    setSelectedEpic(navigateToFeature.epicId);
    setViewMode("epic");
    setOpenEpicTabs((prevTabs) =>
      prevTabs.includes(navigateToFeature.epicId)
        ? prevTabs
        : [...prevTabs, navigateToFeature.epicId],
    );
    setScrollToFeatureId(navigateToFeature.featureId);
  }, [epics, navigateToFeature, onNavigateToFeatureHandled]);

  useEffect(() => {
    onActiveEpicChange?.(viewMode === "epic" ? selectedEpic : null);
  }, [onActiveEpicChange, selectedEpic, viewMode]);

  // Handle closing an epic tab
  const handleCloseEpicTab = (epicId: string) => {
    const newTabs = openEpicTabs.filter((id) => id !== epicId);
    setOpenEpicTabs(newTabs);
    // If closing the currently selected epic, switch to roadmap or another tab
    if (selectedEpic === epicId) {
      if (newTabs.length > 0) {
        setSelectedEpic(newTabs[newTabs.length - 1]);
      } else {
        setViewMode("roadmap");
        setSelectedEpic(null);
      }
    }
  };

  // Handle drag end for epic tabs reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOpenEpicTabs((tabs) => {
        const oldIndex = tabs.indexOf(active.id as string);
        const newIndex = tabs.indexOf(over.id as string);
        return arrayMove(tabs, oldIndex, newIndex);
      });
    }
  };

  // Handle creating epic from modal
  const handleCreateEpic = async (data: {
    title: string;
    description: string;
    priority: EpicPriority;
    tags: string[];
  }) => {
    setIsEpicLoading(true);
    try {
      let position = epics.length;
      if (targetEpicForAddBelow) {
        const targetEpic = epics.find((e) => e.id === targetEpicForAddBelow);
        if (targetEpic) {
          position = targetEpic.position + 1;
        }
      }
      await onAddEpic(undefined, {
        title: data.title,
        description: data.description,
        priority: data.priority,
        tags: data.tags,
        status: "backlog",
        position,
      });
      setIsAddEpicModalOpen(false);
      setTargetEpicForAddBelow(null);
    } finally {
      setIsEpicLoading(false);
    }
  };

  // Handle adding epic below - opens modal
  const handleAddEpicBelow = (epicId: string) => {
    setTargetEpicForAddBelow(epicId);
    setIsAddEpicModalOpen(true);
  };

  // Handle opening add feature modal for a specific epic
  const handleOpenAddFeatureModal = (epicId: string) => {
    setTargetEpicForFeature(epicId);
    setIsAddFeatureModalOpen(true);
  };

  const handleOpenEditEpicModal = (epicId: string) => {
    setEditingEpicId(epicId);
    setIsEditEpicModalOpen(true);
  };

  const handleUpdateEpicFromModal = async (data: {
    title: string;
    description: string;
    priority: EpicPriority;
    tags: string[];
  }) => {
    if (!editingEpicId) return;
    const epic = epics.find((e) => e.id === editingEpicId);
    if (!epic) return;

    setIsEpicLoading(true);
    try {
      await onUpdateEpic({
        ...epic,
        title: data.title,
        description: data.description,
        priority: data.priority,
        tags: data.tags,
        updated_at: new Date().toISOString(),
      });
      setIsEditEpicModalOpen(false);
      setEditingEpicId(null);
    } finally {
      setIsEpicLoading(false);
    }
  };

  // Handle creating feature from modal
  const handleCreateFeature = async (data: {
    title: string;
    description: string;
    status: FeatureStatus;
    is_deliverable: boolean;
  }) => {
    if (targetEpicForFeature) {
      setIsFeatureLoading(true);
      try {
        await onAddFeature(targetEpicForFeature, data);
        setIsAddFeatureModalOpen(false);
        setTargetEpicForFeature(null);
      } finally {
        setIsFeatureLoading(false);
      }
    }
  };

  const handleOpenEditFeatureModal = (epicId: string, featureId: string) => {
    setEditingFeatureEpicId(epicId);
    setEditingFeatureId(featureId);
    setIsEditFeatureModalOpen(true);
  };

  useEffect(() => {
    if (!openEpicEditorId) {
      return;
    }

    const epicExists = epics.some((epic) => epic.id === openEpicEditorId);
    if (epicExists) {
      handleOpenEditEpicModal(openEpicEditorId);
    }
    onOpenEpicEditorHandled?.();
  }, [epics, onOpenEpicEditorHandled, openEpicEditorId]);

  useEffect(() => {
    if (!openFeatureEditor) {
      return;
    }

    const epic = epics.find((item) => item.id === openFeatureEditor.epicId);
    const featureExists = epic?.features?.some(
      (feature) => feature.id === openFeatureEditor.featureId,
    );
    if (featureExists) {
      handleOpenEditFeatureModal(
        openFeatureEditor.epicId,
        openFeatureEditor.featureId,
      );
    }
    onOpenFeatureEditorHandled?.();
  }, [epics, onOpenFeatureEditorHandled, openFeatureEditor]);

  useEffect(() => {
    if (!openTaskDetailId) {
      return;
    }

    const taskExists = epics
      .flatMap((epic) => epic.features || [])
      .flatMap((feature) => feature.tasks || [])
      .some((task) => task.id === openTaskDetailId);

    if (taskExists) {
      setSelectedTaskId(openTaskDetailId);
      setTargetFeatureForTask(null);
      setSidePanelOpen(true);
    }
    onOpenTaskDetailHandled?.();
  }, [epics, onOpenTaskDetailHandled, openTaskDetailId]);

  const handleUpdateFeatureFromModal = async (data: {
    title: string;
    description: string;
    status: FeatureStatus;
    is_deliverable: boolean;
  }) => {
    if (!editingFeatureId || !editingFeatureEpicId) return;
    const epic = epics.find((e) => e.id === editingFeatureEpicId);
    const feature = epic?.features?.find((f) => f.id === editingFeatureId);
    if (!epic || !feature) return;

    setIsFeatureLoading(true);
    try {
      await onUpdateFeature({
        ...feature,
        title: data.title,
        description: data.description,
        status: data.status,
        is_deliverable: data.is_deliverable,
        updated_at: new Date().toISOString(),
      });
      setIsEditFeatureModalOpen(false);
      setEditingFeatureId(null);
      setEditingFeatureEpicId(null);
    } finally {
      setIsFeatureLoading(false);
    }
  };

  const [_editingItem, _setEditingItem] = useState<{
    type: "epic" | "feature" | "task";
    id: string;
  } | null>(null);

  // CRUD for Epics - now using props
  const handleDeleteEpic = (id: string) => {
    const epic = epics.find((e) => e.id === id);
    setDeleteConfirm({
      type: "epic",
      id,
      label: epic?.title ? `"${epic.title}"` : "this epic",
    });
  };

  // CRUD for Features - using props
  const handleDeleteFeature = (featureId: string) => {
    const feature = epics
      .flatMap((e) => e.features || [])
      .find((f) => f.id === featureId);
    setDeleteConfirm({
      type: "feature",
      id: featureId,
      label: feature?.title ? `"${feature.title}"` : "this feature",
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === "epic") {
      onDeleteEpic(deleteConfirm.id);
      if (selectedEpic === deleteConfirm.id) setSelectedEpic(null);
    } else {
      onDeleteFeature(deleteConfirm.id);
      if (selectedFeature === deleteConfirm.id) setSelectedFeature(null);
    }

    setDeleteConfirm(null);
  };

  // Task wrapper handlers
  const handleTaskCreate = async (taskData: Partial<RoadmapTask>) => {
    if (targetFeatureForTask) {
      setIsTaskLoading(true);
      try {
        await onAddTask(targetFeatureForTask, taskData);
        setSidePanelOpen(false);
        setTargetFeatureForTask(null);
      } finally {
        setIsTaskLoading(false);
      }
    }
  };

  const handleTaskUpdate = async (task: RoadmapTask) => {
    setIsTaskLoading(true);
    try {
      await onUpdateTask(task);
    } finally {
      setIsTaskLoading(false);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    setIsTaskLoading(true);
    try {
      await onDeleteTask(taskId);
      setSidePanelOpen(false);
      setSelectedTaskId(null);
    } finally {
      setIsTaskLoading(false);
    }
  };

  // Get selected epic and task objects
  const currentEpic = epics.find((e) => e.id === selectedEpic);
  const selectedTask = selectedTaskId
    ? epics
        .flatMap((e) => e.features || [])
        .flatMap((f) => f.tasks || [])
        .find((t) => t.id === selectedTaskId)
    : null;

  return (
    <div className="relative h-full bg-white flex flex-col">
      {/* Header */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center">
          <h1 className="ml-4 text-lg font-semibold text-gray-900">
            {projectTitle || "Untitled Project"}
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Make Project Button - only show if roadmap has no project_id */}
          {!roadmap.project_id && onMakeProject && (
            <button
              onClick={onMakeProject}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg rounded-lg transition-all font-medium"
              title="Convert to Project for Consultant Bidding"
            >
              <Briefcase className="w-4 h-4" />
              Make this a Project
            </button>
          )}

          {onEditBrief && (
            <button
              onClick={onEditBrief}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
              title="Edit Project Brief"
            >
              <Settings className="w-4 h-4" />
              Project Brief
            </button>
          )}

          {onShare && (
            <button
              onClick={onShare}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
              title="Share Roadmap"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          )}

          {onExport && (
            <button
              onClick={onExport}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
              title="Export Roadmap"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* View Mode Tabs - Figma Design */}
      <div className="bg-gray-100 border-b border-gray-200 flex items-center px-6 overflow-x-auto">
        <button
          onClick={() => {
            setViewMode("roadmap");
            setSelectedEpic(null);
          }}
          className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 shrink-0 ${
            viewMode === "roadmap"
              ? "text-orange-600 border-orange-600"
              : "text-gray-600 hover:text-gray-900 border-transparent"
          }`}
        >
          Roadmap View
        </button>
        <button
          onClick={() => setViewMode("milestones")}
          className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 shrink-0 ${
            viewMode === "milestones"
              ? "text-orange-600 border-orange-600"
              : "text-gray-600 hover:text-gray-900 border-transparent"
          }`}
        >
          Milestones
        </button>

        {/* Separator */}
        {openEpicTabs.length > 0 && (
          <div className="h-8 w-px bg-gray-300 shrink-0" />
        )}

        {/* Epic Tabs with DnD */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={openEpicTabs}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex items-center gap-2">
              {openEpicTabs.map((epicId) => {
                const epic = epics.find((e) => e.id === epicId);
                if (!epic) return null;
                return (
                  <SortableEpicTab
                    key={epicId}
                    epic={epic}
                    isActive={viewMode === "epic" && selectedEpic === epicId}
                    onClick={() => {
                      setSelectedEpic(epicId);
                      setViewMode("epic");
                    }}
                    onClose={() => handleCloseEpicTab(epicId)}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* View Content */}
      <div className="flex-1 relative overflow-hidden">
        {viewMode === "roadmap" && epics.length === 0 ? (
          // Empty state - no epics
          <div className="flex flex-col bg-[#F9F9F9] items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="mb-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Epics Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first epic. Epics help you organize
                large bodies of work into manageable pieces.
              </p>
              <button
                onClick={() => setIsAddEpicModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Epic
              </button>
            </div>
          </div>
        ) : viewMode === "roadmap" ? (
          <RoadmapView
            roadmap={roadmap}
            epics={epics}
            onUpdateEpic={onUpdateEpic}
            onDeleteEpic={handleDeleteEpic}
            onUpdateFeature={onUpdateFeature}
            onDeleteFeature={handleDeleteFeature}
            onSelectFeature={(feature) => {
              handleOpenEditFeatureModal(feature.epic_id, feature.id);
            }}
            onSelectEpic={(epicId) => {
              handleOpenEditEpicModal(epicId);
            }}
            onSelectTask={(task) => {
              setSelectedTaskId(task.id);
              setTargetFeatureForTask(null);
              setSidePanelOpen(true);
            }}
            onAddEpicBelow={handleAddEpicBelow}
            onAddFeature={handleOpenAddFeatureModal}
            onAddTask={(featureId) => {
              setTargetFeatureForTask(featureId);
              setSelectedTaskId(null);
              setSidePanelOpen(true);
            }}
            onEditFeature={handleOpenEditFeatureModal}
            onNavigateToEpic={(epicId) => {
              setSelectedEpic(epicId);
              setViewMode("epic");
              // Add to tabs if not already present
              if (!openEpicTabs.includes(epicId)) {
                setOpenEpicTabs([...openEpicTabs, epicId]);
              }
            }}
            onUpdateTask={onUpdateTask}
            focusNodeId={focusNodeId}
            focusNodeOffsetX={focusNodeOffsetX}
            onFocusComplete={onFocusComplete}
          />
        ) : null}

        {viewMode === "epic" && currentEpic && (
          <EpicTab
            epic={currentEpic}
            onUpdateEpic={onUpdateEpic}
            onUpdateFeature={onUpdateFeature}
            onDeleteFeature={handleDeleteFeature}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
            onSelectTask={(task) => {
              setSelectedTaskId(task.id);
              setTargetFeatureForTask(null);
              setSidePanelOpen(true);
            }}
            onAddTask={(featureId) => {
              setTargetFeatureForTask(featureId);
              setSelectedTaskId(null);
              setSidePanelOpen(true);
            }}
            scrollToFeatureId={scrollToFeatureId}
            onScrollToFeatureHandled={() => {
              setScrollToFeatureId(null);
              onNavigateToFeatureHandled?.();
            }}
          />
        )}

        {viewMode === "epic" && !currentEpic && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 mb-4">No epic selected</p>
              <button
                onClick={() => setViewMode("roadmap")}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Go to Roadmap View
              </button>
            </div>
          </div>
        )}

        {viewMode === "milestones" && (
          <MilestonesView
            roadmap={roadmap}
            milestones={milestones}
            onUpdateMilestone={onUpdateMilestone}
            onDeleteMilestone={onDeleteMilestone}
          />
        )}

        {/* SidePanel for task details */}
        <SidePanel
          task={selectedTask || null}
          isOpen={sidePanelOpen}
          isCreating={!selectedTaskId && targetFeatureForTask !== null}
          onClose={() => {
            setSidePanelOpen(false);
            setSelectedTaskId(null);
            setTargetFeatureForTask(null);
          }}
          onUpdateTask={handleTaskUpdate}
          onDeleteTask={handleTaskDelete}
          onCreateTask={handleTaskCreate}
          isLoading={isTaskLoading}
        />

        {/* Add Epic Modal */}
        <AddEpicModal
          isOpen={isAddEpicModalOpen}
          onClose={() => setIsAddEpicModalOpen(false)}
          onSubmit={handleCreateEpic}
          isLoading={isEpicLoading}
        />

        {/* Edit Epic Modal */}
        <AddEpicModal
          isOpen={isEditEpicModalOpen}
          onClose={() => {
            setIsEditEpicModalOpen(false);
            setEditingEpicId(null);
          }}
          onSubmit={handleUpdateEpicFromModal}
          onAddFeature={
            editingEpicId
              ? () => {
                  setTargetEpicForFeature(editingEpicId);
                  setIsAddFeatureModalOpen(true);
                }
              : undefined
          }
          onSelectFeature={
            editingEpicId
              ? (feature) => {
                  if (feature.id) {
                    handleOpenEditFeatureModal(editingEpicId, feature.id);
                  }
                }
              : undefined
          }
          onAddTask={
            editingEpicId
              ? (featureId) => {
                  setTargetFeatureForTask(featureId);
                  setSelectedTaskId(null);
                  setSidePanelOpen(true);
                }
              : undefined
          }
          onUpdateTask={handleTaskUpdate}
          onDeleteTask={handleTaskDelete}
          onSelectTask={(task) => {
            setSelectedTaskId(task.id);
            setTargetFeatureForTask(null);
            setSidePanelOpen(true);
          }}
          initialData={
            editingEpicId
              ? {
                  title: epics.find((e) => e.id === editingEpicId)?.title,
                  description: epics.find((e) => e.id === editingEpicId)
                    ?.description,
                  priority: epics.find((e) => e.id === editingEpicId)?.priority,
                  tags: epics.find((e) => e.id === editingEpicId)?.tags,
                  labels: epics.find((e) => e.id === editingEpicId)?.labels, // ✅ Add labels
                  features: epics.find((e) => e.id === editingEpicId)?.features,
                }
              : undefined
          }
          titleText="Edit Epic"
          submitLabel="Save Changes"
          isLoading={isEpicLoading}
        />

        {/* Add Feature Modal */}
        <AddFeatureModal
          isOpen={isAddFeatureModalOpen}
          epicTitle={
            targetEpicForFeature
              ? epics.find((e) => e.id === targetEpicForFeature)?.title
              : undefined
          }
          onClose={() => {
            setIsAddFeatureModalOpen(false);
            setTargetEpicForFeature(null);
          }}
          onSubmit={handleCreateFeature}
          isLoading={isFeatureLoading}
        />

        {/* Edit Feature Modal */}
        <AddFeatureModal
          isOpen={isEditFeatureModalOpen}
          epicTitle={
            editingFeatureEpicId
              ? epics.find((e) => e.id === editingFeatureEpicId)?.title
              : undefined
          }
          initialData={
            editingFeatureId && editingFeatureEpicId
              ? epics
                  .find((e) => e.id === editingFeatureEpicId)
                  ?.features?.find((f) => f.id === editingFeatureId)
              : undefined
          }
          titleText="Edit Feature"
          submitLabel="Save Changes"
          onClose={() => {
            setIsEditFeatureModalOpen(false);
            setEditingFeatureId(null);
            setEditingFeatureEpicId(null);
          }}
          onAddTask={
            editingFeatureId
              ? (featureId) => {
                  setTargetFeatureForTask(featureId);
                  setSelectedTaskId(null);
                  setSidePanelOpen(true);
                }
              : undefined
          }
          onUpdateTask={handleTaskUpdate}
          onDeleteTask={handleTaskDelete}
          onSelectTask={(task) => {
            setSelectedTaskId(task.id);
            setTargetFeatureForTask(null);
            setSidePanelOpen(true);
          }}
          onSubmit={handleUpdateFeatureFromModal}
          isLoading={isFeatureLoading}
        />

        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setDeleteConfirm(null)}
            />
            <div className="relative z-10 w-full max-w-md mx-4 rounded-xl bg-white shadow-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Delete {deleteConfirm.type === "epic" ? "Epic" : "Feature"}?
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                This will permanently remove {deleteConfirm.label} and cannot be
                undone.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { RoadmapCanvas };
