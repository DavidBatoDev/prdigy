import { useEffect, useState } from "react";
import type { EpicPriority, FeatureStatus, RoadmapTask } from "@/types/roadmap";
import { useRoadmapStore, type CanvasViewMode } from "@/stores/roadmapStore";
import type { UseRoadmapCanvasControllerArgs } from "./RoadmapCanvas.types";

/** @deprecated Use CanvasViewMode from roadmapStore instead */
export type ViewMode = CanvasViewMode;

export function useRoadmapCanvasController({
  roadmap: roadmapProp,
  milestones: milestonesProp,
  epics: epicsProp,
  onUpdateMilestone: onUpdateMilestoneProp,
  onDeleteMilestone: onDeleteMilestoneProp,
  onAddEpic: onAddEpicProp,
  onUpdateEpic: onUpdateEpicProp,
  onDeleteEpic: onDeleteEpicProp,
  onAddFeature: onAddFeatureProp,
  onUpdateFeature: onUpdateFeatureProp,
  onDeleteFeature: onDeleteFeatureProp,
  onAddTask: onAddTaskProp,
  onUpdateTask: onUpdateTaskProp,
  onDeleteTask: onDeleteTaskProp,
  focusNodeId: focusNodeIdProp,
  focusNodeOffsetX: focusNodeOffsetXProp,
  onFocusComplete: onFocusCompleteProp,
  navigateToEpicId: navigateToEpicIdProp,
  onNavigateToEpicHandled: onNavigateToEpicHandledProp,
  navigateToFeature: navigateToFeatureProp,
  onNavigateToFeatureHandled: onNavigateToFeatureHandledProp,
  openEpicEditorId: openEpicEditorIdProp,
  onOpenEpicEditorHandled: onOpenEpicEditorHandledProp,
  openFeatureEditor: openFeatureEditorProp,
  onOpenFeatureEditorHandled: onOpenFeatureEditorHandledProp,
  openTaskDetailId: openTaskDetailIdProp,
  onOpenTaskDetailHandled: onOpenTaskDetailHandledProp,
  onActiveEpicChange,
}: UseRoadmapCanvasControllerArgs) {
  const storeRoadmap = useRoadmapStore((state) => state.roadmap);
  const storeMilestones = useRoadmapStore((state) => state.milestones);
  const storeEpics = useRoadmapStore((state) => state.epics);
  const storeUpdateMilestone = useRoadmapStore(
    (state) => state.updateMilestone,
  );
  const storeDeleteMilestone = useRoadmapStore(
    (state) => state.deleteMilestone,
  );
  const storeAddEpic = useRoadmapStore((state) => state.addEpic);
  const storeUpdateEpic = useRoadmapStore((state) => state.updateEpic);
  const storeDeleteEpic = useRoadmapStore((state) => state.deleteEpic);
  const storeAddFeature = useRoadmapStore((state) => state.addFeature);
  const storeUpdateFeature = useRoadmapStore((state) => state.updateFeature);
  const storeDeleteFeature = useRoadmapStore((state) => state.deleteFeature);
  const storeAddTask = useRoadmapStore((state) => state.addTask);
  const storeUpdateTask = useRoadmapStore((state) => state.updateTask);
  const storeDeleteTask = useRoadmapStore((state) => state.deleteTask);
  const storeFocusNodeId = useRoadmapStore((state) => state.focusNodeId);
  const storeFocusNodeOffsetX = useRoadmapStore(
    (state) => state.focusNodeOffsetX,
  );
  const storeNavigateToEpicId = useRoadmapStore(
    (state) => state.navigateToEpicId,
  );
  const storeNavigateToFeature = useRoadmapStore(
    (state) => state.navigateToFeature,
  );
  const storeOpenEpicEditorId = useRoadmapStore(
    (state) => state.openEpicEditorId,
  );
  const storeOpenFeatureEditor = useRoadmapStore(
    (state) => state.openFeatureEditor,
  );
  const storeOpenTaskDetailId = useRoadmapStore(
    (state) => state.openTaskDetailId,
  );
  const storeClearNodeFocus = useRoadmapStore((state) => state.clearNodeFocus);
  const storeClearNavigateToEpicTab = useRoadmapStore(
    (state) => state.clearNavigateToEpicTab,
  );
  const storeClearNavigateToFeatureNode = useRoadmapStore(
    (state) => state.clearNavigateToFeatureNode,
  );
  const storeClearOpenEpicEditor = useRoadmapStore(
    (state) => state.clearOpenEpicEditor,
  );
  const storeClearOpenFeatureEditor = useRoadmapStore(
    (state) => state.clearOpenFeatureEditorModal,
  );
  const storeClearOpenTaskDetail = useRoadmapStore(
    (state) => state.clearOpenTaskDetail,
  );
  const storeSetActiveEpicId = useRoadmapStore(
    (state) => state.setActiveEpicId,
  );

  // Canvas view-mode — sourced from store so RoadmapTopBar / RoadmapViewContent can react
  const viewMode = useRoadmapStore((state) => state.canvasViewMode);
  const selectedEpic = useRoadmapStore((state) => state.canvasSelectedEpicId);
  const openEpicTabs = useRoadmapStore((state) => state.canvasOpenEpicTabs);
  const setViewMode = useRoadmapStore((state) => state.setCanvasViewMode);
  const setSelectedEpic = useRoadmapStore(
    (state) => state.setCanvasSelectedEpicId,
  );
  const setOpenEpicTabs = useRoadmapStore(
    (state) => state.setCanvasOpenEpicTabs,
  );
  const closeCanvasEpicTab = useRoadmapStore(
    (state) => state.closeCanvasEpicTab,
  );

  const addFeatureEpicId = useRoadmapStore((state) => state.addFeatureEpicId);
  const addTaskFeatureId = useRoadmapStore((state) => state.addTaskFeatureId);
  const closeAddFeatureModal = useRoadmapStore(
    (state) => state.closeAddFeatureModal,
  );
  const closeAddTaskPanel = useRoadmapStore((state) => state.closeAddTaskPanel);

  const roadmap = roadmapProp ?? storeRoadmap;
  const milestones = milestonesProp ?? storeMilestones;
  const epics = epicsProp ?? storeEpics;
  const onUpdateMilestone = onUpdateMilestoneProp ?? storeUpdateMilestone;
  const onDeleteMilestone = onDeleteMilestoneProp ?? storeDeleteMilestone;
  const onAddEpic = onAddEpicProp ?? storeAddEpic;
  const onUpdateEpic = onUpdateEpicProp ?? storeUpdateEpic;
  const onDeleteEpic = onDeleteEpicProp ?? storeDeleteEpic;
  const onAddFeature = onAddFeatureProp ?? storeAddFeature;
  const onUpdateFeature = onUpdateFeatureProp ?? storeUpdateFeature;
  const onDeleteFeature = onDeleteFeatureProp ?? storeDeleteFeature;
  const onAddTask = onAddTaskProp ?? storeAddTask;
  const onUpdateTask = onUpdateTaskProp ?? storeUpdateTask;
  const onDeleteTask = onDeleteTaskProp ?? storeDeleteTask;
  const focusNodeId = focusNodeIdProp ?? storeFocusNodeId;
  const focusNodeOffsetX = focusNodeOffsetXProp ?? storeFocusNodeOffsetX;
  const navigateToEpicId = navigateToEpicIdProp ?? storeNavigateToEpicId;
  const navigateToFeature = navigateToFeatureProp ?? storeNavigateToFeature;
  const openEpicEditorId = openEpicEditorIdProp ?? storeOpenEpicEditorId;
  const openFeatureEditor = openFeatureEditorProp ?? storeOpenFeatureEditor;
  const openTaskDetailId = openTaskDetailIdProp ?? storeOpenTaskDetailId;
  const onFocusComplete = onFocusCompleteProp ?? storeClearNodeFocus;
  const onNavigateToEpicHandled =
    onNavigateToEpicHandledProp ?? storeClearNavigateToEpicTab;
  const onNavigateToFeatureHandled =
    onNavigateToFeatureHandledProp ?? storeClearNavigateToFeatureNode;
  const onOpenEpicEditorHandled =
    onOpenEpicEditorHandledProp ?? storeClearOpenEpicEditor;
  const onOpenFeatureEditorHandled =
    onOpenFeatureEditorHandledProp ?? storeClearOpenFeatureEditor;
  const onOpenTaskDetailHandled =
    onOpenTaskDetailHandledProp ?? storeClearOpenTaskDetail;
  const onActiveEpicChangeResolved = onActiveEpicChange ?? storeSetActiveEpicId;

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

  const [isEpicLoading, setIsEpicLoading] = useState(false);
  const [isFeatureLoading, setIsFeatureLoading] = useState(false);
  const [isTaskLoading, setIsTaskLoading] = useState(false);

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
  }, [epics, navigateToEpicId, onNavigateToEpicHandled, setOpenEpicTabs, setSelectedEpic, setViewMode]);

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
  }, [epics, navigateToFeature, onNavigateToFeatureHandled, setOpenEpicTabs, setSelectedEpic, setViewMode]);

  useEffect(() => {
    onActiveEpicChangeResolved(viewMode === "epic" ? selectedEpic : null);
  }, [onActiveEpicChangeResolved, selectedEpic, viewMode]);

  const handleCloseEpicTab = (epicId: string) => {
    closeCanvasEpicTab(epicId);
  };

  const handleCreateEpic = async (data: {
    title: string;
    description: string;
    priority: EpicPriority;
    tags: string[];
    start_date?: string;
    end_date?: string;
  }) => {
    setIsEpicLoading(true);
    try {
      let position = epics.length;
      if (targetEpicForAddBelow) {
        const targetEpic = epics.find(
          (epic) => epic.id === targetEpicForAddBelow,
        );
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
        start_date: data.start_date,
        end_date: data.end_date,
      });
      setIsAddEpicModalOpen(false);
      setTargetEpicForAddBelow(null);
    } finally {
      setIsEpicLoading(false);
    }
  };

  const handleAddEpicBelow = (epicId: string) => {
    setTargetEpicForAddBelow(epicId);
    setIsAddEpicModalOpen(true);
  };

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
    start_date?: string;
    end_date?: string;
  }) => {
    if (!editingEpicId) return;
    const epic = epics.find((item) => item.id === editingEpicId);
    if (!epic) return;

    setIsEpicLoading(true);
    try {
      await onUpdateEpic({
        ...epic,
        title: data.title,
        description: data.description,
        priority: data.priority,
        tags: data.tags,
        start_date: data.start_date,
        end_date: data.end_date,
        updated_at: new Date().toISOString(),
      });
      setIsEditEpicModalOpen(false);
      setEditingEpicId(null);
    } finally {
      setIsEpicLoading(false);
    }
  };

  const handleCreateFeature = async (data: {
    title: string;
    description: string;
    status: FeatureStatus;
    is_deliverable: boolean;
    start_date?: string;
    end_date?: string;
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

  useEffect(() => {
    if (!addFeatureEpicId) {
      return;
    }

    setTargetEpicForFeature(addFeatureEpicId);
    setIsAddFeatureModalOpen(true);
    closeAddFeatureModal();
  }, [addFeatureEpicId, closeAddFeatureModal]);

  useEffect(() => {
    if (!addTaskFeatureId) {
      return;
    }

    setTargetFeatureForTask(addTaskFeatureId);
    setSelectedTaskId(null);
    setSidePanelOpen(true);
    closeAddTaskPanel();
  }, [addTaskFeatureId, closeAddTaskPanel]);

  const handleUpdateFeatureFromModal = async (data: {
    title: string;
    description: string;
    status: FeatureStatus;
    is_deliverable: boolean;
    start_date?: string;
    end_date?: string;
  }) => {
    if (!editingFeatureId || !editingFeatureEpicId) return;
    const epic = epics.find((item) => item.id === editingFeatureEpicId);
    const feature = epic?.features?.find(
      (item) => item.id === editingFeatureId,
    );
    if (!epic || !feature) return;

    setIsFeatureLoading(true);
    try {
      await onUpdateFeature({
        ...feature,
        title: data.title,
        description: data.description,
        status: data.status,
        is_deliverable: data.is_deliverable,
        start_date: data.start_date,
        end_date: data.end_date,
        updated_at: new Date().toISOString(),
      });
      setIsEditFeatureModalOpen(false);
      setEditingFeatureId(null);
      setEditingFeatureEpicId(null);
    } finally {
      setIsFeatureLoading(false);
    }
  };

  const handleDeleteEpic = (id: string) => {
    const epic = epics.find((item) => item.id === id);
    setDeleteConfirm({
      type: "epic",
      id,
      label: epic?.title ? `"${epic.title}"` : "this epic",
    });
  };

  const handleDeleteFeature = (featureId: string) => {
    const feature = epics
      .flatMap((epic) => epic.features || [])
      .find((item) => item.id === featureId);
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

  const currentEpic = epics.find((epic) => epic.id === selectedEpic);
  const selectedTask = selectedTaskId
    ? (epics
        .flatMap((epic) => epic.features || [])
        .flatMap((feature) => feature.tasks || [])
        .find((task) => task.id === selectedTaskId) ?? null)
    : null;

  return {
    roadmap,
    milestones,
    epics,
    viewMode,
    selectedEpic,
    openEpicTabs,
    selectedTaskId,
    sidePanelOpen,
    targetFeatureForTask,
    isAddEpicModalOpen,
    isEditEpicModalOpen,
    editingEpicId,
    isAddFeatureModalOpen,
    targetEpicForFeature,
    isEditFeatureModalOpen,
    editingFeatureId,
    editingFeatureEpicId,
    deleteConfirm,
    scrollToFeatureId,
    isTaskLoading,
    isEpicLoading,
    isFeatureLoading,
    currentEpic,
    selectedTask,
    focusNodeId,
    focusNodeOffsetX,
    onUpdateMilestone,
    onDeleteMilestone,
    onUpdateEpic,
    onUpdateFeature,
    onDeleteTask,
    onUpdateTask,
    onFocusComplete,
    onNavigateToFeatureHandled,
    closeAddTaskPanel,
    setViewMode,
    setSelectedEpic,
    setOpenEpicTabs,
    setSelectedTaskId,
    setTargetFeatureForTask,
    setSidePanelOpen,
    setIsAddEpicModalOpen,
    setIsEditEpicModalOpen,
    setEditingEpicId,
    setIsAddFeatureModalOpen,
    setTargetEpicForFeature,
    setIsEditFeatureModalOpen,
    setEditingFeatureId,
    setEditingFeatureEpicId,
    setDeleteConfirm,
    setScrollToFeatureId,
    handleCloseEpicTab,
    handleDeleteEpic,
    handleDeleteFeature,
    handleCreateEpic,
    handleUpdateEpicFromModal,
    handleCreateFeature,
    handleUpdateFeatureFromModal,
    handleOpenEditFeatureModal,
    handleOpenEditEpicModal,
    handleOpenAddFeatureModal,
    handleAddEpicBelow,
    handleConfirmDelete,
    handleTaskCreate,
    handleTaskUpdate,
    handleTaskDelete,
  };
}
