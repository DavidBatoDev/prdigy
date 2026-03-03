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
  banner_url?: string;
  client_id: string;
  consultant_id?: string;
  client?: {
    id: string;
    display_name?: string;
    avatar_url?: string;
    email?: string;
  };
  consultant?: {
    id: string;
    display_name?: string;
    avatar_url?: string;
    email?: string;
  };
  members?: ProjectMember[];
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string | null;
  role: string;
  member_type: "stakeholder" | "freelancer" | "open_role";
  joined_at?: string;
  user?: {
    id: string;
    display_name?: string;
    avatar_url?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  };
}

export interface ProjectInvite {
  id: string;
  project_id: string;
  invited_by: string;
  invitee_id: string | null;
  invitee_email: string | null;
  invited_role: string | null;
  status: "pending" | "accepted" | "declined";
  message: string | null;
  created_at: string;
  updated_at: string;
  responded_at?: string | null;
  project?: {
    id: string;
    title: string;
    status: string;
  } | null;
  inviter?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
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
      },
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
      },
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
    data: Partial<CreateProjectData>,
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
      },
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
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to fetch projects");
    }

    const result = await response.json();
    return result.data;
  }

  async listDashboardProjects(): Promise<Project[]> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/projects/dashboard`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error?.message || "Failed to fetch dashboard projects",
      );
    }

    const result = await response.json();
    return result.data;
  }

  async getMembers(projectId: string): Promise<ProjectMember[]> {
    const project = await this.get(projectId);
    return project.members ?? [];
  }

  async addMember(
    projectId: string,
    data: {
      email?: string;
      role: string;
      member_type: "stakeholder" | "freelancer" | "open_role";
    },
  ): Promise<ProjectMember> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Authentication required");

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/projects/${projectId}/members`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      },
    );
    if (!response.ok) {
      const err = await response.json();
      throw new Error(
        err.message || err.error?.message || "Failed to add member",
      );
    }
    const result = await response.json();
    return result.data ?? result;
  }

  async updateMember(
    projectId: string,
    memberId: string,
    data: {
      role?: string;
      member_type?: "stakeholder" | "freelancer" | "open_role";
    },
  ): Promise<ProjectMember> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Authentication required");

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/projects/${projectId}/members/${memberId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      },
    );
    if (!response.ok) {
      const err = await response.json();
      throw new Error(
        err.message || err.error?.message || "Failed to update member",
      );
    }
    const result = await response.json();
    return result.data ?? result;
  }

  async inviteByEmail(
    projectId: string,
    data: {
      email: string;
      role: string;
      message?: string;
    },
  ): Promise<ProjectInvite> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Authentication required");

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/projects/${projectId}/invites`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(
        err.message || err.error?.message || "Failed to send invite",
      );
    }

    const result = await response.json();
    return result.data ?? result;
  }

  async getMyInvites(): Promise<ProjectInvite[]> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Authentication required");

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/projects/me/invites`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(
        err.message || err.error?.message || "Failed to fetch invites",
      );
    }

    const result = await response.json();
    return result.data ?? result;
  }

  async respondInvite(
    inviteId: string,
    status: "accepted" | "declined",
  ): Promise<{
    id: string;
    project_id: string;
    invited_by: string;
    status: string;
  }> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Authentication required");

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/projects/invites/${inviteId}/respond`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status }),
      },
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(
        err.message || err.error?.message || "Failed to respond to invite",
      );
    }

    const result = await response.json();
    return result.data ?? result;
  }

  async removeMember(projectId: string, memberId: string): Promise<void> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Authentication required");

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/projects/${projectId}/members/${memberId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    );
    if (!response.ok) {
      const err = await response.json();
      throw new Error(
        err.message || err.error?.message || "Failed to remove member",
      );
    }
  }
}

export const projectService = new ProjectService();
