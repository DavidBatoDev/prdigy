import { supabase } from "@/lib/supabase";

export interface CreateProjectData {
  title: string;
  brief?: string;
  description?: string;
  category?: string;
  project_state?: string;
  skills?: string[];
  duration?: string;
  budget_range?: string;
  funding_status?: string;
  start_date?: string;
  custom_start_date?: string;
  status?: "draft" | "active" | "bidding" | "paused" | "completed" | "archived";
}

export interface Project {
  id: string;
  title: string;
  brief?: string;
  description?: string;
  category?: string;
  project_state?: string;
  skills?: string[];
  duration?: string;
  budget_range?: string;
  funding_status?: string;
  start_date?: string;
  custom_start_date?: string;
  status: "draft" | "active" | "bidding" | "paused" | "completed" | "archived";
  client_id: string;
  consultant_id?: string;
  created_at: string;
  updated_at: string;
}

class ProjectService {
  /**
   * Create a new project
   */
  async create(data: CreateProjectData): Promise<Project> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/projects`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to create project");
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get a project by ID
   */
  async get(projectId: string): Promise<Project> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/projects/${projectId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to fetch project");
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Update a project
   */
  async update(
    projectId: string,
    data: Partial<CreateProjectData>
  ): Promise<Project> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/projects/${projectId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to update project");
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * List all projects for the current user
   */
  async list(): Promise<Project[]> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/projects`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to fetch projects");
    }

    const result = await response.json();
    return result.data;
  }
}

export const projectService = new ProjectService();
