import apiClient from "../axios";
import type { Roadmap } from "../../types/roadmap";

// API Response types
interface ApiResponse<T> {
  data: T;
}

// Request DTOs
export interface CreateRoadmapDto {
  name: string;
  description?: string;
  project_id?: string | null;
  status?: "draft" | "active" | "paused" | "completed" | "archived";
  start_date?: string;
  end_date?: string;
  settings?: Record<string, any>;
}

export interface UpdateRoadmapDto {
  name?: string;
  description?: string;
  status?: "draft" | "active" | "paused" | "completed" | "archived";
  start_date?: string;
  end_date?: string;
  settings?: Record<string, any>;
}

// Full roadmap structure with nested data
export interface FullRoadmap extends Roadmap {
  milestones: any[];
  epics: any[];
}

/**
 * Get all roadmaps for the current user
 */
export const getRoadmaps = async (): Promise<Roadmap[]> => {
  const response = await apiClient.get<ApiResponse<Roadmap[]>>("/api/roadmaps");
  return response.data.data;
};

/**
 * Get a single roadmap by ID
 */
export const getRoadmap = async (id: string): Promise<Roadmap> => {
  const response = await apiClient.get<ApiResponse<Roadmap>>(
    `/api/roadmaps/${id}`,
  );
  return response.data.data;
};

/**
 * Get a roadmap with full nested structure (milestones, epics, features, tasks)
 */
export const getRoadmapFull = async (id: string): Promise<FullRoadmap> => {
  const response = await apiClient.get<ApiResponse<FullRoadmap>>(
    `/api/roadmaps/${id}/full`,
  );
  return response.data.data;
};

/**
 * Create a new roadmap
 */
export const createRoadmap = async (
  data: CreateRoadmapDto,
): Promise<Roadmap> => {
  const response = await apiClient.post<ApiResponse<Roadmap>>(
    "/api/roadmaps",
    data,
  );
  return response.data.data;
};

/**
 * Update a roadmap
 */
export const updateRoadmap = async (
  id: string,
  data: UpdateRoadmapDto,
): Promise<Roadmap> => {
  const response = await apiClient.patch<ApiResponse<Roadmap>>(
    `/api/roadmaps/${id}`,
    data,
  );
  return response.data.data;
};

/**
 * Delete a roadmap
 */
export const deleteRoadmap = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/roadmaps/${id}`);
};
