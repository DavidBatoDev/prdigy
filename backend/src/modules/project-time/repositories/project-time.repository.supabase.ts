import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../../config/supabase.module';
import type {
  ProjectMemberTimeRateRecord,
  ProjectTimeRepository,
  TaskTimeLogRecord,
  TimeLogsListResult,
  TimeLogsQueryFilters,
} from './project-time.repository.interface';

@Injectable()
export class ProjectTimeRepositorySupabase implements ProjectTimeRepository {
  constructor(@Inject(SUPABASE_ADMIN) private readonly db: SupabaseClient) {}

  private readonly rateSelectClause = `
    *,
    member:profiles!project_member_time_rates_member_user_id_fkey(id, display_name, email, avatar_url, banner_url),
    project_member:project_members!project_member_time_rates_project_member_id_fkey(id, role, position)
  `;

  private readonly selectClause = `
    *,
    task:roadmap_tasks(id, title),
    member:profiles!task_time_logs_member_user_id_fkey(id, display_name, email, avatar_url),
    reviewer:profiles!task_time_logs_reviewed_by_fkey(id, display_name, email, avatar_url)
  `;

  private durationSeconds(startedAtIso: string, endedAtIso: string): number {
    const started = new Date(startedAtIso).getTime();
    const ended = new Date(endedAtIso).getTime();
    return Math.max(0, Math.floor((ended - started) / 1000));
  }

  async hasProjectMemberRate(
    projectId: string,
    memberUserId: string,
  ): Promise<boolean> {
    const { data, error } = await this.db
      .from('project_member_time_rates')
      .select('id')
      .eq('project_id', projectId)
      .eq('member_user_id', memberUserId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return Boolean(data?.id);
  }

  async findProjectMemberRateById(
    projectId: string,
    rateId: string,
  ): Promise<ProjectMemberTimeRateRecord | null> {
    const { data, error } = await this.db
      .from('project_member_time_rates')
      .select(this.rateSelectClause)
      .eq('project_id', projectId)
      .eq('id', rateId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as ProjectMemberTimeRateRecord | null) ?? null;
  }

  async findProjectMemberRateByUser(
    projectId: string,
    memberUserId: string,
  ): Promise<ProjectMemberTimeRateRecord | null> {
    const { data, error } = await this.db
      .from('project_member_time_rates')
      .select(this.rateSelectClause)
      .eq('project_id', projectId)
      .eq('member_user_id', memberUserId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as ProjectMemberTimeRateRecord | null) ?? null;
  }

  async listProjectMemberRates(
    projectId: string,
  ): Promise<ProjectMemberTimeRateRecord[]> {
    const { data, error } = await this.db
      .from('project_member_time_rates')
      .select(this.rateSelectClause)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data as ProjectMemberTimeRateRecord[] | null) ?? [];
  }

  async createProjectMemberRate(params: {
    project_id: string;
    project_member_id: string;
    member_user_id: string;
    hourly_rate: number;
    currency: string;
  }): Promise<ProjectMemberTimeRateRecord> {
    const { data, error } = await this.db
      .from('project_member_time_rates')
      .insert(params)
      .select(this.rateSelectClause)
      .single();
    if (error) throw new Error(error.message);
    return data as ProjectMemberTimeRateRecord;
  }

  async updateProjectMemberRateById(
    id: string,
    patch: {
      hourly_rate?: number;
      currency?: string;
    },
  ): Promise<ProjectMemberTimeRateRecord> {
    const { data, error } = await this.db
      .from('project_member_time_rates')
      .update(patch)
      .eq('id', id)
      .select(this.rateSelectClause)
      .single();
    if (error) throw new Error(error.message);
    return data as ProjectMemberTimeRateRecord;
  }

  async getProjectMemberForUser(
    projectId: string,
    userId: string,
  ): Promise<{ id: string; user_id: string | null } | null> {
    const { data, error } = await this.db
      .from('project_members')
      .select('id, user_id')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      id: data.id as string,
      user_id: (data.user_id as string | null | undefined) ?? null,
    };
  }

  async getProjectMemberById(
    projectId: string,
    projectMemberId: string,
  ): Promise<{ id: string; user_id: string | null } | null> {
    const { data, error } = await this.db
      .from('project_members')
      .select('id, user_id')
      .eq('project_id', projectId)
      .eq('id', projectMemberId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      id: data.id as string,
      user_id: (data.user_id as string | null | undefined) ?? null,
    };
  }

  async getTaskProjectId(taskId: string): Promise<string | null> {
    const { data: task, error: taskError } = await this.db
      .from('roadmap_tasks')
      .select('feature_id')
      .eq('id', taskId)
      .maybeSingle();
    if (taskError) throw new Error(taskError.message);
    if (!task?.feature_id) return null;

    const { data: feature, error: featureError } = await this.db
      .from('roadmap_features')
      .select('roadmap_id')
      .eq('id', task.feature_id as string)
      .maybeSingle();
    if (featureError) throw new Error(featureError.message);
    if (!feature?.roadmap_id) return null;

    const { data: roadmap, error: roadmapError } = await this.db
      .from('roadmaps')
      .select('project_id')
      .eq('id', feature.roadmap_id as string)
      .maybeSingle();
    if (roadmapError) throw new Error(roadmapError.message);
    return (roadmap?.project_id as string | null | undefined) ?? null;
  }

  async findById(id: string): Promise<TaskTimeLogRecord | null> {
    const { data, error } = await this.db
      .from('task_time_logs')
      .select(this.selectClause)
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data as TaskTimeLogRecord | null) ?? null;
  }

  async stopActiveForMember(
    projectId: string,
    memberUserId: string,
    endedAtIso: string,
  ): Promise<void> {
    const { data, error } = await this.db
      .from('task_time_logs')
      .select('id, started_at')
      .eq('project_id', projectId)
      .eq('member_user_id', memberUserId)
      .is('ended_at', null);

    if (error) throw new Error(error.message);
    if (!data?.length) return;

    await Promise.all(
      data.map(async (row) => {
        const startedAt = row.started_at as string;
        const duration = this.durationSeconds(startedAt, endedAtIso);
        const { error: updateError } = await this.db
          .from('task_time_logs')
          .update({
            ended_at: endedAtIso,
            duration_seconds: duration,
          })
          .eq('id', row.id as string);
        if (updateError) throw new Error(updateError.message);
      }),
    );
  }

  async createStartedLog(params: {
    project_id: string;
    task_id: string;
    member_user_id: string;
    started_at: string;
    source: 'timer' | 'manual';
  }): Promise<TaskTimeLogRecord> {
    const { data, error } = await this.db
      .from('task_time_logs')
      .insert({
        ...params,
        status: 'pending',
        ended_at: null,
        duration_seconds: null,
      })
      .select(this.selectClause)
      .single();

    if (error) throw new Error(error.message);
    return data as TaskTimeLogRecord;
  }

  async stopLogById(params: {
    id: string;
    ended_at: string;
  }): Promise<TaskTimeLogRecord> {
    const existing = await this.findById(params.id);
    if (!existing) throw new Error('Time log not found');
    const duration = this.durationSeconds(existing.started_at, params.ended_at);

    const { data, error } = await this.db
      .from('task_time_logs')
      .update({
        ended_at: params.ended_at,
        duration_seconds: duration,
      })
      .eq('id', params.id)
      .select(this.selectClause)
      .single();

    if (error) throw new Error(error.message);
    return data as TaskTimeLogRecord;
  }

  async updateLogById(
    id: string,
    patch: Record<string, unknown>,
  ): Promise<TaskTimeLogRecord> {
    const { data, error } = await this.db
      .from('task_time_logs')
      .update(patch)
      .eq('id', id)
      .select(this.selectClause)
      .single();

    if (error) throw new Error(error.message);
    return data as TaskTimeLogRecord;
  }

  async listProjectLogs(
    projectId: string,
    filters: TimeLogsQueryFilters,
  ): Promise<TimeLogsListResult> {
    const from = (filters.page - 1) * filters.limit;
    const to = from + filters.limit - 1;

    let base = this.db
      .from('task_time_logs')
      .select('*', { count: 'exact', head: true });
    base = base.eq('project_id', projectId);
    if (filters.status) base = base.eq('status', filters.status);
    if (filters.member_user_id)
      base = base.eq('member_user_id', filters.member_user_id);
    if (filters.task_id) base = base.eq('task_id', filters.task_id);
    if (filters.from) base = base.gte('started_at', filters.from);
    if (filters.to) base = base.lte('started_at', filters.to);

    const { count, error: countError } = await base;
    if (countError) throw new Error(countError.message);

    let itemsQuery = this.db
      .from('task_time_logs')
      .select(this.selectClause)
      .eq('project_id', projectId)
      .order('started_at', { ascending: false })
      .range(from, to);
    if (filters.status) itemsQuery = itemsQuery.eq('status', filters.status);
    if (filters.member_user_id)
      itemsQuery = itemsQuery.eq('member_user_id', filters.member_user_id);
    if (filters.task_id) itemsQuery = itemsQuery.eq('task_id', filters.task_id);
    if (filters.from) itemsQuery = itemsQuery.gte('started_at', filters.from);
    if (filters.to) itemsQuery = itemsQuery.lte('started_at', filters.to);

    const { data, error } = await itemsQuery;
    if (error) throw new Error(error.message);

    return {
      items: (data ?? []) as TaskTimeLogRecord[],
      total: count ?? 0,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async listTaskLogsForMember(params: {
    projectId: string;
    taskId: string;
    memberUserId: string;
    page: number;
    limit: number;
  }): Promise<TimeLogsListResult> {
    return this.listProjectLogs(params.projectId, {
      page: params.page,
      limit: params.limit,
      task_id: params.taskId,
      member_user_id: params.memberUserId,
    });
  }
}
