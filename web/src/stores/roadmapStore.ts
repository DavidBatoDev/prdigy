/**
 * Roadmap Store - Zustand
 * Centralized state management for roadmap data and UI state
 */

import { create } from "zustand";
import {
  roadmapService,
  epicService,
  featureService,
  taskService,
} from "@/services/roadmap.service";
import type {
  Roadmap,
  RoadmapEpic,
  RoadmapFeature,
  RoadmapTask,
  RoadmapMilestone,
  FeatureStatus,
} from "@/types/roadmap";

export type CanvasViewMode = "roadmap" | "epic" | "milestones";

interface RoadmapState {
  // Data
  roadmap: Roadmap | null;
  epics: RoadmapEpic[];
  milestones: RoadmapMilestone[];

  // UI State - Canvas Navigation
  focusNodeId: string | null;
  focusNodeOffsetX: number;
  navigateToEpicId: string | null;
  navigateToFeature: { epicId: string; featureId: string } | null;
  openEpicEditorId: string | null;
  openFeatureEditor: { epicId: string; featureId: string } | null;
  openTaskDetailId: string | null;
  activeEpicId: string | null;

  // UI State - Canvas View Mode (shared so RoadmapViewContent can react)
  canvasViewMode: CanvasViewMode;
  canvasSelectedEpicId: string | null;
  canvasOpenEpicTabs: string[];

  // UI State - Modal Triggers
  addFeatureEpicId: string | null;
  addTaskFeatureId: string | null;

  // Loading States
  isLoadingRoadmap: boolean;
  isLoadingEpic: boolean;
  isLoadingFeature: boolean;
  isLoadingTask: boolean;
}

interface FeatureData {
  title: string;
  description: string;
  status: FeatureStatus;
  is_deliverable: boolean;
  start_date?: string;
  end_date?: string;
}

interface RoadmapActions {
  // Initialize & Reset
  loadRoadmap: (roadmapId: string) => Promise<void>;
  resetRoadmap: () => void;
  updateRoadmapMetadata: (roadmap: Partial<Roadmap>) => Promise<void>;

  // Epic CRUD
  addEpic: (
    milestoneId?: string,
    epicInput?: Partial<RoadmapEpic>,
  ) => Promise<void>;
  updateEpic: (epic: RoadmapEpic) => Promise<void>;
  deleteEpic: (epicId: string) => Promise<void>;

  // Feature CRUD
  addFeature: (epicId: string, data: FeatureData) => Promise<void>;
  updateFeature: (feature: RoadmapFeature) => Promise<void>;
  deleteFeature: (featureId: string) => Promise<void>;

  // Task CRUD
  addTask: (featureId: string, data: Partial<RoadmapTask>) => Promise<void>;
  updateTask: (task: RoadmapTask) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  // Milestone CRUD
  addMilestone: () => void;
  updateMilestone: (milestone: RoadmapMilestone) => void;
  deleteMilestone: (id: string) => void;

  // UI Actions
  openAddFeatureModal: (epicId: string) => void;
  closeAddFeatureModal: () => void;
  openAddTaskPanel: (featureId: string) => void;
  closeAddTaskPanel: () => void;
  navigateToNode: (nodeId: string, options?: { offsetX?: number }) => void;
  clearNodeFocus: () => void;
  navigateToEpicTab: (epicId: string) => void;
  clearNavigateToEpicTab: () => void;
  navigateToFeatureNode: (epicId: string, featureId: string) => void;
  clearNavigateToFeatureNode: () => void;
  openEpicEditor: (epicId: string) => void;
  clearOpenEpicEditor: () => void;
  openFeatureEditorModal: (epicId: string, featureId: string) => void;
  clearOpenFeatureEditorModal: () => void;
  openTaskDetail: (taskId: string) => void;
  clearOpenTaskDetail: () => void;
  setActiveEpicId: (epicId: string | null) => void;

  // Canvas view-mode actions
  setCanvasViewMode: (mode: CanvasViewMode) => void;
  setCanvasSelectedEpicId: (epicId: string | null) => void;
  setCanvasOpenEpicTabs: (tabs: string[] | ((prev: string[]) => string[])) => void;
  closeCanvasEpicTab: (epicId: string) => void;
}

type RoadmapStore = RoadmapState & RoadmapActions;

export const useRoadmapStore = create<RoadmapStore>((set, get) => ({
  // Initial State
  roadmap: null,
  epics: [],
  milestones: [],
  focusNodeId: null,
  focusNodeOffsetX: 0,
  navigateToEpicId: null,
  navigateToFeature: null,
  openEpicEditorId: null,
  openFeatureEditor: null,
  openTaskDetailId: null,
  activeEpicId: null,
  addFeatureEpicId: null,
  addTaskFeatureId: null,
  isLoadingRoadmap: false,
  isLoadingEpic: false,
  isLoadingFeature: false,
  isLoadingTask: false,
  canvasViewMode: "roadmap",
  canvasSelectedEpicId: null,
  canvasOpenEpicTabs: [],

  // Initialize - Load full roadmap data
  loadRoadmap: async (roadmapId: string) => {
    try {
      set({ isLoadingRoadmap: true });
      const fullRoadmap = await roadmapService.getFull(roadmapId);
      set({
        roadmap: fullRoadmap,
        epics: fullRoadmap.epics || [],
        milestones: fullRoadmap.milestones || [],
        isLoadingRoadmap: false,
      });
    } catch (error) {
      console.error("Failed to load roadmap:", error);
      set({ isLoadingRoadmap: false });
      throw error;
    }
  },

  // Reset - Clear all roadmap data
  resetRoadmap: () => {
    set({
      roadmap: null,
      epics: [],
      milestones: [],
      focusNodeId: null,
      focusNodeOffsetX: 0,
      navigateToEpicId: null,
      navigateToFeature: null,
      openEpicEditorId: null,
      openFeatureEditor: null,
      openTaskDetailId: null,
      activeEpicId: null,
      addFeatureEpicId: null,
      addTaskFeatureId: null,
      canvasViewMode: "roadmap",
      canvasSelectedEpicId: null,
      canvasOpenEpicTabs: [],
    });
  },

  // Update roadmap metadata
  updateRoadmapMetadata: async (updates: Partial<Roadmap>) => {
    const { roadmap } = get();
    if (!roadmap) return;

    try {
      await roadmapService.update(roadmap.id, updates);
      set({ roadmap: { ...roadmap, ...updates } });
    } catch (error) {
      console.error("Failed to update roadmap:", error);
      throw error;
    }
  },

  // Epic CRUD
  addEpic: async (_milestoneId?: string, epicInput?: Partial<RoadmapEpic>) => {
    const { roadmap, epics } = get();
    if (!roadmap) return;

    try {
      set({ isLoadingEpic: true });

      const newEpic = await epicService.create({
        roadmap_id: roadmap.id,
        title: epicInput?.title?.trim() || "New Epic",
        description: epicInput?.description || "",
        priority: epicInput?.priority || "medium",
        status: epicInput?.status || "backlog",
        position: epicInput?.position ?? epics.length,
        color: epicInput?.color,
        estimated_hours: epicInput?.estimated_hours,
        start_date: epicInput?.start_date,
        end_date: epicInput?.end_date,
        tags: epicInput?.tags,
        labels: epicInput?.labels,
      });

      // Update local state with optimistic update
      if (newEpic.position < epics.length) {
        const updatedEpics = epics.map((e) =>
          e.position >= newEpic.position
            ? { ...e, position: e.position + 1 }
            : e,
        );
        set({
          epics: [...updatedEpics, { ...newEpic, features: [] }],
          isLoadingEpic: false,
        });
      } else {
        set({
          epics: [...epics, { ...newEpic, features: [] }],
          isLoadingEpic: false,
        });
      }
    } catch (error) {
      console.error("Failed to create epic:", error);
      set({ isLoadingEpic: false });
      throw error;
    }
  },

  updateEpic: async (updatedEpic: RoadmapEpic) => {
    const { epics } = get();

    try {
      set({ isLoadingEpic: true });

      const updated = await epicService.update(updatedEpic.id, {
        title: updatedEpic.title,
        description: updatedEpic.description,
        priority: updatedEpic.priority,
        status: updatedEpic.status,
        position: updatedEpic.position,
        color: updatedEpic.color,
        estimated_hours: updatedEpic.estimated_hours,
        actual_hours: updatedEpic.actual_hours,
        start_date: updatedEpic.start_date,
        end_date: updatedEpic.end_date,
        completed_date: updatedEpic.completed_date,
        tags: updatedEpic.tags,
        labels: updatedEpic.labels,
      });

      set({
        epics: epics.map((e) =>
          e.id === updated.id ? { ...updated, features: e.features } : e,
        ),
        isLoadingEpic: false,
      });
    } catch (error) {
      console.error("Failed to update epic:", error);
      set({ isLoadingEpic: false });
      throw error;
    }
  },

  deleteEpic: async (epicId: string) => {
    const { epics } = get();

    try {
      set({ isLoadingEpic: true });
      await epicService.delete(epicId);
      set({
        epics: epics.filter((e) => e.id !== epicId),
        isLoadingEpic: false,
      });
    } catch (error) {
      console.error("Failed to delete epic:", error);
      set({ isLoadingEpic: false });
      throw error;
    }
  },

  // Feature CRUD
  addFeature: async (epicId: string, data: FeatureData) => {
    const { roadmap, epics } = get();
    if (!roadmap) return;

    const epic = epics.find((e) => e.id === epicId);
    if (!epic) return;

    try {
      set({ isLoadingFeature: true });

      const newFeature = await featureService.create({
        roadmap_id: roadmap.id,
        epic_id: epicId,
        title: data.title,
        description: data.description,
        status: data.status,
        position: epic.features?.length || 0,
        is_deliverable: data.is_deliverable,
        start_date: data.start_date,
        end_date: data.end_date,
      });

      set({
        epics: epics.map((e) =>
          e.id === epicId
            ? { ...e, features: [...(e.features || []), newFeature] }
            : e,
        ),
        isLoadingFeature: false,
      });
    } catch (error) {
      console.error("Failed to create feature:", error);
      set({ isLoadingFeature: false });
      throw error;
    }
  },

  updateFeature: async (feature: RoadmapFeature) => {
    const { epics } = get();

    try {
      set({ isLoadingFeature: true });

      const updated = await featureService.update(feature.id, {
        title: feature.title,
        description: feature.description,
        status: feature.status,
        position: feature.position,
        is_deliverable: feature.is_deliverable,
        estimated_hours: feature.estimated_hours,
        actual_hours: feature.actual_hours,
        start_date: feature.start_date,
        end_date: feature.end_date,
      });

      set({
        epics: epics.map((epic) =>
          epic.id === feature.epic_id
            ? {
                ...epic,
                features: (epic.features || []).map((f) =>
                  f.id === updated.id
                    ? { ...updated, tasks: f.tasks || [] }
                    : f,
                ),
              }
            : epic,
        ),
        isLoadingFeature: false,
      });
    } catch (error) {
      console.error("Failed to update feature:", error);
      set({ isLoadingFeature: false });
      throw error;
    }
  },

  deleteFeature: async (featureId: string) => {
    const { epics } = get();
    const epic = epics.find((e) => e.features?.some((f) => f.id === featureId));
    if (!epic) return;

    try {
      set({ isLoadingFeature: true });
      await featureService.delete(featureId);
      set({
        epics: epics.map((e) =>
          e.id === epic.id
            ? {
                ...e,
                features: e.features?.filter((f) => f.id !== featureId),
                updated_at: new Date().toISOString(),
              }
            : e,
        ),
        isLoadingFeature: false,
      });
    } catch (error) {
      console.error("Failed to delete feature:", error);
      set({ isLoadingFeature: false });
      throw error;
    }
  },

  // Task CRUD
  addTask: async (featureId: string, data: Partial<RoadmapTask>) => {
    if (!data.title) {
      console.warn("Task title is required");
      return;
    }

    const { epics } = get();

    try {
      set({ isLoadingTask: true });

      const newTask = await taskService.create({
        feature_id: featureId,
        title: data.title,
        status: data.status || "todo",
        priority: data.priority || "medium",
        position: data.position,
        due_date: data.due_date,
      });

      set({
        epics: epics.map((epic) => ({
          ...epic,
          features: (epic.features || []).map((feature) =>
            feature.id === featureId
              ? {
                  ...feature,
                  tasks: [...(feature.tasks || []), newTask],
                }
              : feature,
          ),
        })),
        isLoadingTask: false,
      });
    } catch (error) {
      console.error("Failed to create task:", error);
      set({ isLoadingTask: false });
      throw error;
    }
  },

  updateTask: async (task: RoadmapTask) => {
    const { epics } = get();

    try {
      set({ isLoadingTask: true });

      const updated = await taskService.update(task.id, {
        title: task.title,
        status: task.status,
        priority: task.priority,
        position: task.position,
        due_date: task.due_date,
        completed_at: task.completed_at,
      });

      set({
        epics: epics.map((epic) => ({
          ...epic,
          features: (epic.features || []).map((feature) => ({
            ...feature,
            tasks: (feature.tasks || []).map((t) =>
              t.id === updated.id ? updated : t,
            ),
          })),
        })),
        isLoadingTask: false,
      });
    } catch (error) {
      console.error("Failed to update task:", error);
      set({ isLoadingTask: false });
      throw error;
    }
  },

  deleteTask: async (taskId: string) => {
    const { epics } = get();

    try {
      set({ isLoadingTask: true });
      await taskService.delete(taskId);

      set({
        epics: epics.map((epic) => ({
          ...epic,
          features: (epic.features || []).map((feature) => ({
            ...feature,
            tasks: (feature.tasks || []).filter((t) => t.id !== taskId),
          })),
        })),
        isLoadingTask: false,
      });
    } catch (error) {
      console.error("Failed to delete task:", error);
      set({ isLoadingTask: false });
      throw error;
    }
  },

  // Milestone CRUD (kept simple for now)
  addMilestone: () => {
    const { roadmap, milestones } = get();
    if (!roadmap) return;

    const newMilestone: RoadmapMilestone = {
      id: `m${Date.now()}`,
      roadmap_id: roadmap.id,
      title: "New Milestone",
      target_date: new Date().toISOString(),
      status: "not_started",
      position: milestones.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set({ milestones: [...milestones, newMilestone] });
  },

  updateMilestone: (updated: RoadmapMilestone) => {
    const { milestones } = get();
    set({
      milestones: milestones.map((m) => (m.id === updated.id ? updated : m)),
    });
  },

  deleteMilestone: (id: string) => {
    const { milestones } = get();
    set({ milestones: milestones.filter((m) => m.id !== id) });
  },

  // UI Actions - Modal Triggers
  openAddFeatureModal: (epicId: string) => {
    set({ addFeatureEpicId: epicId });
  },

  closeAddFeatureModal: () => {
    set({ addFeatureEpicId: null });
  },

  openAddTaskPanel: (featureId: string) => {
    set({ addTaskFeatureId: featureId });
  },

  closeAddTaskPanel: () => {
    set({ addTaskFeatureId: null });
  },

  navigateToNode: (nodeId: string, options?: { offsetX?: number }) => {
    set({
      focusNodeId: nodeId,
      focusNodeOffsetX: options?.offsetX ?? 0,
    });
  },

  clearNodeFocus: () => {
    set({
      focusNodeId: null,
      focusNodeOffsetX: 0,
    });
  },

  navigateToEpicTab: (epicId: string) => {
    set({ navigateToEpicId: epicId });
  },

  clearNavigateToEpicTab: () => {
    set({ navigateToEpicId: null });
  },

  navigateToFeatureNode: (epicId: string, featureId: string) => {
    set({ navigateToFeature: { epicId, featureId } });
  },

  clearNavigateToFeatureNode: () => {
    set({ navigateToFeature: null });
  },

  openEpicEditor: (epicId: string) => {
    set({ openEpicEditorId: epicId });
  },

  clearOpenEpicEditor: () => {
    set({ openEpicEditorId: null });
  },

  openFeatureEditorModal: (epicId: string, featureId: string) => {
    set({ openFeatureEditor: { epicId, featureId } });
  },

  clearOpenFeatureEditorModal: () => {
    set({ openFeatureEditor: null });
  },

  openTaskDetail: (taskId: string) => {
    set({ openTaskDetailId: taskId });
  },

  clearOpenTaskDetail: () => {
    set({ openTaskDetailId: null });
  },

  setActiveEpicId: (epicId: string | null) => {
    set({ activeEpicId: epicId });
  },

  setCanvasViewMode: (mode: CanvasViewMode) => {
    set({ canvasViewMode: mode });
  },

  setCanvasSelectedEpicId: (epicId: string | null) => {
    set({ canvasSelectedEpicId: epicId });
  },

  setCanvasOpenEpicTabs: (tabs: string[] | ((prev: string[]) => string[])) => {
    if (typeof tabs === "function") {
      set((state) => ({ canvasOpenEpicTabs: tabs(state.canvasOpenEpicTabs) }));
    } else {
      set({ canvasOpenEpicTabs: tabs });
    }
  },

  closeCanvasEpicTab: (epicId: string) => {
    const { canvasOpenEpicTabs, canvasSelectedEpicId } = get();
    const newTabs = canvasOpenEpicTabs.filter((id) => id !== epicId);
    const updates: Partial<RoadmapStore> = { canvasOpenEpicTabs: newTabs };
    if (canvasSelectedEpicId === epicId) {
      if (newTabs.length > 0) {
        updates.canvasSelectedEpicId = newTabs[newTabs.length - 1];
      } else {
        updates.canvasViewMode = "roadmap";
        updates.canvasSelectedEpicId = null;
      }
    }
    set(updates);
  },
}));

// Selectors for fine-grained subscriptions
export const useRoadmap = () => useRoadmapStore((state) => state.roadmap);
export const useEpics = () => useRoadmapStore((state) => state.epics);
export const useMilestones = () => useRoadmapStore((state) => state.milestones);
export const useRoadmapLoading = () =>
  useRoadmapStore((state) => state.isLoadingRoadmap);
