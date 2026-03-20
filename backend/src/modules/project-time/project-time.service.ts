import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectsService } from '../projects/projects.service';
import {
  ReviewTimeLogDto,
  StartTimeLogDto,
  StopTimeLogDto,
  TimeLogsQueryDto,
  UpdateTimeLogDto,
} from './dto/project-time.dto';
import type {
  ProjectTimeRepository,
  TaskTimeLogRecord,
  TimeLogsListResult,
} from './repositories/project-time.repository.interface';

export const PROJECT_TIME_REPOSITORY = Symbol('PROJECT_TIME_REPOSITORY');

@Injectable()
export class ProjectTimeService {
  constructor(
    @Inject(PROJECT_TIME_REPOSITORY)
    private readonly repo: ProjectTimeRepository,
    private readonly projectsService: ProjectsService,
  ) {}

  private asIso(value: string | undefined): string {
    return value ? new Date(value).toISOString() : new Date().toISOString();
  }

  private computeDurationSeconds(
    startedAtIso: string,
    endedAtIso?: string | null,
  ): number | null {
    if (!endedAtIso) return null;
    const started = new Date(startedAtIso).getTime();
    const ended = new Date(endedAtIso).getTime();
    return Math.max(0, Math.floor((ended - started) / 1000));
  }

  private async assertTaskBelongsToProject(
    taskId: string,
    projectId: string,
  ): Promise<void> {
    const taskProjectId = await this.repo.getTaskProjectId(taskId);
    if (!taskProjectId) {
      throw new NotFoundException('Task not found');
    }
    if (taskProjectId !== projectId) {
      throw new BadRequestException(
        'Task does not belong to the specified project.',
      );
    }
  }

  private validateTimeWindow(startedAtIso: string, endedAtIso?: string | null) {
    if (!endedAtIso) return;
    if (new Date(endedAtIso).getTime() <= new Date(startedAtIso).getTime()) {
      throw new BadRequestException('End time must be later than start time.');
    }
  }

  private async getLogOrThrow(logId: string): Promise<TaskTimeLogRecord> {
    const existing = await this.repo.findById(logId);
    if (!existing) throw new NotFoundException('Time log not found');
    return existing;
  }

  private normalizePaging(query: TimeLogsQueryDto): { page: number; limit: number } {
    return {
      page: query.page && query.page > 0 ? query.page : 1,
      limit: query.limit && query.limit > 0 ? query.limit : 20,
    };
  }

  async start(userId: string, dto: StartTimeLogDto): Promise<TaskTimeLogRecord> {
    await this.projectsService.assertProjectPermission(
      dto.project_id,
      userId,
      'time.log',
    );
    await this.assertTaskBelongsToProject(dto.task_id, dto.project_id);

    const nowIso = new Date().toISOString();
    await this.repo.stopActiveForMember(dto.project_id, userId, nowIso);

    return this.repo.createStartedLog({
      project_id: dto.project_id,
      task_id: dto.task_id,
      member_user_id: userId,
      started_at: nowIso,
      source: 'timer',
    });
  }

  async stop(
    userId: string,
    logId: string,
    dto: StopTimeLogDto,
  ): Promise<TaskTimeLogRecord> {
    const existing = await this.getLogOrThrow(logId);

    if (existing.member_user_id === userId) {
      await this.projectsService.assertProjectAnyPermission(
        existing.project_id,
        userId,
        ['time.edit_own', 'time.log'],
      );
    } else {
      await this.projectsService.assertProjectPermission(
        existing.project_id,
        userId,
        'time.edit_team',
      );
    }

    const endedAtIso = this.asIso(dto.ended_at);
    this.validateTimeWindow(existing.started_at, endedAtIso);
    return this.repo.stopLogById({ id: logId, ended_at: endedAtIso });
  }

  async update(
    userId: string,
    logId: string,
    dto: UpdateTimeLogDto,
  ): Promise<TaskTimeLogRecord> {
    const existing = await this.getLogOrThrow(logId);
    const isOwn = existing.member_user_id === userId;

    if (isOwn) {
      await this.projectsService.assertProjectPermission(
        existing.project_id,
        userId,
        'time.edit_own',
      );
    } else {
      await this.projectsService.assertProjectPermission(
        existing.project_id,
        userId,
        'time.edit_team',
      );
    }

    const nextStartedAt = dto.started_at
      ? this.asIso(dto.started_at)
      : existing.started_at;
    const nextEndedAt =
      dto.ended_at === undefined ? existing.ended_at : this.asIso(dto.ended_at);
    this.validateTimeWindow(nextStartedAt, nextEndedAt);

    const startedChanged = nextStartedAt !== existing.started_at;
    const endedChanged = (nextEndedAt ?? null) !== (existing.ended_at ?? null);
    const hasTimeChanged = startedChanged || endedChanged;

    const patch: Record<string, unknown> = {
      started_at: nextStartedAt,
      ended_at: nextEndedAt,
      duration_seconds: this.computeDurationSeconds(nextStartedAt, nextEndedAt),
    };

    if (dto.review_note !== undefined) {
      patch.review_note = dto.review_note.trim() || null;
    }

    if (existing.status === 'approved' && hasTimeChanged) {
      patch.status = 'pending';
      patch.reviewed_by = null;
      patch.reviewed_at = null;
    }

    if (dto.started_at !== undefined || dto.ended_at !== undefined) {
      patch.source = 'manual';
    }

    return this.repo.updateLogById(logId, patch);
  }

  async review(
    userId: string,
    logId: string,
    dto: ReviewTimeLogDto,
  ): Promise<TaskTimeLogRecord> {
    const existing = await this.getLogOrThrow(logId);
    await this.projectsService.assertProjectPermission(
      existing.project_id,
      userId,
      'time.approve',
    );

    const nowIso = new Date().toISOString();
    return this.repo.updateLogById(logId, {
      status: dto.decision,
      reviewed_by: userId,
      reviewed_at: nowIso,
      review_note: dto.reason?.trim() || null,
    });
  }

  async listMyLogs(
    userId: string,
    projectId: string,
    query: TimeLogsQueryDto,
  ): Promise<TimeLogsListResult> {
    await this.projectsService.assertProjectPermission(projectId, userId, 'time.view');
    const { page, limit } = this.normalizePaging(query);
    return this.repo.listProjectLogs(projectId, {
      page,
      limit,
      from: query.from,
      to: query.to,
      status: query.status,
      member_user_id: userId,
      task_id: query.task_id,
    });
  }

  async listApprovals(
    userId: string,
    projectId: string,
    query: TimeLogsQueryDto,
  ): Promise<TimeLogsListResult> {
    await this.projectsService.assertProjectPermission(
      projectId,
      userId,
      'time.approve',
    );
    const { page, limit } = this.normalizePaging(query);
    return this.repo.listProjectLogs(projectId, {
      page,
      limit,
      from: query.from,
      to: query.to,
      status: query.status,
      member_user_id: query.member_user_id,
      task_id: query.task_id,
    });
  }

  async listTeamLogs(
    userId: string,
    projectId: string,
    query: TimeLogsQueryDto,
  ): Promise<TimeLogsListResult> {
    await this.projectsService.assertProjectPermission(
      projectId,
      userId,
      'time.edit_team',
    );
    const { page, limit } = this.normalizePaging(query);
    return this.repo.listProjectLogs(projectId, {
      page,
      limit,
      from: query.from,
      to: query.to,
      status: query.status,
      member_user_id: query.member_user_id,
      task_id: query.task_id,
    });
  }

  async listMyTaskLogs(
    userId: string,
    projectId: string,
    taskId: string,
    query: TimeLogsQueryDto,
  ): Promise<TimeLogsListResult> {
    await this.projectsService.assertProjectPermission(projectId, userId, 'time.view');
    await this.assertTaskBelongsToProject(taskId, projectId);
    const { page, limit } = this.normalizePaging(query);
    return this.repo.listTaskLogsForMember({
      projectId,
      taskId,
      memberUserId: userId,
      page,
      limit,
    });
  }
}
