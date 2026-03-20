import { apiClient } from "@/api";

export type TimeLogStatus = "pending" | "approved" | "rejected";

export interface TaskTimeLog {
  id: string;
  project_id: string;
  task_id: string;
  member_user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  status: TimeLogStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  source: "timer" | "manual";
  created_at: string;
  updated_at: string;
  task?: {
    id: string;
    title: string;
  };
  member?: {
    id: string;
    display_name?: string;
    email?: string;
    avatar_url?: string;
  };
  reviewer?: {
    id: string;
    display_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

export interface TimeLogListResult {
  items: TaskTimeLog[];
  total: number;
  page: number;
  limit: number;
}

type ApiResponse<T> = {
  data: T;
};

function extractError(error: unknown, fallback: string): Error {
  const maybeAxios = error as {
    response?: { data?: { error?: { message?: string }; message?: string } };
    message?: string;
  };
  const message =
    maybeAxios?.response?.data?.error?.message ||
    maybeAxios?.response?.data?.message ||
    maybeAxios?.message ||
    fallback;
  return new Error(message);
}

export const projectTimeService = {
  async start(projectId: string, taskId: string): Promise<TaskTimeLog> {
    try {
      const response = await apiClient.post<ApiResponse<TaskTimeLog>>(
        "/api/project-time/logs/start",
        {
          project_id: projectId,
          task_id: taskId,
        },
      );
      return response.data.data;
    } catch (error) {
      throw extractError(error, "Failed to start timer");
    }
  },

  async stop(logId: string, endedAt?: string): Promise<TaskTimeLog> {
    try {
      const response = await apiClient.post<ApiResponse<TaskTimeLog>>(
        `/api/project-time/logs/${logId}/stop`,
        endedAt ? { ended_at: endedAt } : {},
      );
      return response.data.data;
    } catch (error) {
      throw extractError(error, "Failed to stop timer");
    }
  },

  async update(
    logId: string,
    payload: {
      started_at?: string;
      ended_at?: string;
      review_note?: string;
    },
  ): Promise<TaskTimeLog> {
    try {
      const response = await apiClient.patch<ApiResponse<TaskTimeLog>>(
        `/api/project-time/logs/${logId}`,
        payload,
      );
      return response.data.data;
    } catch (error) {
      throw extractError(error, "Failed to update time log");
    }
  },

  async review(
    logId: string,
    decision: "approved" | "rejected",
    reason?: string,
  ): Promise<TaskTimeLog> {
    try {
      const response = await apiClient.post<ApiResponse<TaskTimeLog>>(
        `/api/project-time/logs/${logId}/review`,
        {
          decision,
          reason,
        },
      );
      return response.data.data;
    } catch (error) {
      throw extractError(error, "Failed to review time log");
    }
  },

  async listMyLogs(
    projectId: string,
    query?: {
      from?: string;
      to?: string;
      status?: TimeLogStatus;
      task_id?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<TimeLogListResult> {
    try {
      const response = await apiClient.get<ApiResponse<TimeLogListResult>>(
        `/api/project-time/projects/${projectId}/my`,
        { params: query },
      );
      return response.data.data;
    } catch (error) {
      throw extractError(error, "Failed to fetch time logs");
    }
  },

  async listApprovals(
    projectId: string,
    query?: {
      from?: string;
      to?: string;
      status?: TimeLogStatus;
      task_id?: string;
      member_user_id?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<TimeLogListResult> {
    try {
      const response = await apiClient.get<ApiResponse<TimeLogListResult>>(
        `/api/project-time/projects/${projectId}/approvals`,
        { params: query },
      );
      return response.data.data;
    } catch (error) {
      throw extractError(error, "Failed to fetch approval logs");
    }
  },

  async listTeamLogs(
    projectId: string,
    query?: {
      from?: string;
      to?: string;
      status?: TimeLogStatus;
      task_id?: string;
      member_user_id?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<TimeLogListResult> {
    try {
      const response = await apiClient.get<ApiResponse<TimeLogListResult>>(
        `/api/project-time/projects/${projectId}/team`,
        { params: query },
      );
      return response.data.data;
    } catch (error) {
      throw extractError(error, "Failed to fetch team logs");
    }
  },

  async listMyTaskLogs(
    projectId: string,
    taskId: string,
    query?: { page?: number; limit?: number },
  ): Promise<TimeLogListResult> {
    try {
      const response = await apiClient.get<ApiResponse<TimeLogListResult>>(
        `/api/project-time/projects/${projectId}/tasks/${taskId}/logs/me`,
        { params: query },
      );
      return response.data.data;
    } catch (error) {
      throw extractError(error, "Failed to fetch task time logs");
    }
  },
};
