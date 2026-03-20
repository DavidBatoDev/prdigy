export type TimeLogStatus = 'pending' | 'approved' | 'rejected';
export type TimeLogSource = 'timer' | 'manual';

export type TaskTimeLogRecord = {
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
  source: TimeLogSource;
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
};

export type TimeLogsListResult = {
  items: TaskTimeLogRecord[];
  total: number;
  page: number;
  limit: number;
};

export type TimeLogsQueryFilters = {
  from?: string;
  to?: string;
  status?: TimeLogStatus;
  member_user_id?: string;
  task_id?: string;
  page: number;
  limit: number;
};

export interface ProjectTimeRepository {
  getTaskProjectId(taskId: string): Promise<string | null>;
  findById(id: string): Promise<TaskTimeLogRecord | null>;
  stopActiveForMember(
    projectId: string,
    memberUserId: string,
    endedAtIso: string,
  ): Promise<void>;
  createStartedLog(params: {
    project_id: string;
    task_id: string;
    member_user_id: string;
    started_at: string;
    source: TimeLogSource;
  }): Promise<TaskTimeLogRecord>;
  stopLogById(params: {
    id: string;
    ended_at: string;
  }): Promise<TaskTimeLogRecord>;
  updateLogById(
    id: string,
    patch: Record<string, unknown>,
  ): Promise<TaskTimeLogRecord>;
  listProjectLogs(
    projectId: string,
    filters: TimeLogsQueryFilters,
  ): Promise<TimeLogsListResult>;
  listTaskLogsForMember(params: {
    projectId: string;
    taskId: string;
    memberUserId: string;
    page: number;
    limit: number;
  }): Promise<TimeLogsListResult>;
}

