import { useState } from "react";
import { X, Plus } from "lucide-react";
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
      className={`flex items-center gap-2 px-3 py-2 rounded-t-lg border-b-2 shrink-0 cursor-pointer transition-colors ${
        isActive
          ? "bg-gray-100 border-primary text-primary"
          : "bg-white border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
  onUpdateRoadmap: (roadmap: Roadmap) => void;
  onAddMilestone: () => void;
  onUpdateMilestone: (milestone: RoadmapMilestone) => void;
  onDeleteMilestone: (id: string) => void;
  onAddEpic: (milestoneId?: string, epicInput?: Partial<RoadmapEpic>) => void;
  onUpdateEpic: (epic: RoadmapEpic) => void;
  onDeleteEpic: (epicId: string) => void;
  onAddFeature: (
    epicId: string,
    data: {
      title: string;
      description: string;
      status: FeatureStatus;
      is_deliverable: boolean;
    },
  ) => void;
  onUpdateFeature: (feature: RoadmapFeature) => void;
  onDeleteFeature: (featureId: string) => void;
}

const RoadmapCanvas = ({
  roadmap,
  milestones,
  epics,
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

  // DnD Kit sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Handle epic widget click - open as tab and switch to epic view
  const handleEpicClick = (epicId: string) => {
    setSelectedEpic(epicId);
    setViewMode("epic");
    // Add to tabs if not already present
    if (!openEpicTabs.includes(epicId)) {
      setOpenEpicTabs([...openEpicTabs, epicId]);
    }
  };

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
  const handleCreateEpic = (data: {
    title: string;
    description: string;
    priority: EpicPriority;
    tags: string[];
  }) => {
    let position = epics.length;
    if (targetEpicForAddBelow) {
      const targetEpic = epics.find((e) => e.id === targetEpicForAddBelow);
      if (targetEpic) {
        position = targetEpic.position + 1;
      }
    }
    onAddEpic(undefined, {
      title: data.title,
      description: data.description,
      priority: data.priority,
      tags: data.tags,
      status: "backlog",
      position,
    });
    setIsAddEpicModalOpen(false);
    setTargetEpicForAddBelow(null);
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

  const handleUpdateEpicFromModal = (data: {
    title: string;
    description: string;
    priority: EpicPriority;
    tags: string[];
  }) => {
    if (!editingEpicId) return;
    const epic = epics.find((e) => e.id === editingEpicId);
    if (!epic) return;
    onUpdateEpic({
      ...epic,
      title: data.title,
      description: data.description,
      priority: data.priority,
      tags: data.tags,
      updated_at: new Date().toISOString(),
    });
    setIsEditEpicModalOpen(false);
    setEditingEpicId(null);
  };

  // Handle creating feature from modal
  const handleCreateFeature = (data: {
    title: string;
    description: string;
    status: FeatureStatus;
    is_deliverable: boolean;
  }) => {
    if (targetEpicForFeature) {
      onAddFeature(targetEpicForFeature, data);
    }
    setIsAddFeatureModalOpen(false);
    setTargetEpicForFeature(null);
  };

  const handleOpenEditFeatureModal = (epicId: string, featureId: string) => {
    setEditingFeatureEpicId(epicId);
    setEditingFeatureId(featureId);
    setIsEditFeatureModalOpen(true);
  };

  const handleUpdateFeatureFromModal = (data: {
    title: string;
    description: string;
    status: FeatureStatus;
    is_deliverable: boolean;
  }) => {
    if (!editingFeatureId || !editingFeatureEpicId) return;
    const epic = epics.find((e) => e.id === editingFeatureEpicId);
    const feature = epic?.features?.find((f) => f.id === editingFeatureId);
    if (!epic || !feature) return;
    onUpdateFeature({
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

  // CRUD for Features - now using props
  const handleUpdateFeature = (
    epicId: string,
    featureId: string,
    updates: Partial<RoadmapFeature>,
  ) => {
    const epic = epics.find((e) => e.id === epicId);
    const feature = epic?.features?.find((f) => f.id === featureId);
    if (feature) {
      onUpdateFeature({
        ...feature,
        ...updates,
        updated_at: new Date().toISOString(),
      });
    }
  };

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

  // CRUD for Tasks
  const deleteTask = (epicId: string, featureId: string, taskId: string) => {
    const epic = epics.find((e) => e.id === epicId);
    const feature = epic?.features?.find((f) => f.id === featureId);
    if (feature) {
      const updatedTasks = (feature.tasks || []).filter((t) => t.id !== taskId);
      handleUpdateFeature(epicId, featureId, { tasks: updatedTasks });
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
    <div className="relative h-full bg-gray-50 flex flex-col">
      {/* View Mode Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 flex items-center gap-4 overflow-x-auto">
        <button
          onClick={() => {
            setViewMode("roadmap");
            setSelectedEpic(null);
          }}
          className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 shrink-0 ${
            viewMode === "roadmap"
              ? "text-primary border-primary"
              : "text-gray-600 hover:text-gray-900 border-transparent"
          }`}
        >
          Roadmap View
        </button>
        <button
          onClick={() => setViewMode("milestones")}
          className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 shrink-0 ${
            viewMode === "milestones"
              ? "text-primary border-primary"
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
          <div className="flex flex-col items-center justify-center h-full">
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
              handleEpicClick(feature.epic_id);
            }}
            onSelectEpic={(epicId) => {
              handleOpenEditEpicModal(epicId);
            }}
            onAddEpicBelow={handleAddEpicBelow}
            onAddFeature={handleOpenAddFeatureModal}
            onEditFeature={handleOpenEditFeatureModal}
            onNavigateToEpic={(epicId) => {
              setSelectedEpic(epicId);
              setViewMode("epic");
              // Add to tabs if not already present
              if (!openEpicTabs.includes(epicId)) {
                setOpenEpicTabs([...openEpicTabs, epicId]);
              }
            }}
          />
        ) : null}

        {viewMode === "epic" && currentEpic && (
          <EpicTab
            epic={currentEpic}
            onUpdateEpic={onUpdateEpic}
            onUpdateFeature={onUpdateFeature}
            onDeleteFeature={handleDeleteFeature}
            onUpdateTask={(task) => {
              // Find the feature containing this task and update it
              const feature = currentEpic.features?.find((f) =>
                f.tasks?.some((t) => t.id === task.id),
              );
              if (feature) {
                const updatedTasks = (feature.tasks || []).map((t) =>
                  t.id === task.id ? task : t,
                );
                handleUpdateFeature(currentEpic.id, feature.id, {
                  tasks: updatedTasks,
                });
              }
            }}
            onDeleteTask={(taskId) => {
              // Find and delete task from its feature
              const feature = currentEpic.features?.find((f) =>
                f.tasks?.some((t) => t.id === taskId),
              );
              if (feature) {
                deleteTask(currentEpic.id, feature.id, taskId);
              }
            }}
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
          onUpdateTask={(task) => {
            // Find the feature containing this task and update it
            const epic = epics.find((e) =>
              e.features?.some((f) => f.tasks?.some((t) => t.id === task.id)),
            );
            const feature = epic?.features?.find((f) =>
              f.tasks?.some((t) => t.id === task.id),
            );
            if (epic && feature) {
              const updatedTasks = (feature.tasks || []).map((t) =>
                t.id === task.id ? task : t,
              );
              handleUpdateFeature(epic.id, feature.id, { tasks: updatedTasks });
            }
          }}
          onDeleteTask={(taskId) => {
            // Find and delete task from its feature
            const epic = epics.find((e) =>
              e.features?.some((f) => f.tasks?.some((t) => t.id === taskId)),
            );
            const feature = epic?.features?.find((f) =>
              f.tasks?.some((t) => t.id === taskId),
            );
            if (epic && feature) {
              deleteTask(epic.id, feature.id, taskId);
            }
            setSidePanelOpen(false);
            setSelectedTaskId(null);
          }}
          onCreateTask={(taskData) => {
            // Find epic and feature, add task
            const epic = epics.find((e) =>
              e.features?.some((f) => f.id === targetFeatureForTask),
            );
            const feature = epic?.features?.find(
              (f) => f.id === targetFeatureForTask,
            );
            if (epic && feature) {
              const newTask = {
                id: crypto.randomUUID(),
                ...taskData,
                feature_id: targetFeatureForTask,
                position: (feature.tasks || []).length,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              handleUpdateFeature(epic.id, feature.id, {
                tasks: [...(feature.tasks || []), newTask as any],
              });
            }
            setSidePanelOpen(false);
            setTargetFeatureForTask(null);
          }}
        />

        {/* Add Epic Modal */}
        <AddEpicModal
          isOpen={isAddEpicModalOpen}
          onClose={() => setIsAddEpicModalOpen(false)}
          onSubmit={handleCreateEpic}
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
          initialData={
            editingEpicId
              ? {
                  title: epics.find((e) => e.id === editingEpicId)?.title,
                  description: epics.find((e) => e.id === editingEpicId)
                    ?.description,
                  priority: epics.find((e) => e.id === editingEpicId)?.priority,
                  tags: epics.find((e) => e.id === editingEpicId)?.tags,
                  features: epics.find((e) => e.id === editingEpicId)?.features,
                }
              : undefined
          }
          titleText="Edit Epic"
          submitLabel="Save Changes"
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
            editingFeatureEpicId && editingFeatureId
              ? () => {
                  // TODO: Implement add task modal for editing feature
                  console.log("Add task to feature:", editingFeatureId);
                }
              : undefined
          }
          onSubmit={handleUpdateFeatureFromModal}
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
