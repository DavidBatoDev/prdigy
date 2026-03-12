import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../../config/supabase.module';
import { ProjectsService } from '../../projects/projects.service';

@Injectable()
export class RoadmapAuthorizationService {
  constructor(
    @Inject(SUPABASE_ADMIN) private readonly db: SupabaseClient,
    private readonly projectsService: ProjectsService,
  ) {}

  private async getProjectIdByRoadmapId(
    roadmapId: string,
  ): Promise<string | null> {
    const { data, error } = await this.db
      .from('roadmaps')
      .select('project_id')
      .eq('id', roadmapId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data?.project_id as string | null | undefined) ?? null;
  }

  private async getRoadmapIdByMilestoneId(
    milestoneId: string,
  ): Promise<string | null> {
    const { data, error } = await this.db
      .from('roadmap_milestones')
      .select('roadmap_id')
      .eq('id', milestoneId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data?.roadmap_id as string | null | undefined) ?? null;
  }

  private async getRoadmapIdByEpicId(epicId: string): Promise<string | null> {
    const { data, error } = await this.db
      .from('roadmap_epics')
      .select('roadmap_id')
      .eq('id', epicId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data?.roadmap_id as string | null | undefined) ?? null;
  }

  private async getRoadmapIdByFeatureId(
    featureId: string,
  ): Promise<string | null> {
    const { data, error } = await this.db
      .from('roadmap_features')
      .select('roadmap_id')
      .eq('id', featureId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data?.roadmap_id as string | null | undefined) ?? null;
  }

  private async getFeatureIdByTaskId(taskId: string): Promise<string | null> {
    const { data, error } = await this.db
      .from('roadmap_tasks')
      .select('feature_id')
      .eq('id', taskId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data?.feature_id as string | null | undefined) ?? null;
  }

  async assertRoadmapPermission(
    roadmapId: string,
    userId: string,
    permission:
      | 'roadmap.edit'
      | 'roadmap.view_internal'
      | 'roadmap.comment'
      | 'roadmap.promote',
  ): Promise<void> {
    const projectId = await this.getProjectIdByRoadmapId(roadmapId);

    if (!projectId) {
      throw new NotFoundException('Roadmap project not found');
    }

    await this.projectsService.assertProjectPermission(
      projectId,
      userId,
      permission,
    );
  }

  async assertProjectRoadmapPermission(
    projectId: string,
    userId: string,
    permission:
      | 'roadmap.edit'
      | 'roadmap.view_internal'
      | 'roadmap.comment'
      | 'roadmap.promote',
  ): Promise<void> {
    await this.projectsService.assertProjectPermission(
      projectId,
      userId,
      permission,
    );
  }

  async assertMilestonePermission(
    milestoneId: string,
    userId: string,
    permission:
      | 'roadmap.edit'
      | 'roadmap.view_internal'
      | 'roadmap.comment'
      | 'roadmap.promote',
  ): Promise<void> {
    const roadmapId = await this.getRoadmapIdByMilestoneId(milestoneId);
    if (!roadmapId) throw new NotFoundException('Milestone not found');
    await this.assertRoadmapPermission(roadmapId, userId, permission);
  }

  async assertEpicPermission(
    epicId: string,
    userId: string,
    permission:
      | 'roadmap.edit'
      | 'roadmap.view_internal'
      | 'roadmap.comment'
      | 'roadmap.promote',
  ): Promise<void> {
    const roadmapId = await this.getRoadmapIdByEpicId(epicId);
    if (!roadmapId) throw new NotFoundException('Epic not found');
    await this.assertRoadmapPermission(roadmapId, userId, permission);
  }

  async assertFeaturePermission(
    featureId: string,
    userId: string,
    permission:
      | 'roadmap.edit'
      | 'roadmap.view_internal'
      | 'roadmap.comment'
      | 'roadmap.promote',
  ): Promise<void> {
    const roadmapId = await this.getRoadmapIdByFeatureId(featureId);
    if (!roadmapId) throw new NotFoundException('Feature not found');
    await this.assertRoadmapPermission(roadmapId, userId, permission);
  }

  async assertTaskPermission(
    taskId: string,
    userId: string,
    permission:
      | 'roadmap.edit'
      | 'roadmap.view_internal'
      | 'roadmap.comment'
      | 'roadmap.promote',
  ): Promise<void> {
    const featureId = await this.getFeatureIdByTaskId(taskId);
    if (!featureId) throw new NotFoundException('Task not found');
    await this.assertFeaturePermission(featureId, userId, permission);
  }

  async assertRoadmapCommentPermission(
    roadmapId: string,
    userId: string,
  ): Promise<void> {
    const projectId = await this.getProjectIdByRoadmapId(roadmapId);

    if (!projectId) {
      throw new NotFoundException('Roadmap project not found');
    }

    await this.projectsService.assertProjectAnyPermission(projectId, userId, [
      'roadmap.comment',
      'roadmap.edit',
    ]);
  }

  async assertProjectRoadmapCommentPermission(
    projectId: string,
    userId: string,
  ): Promise<void> {
    await this.projectsService.assertProjectAnyPermission(projectId, userId, [
      'roadmap.comment',
      'roadmap.edit',
    ]);
  }

  async assertEpicCommentPermission(
    epicId: string,
    userId: string,
  ): Promise<void> {
    const roadmapId = await this.getRoadmapIdByEpicId(epicId);
    if (!roadmapId) throw new NotFoundException('Epic not found');
    await this.assertRoadmapCommentPermission(roadmapId, userId);
  }

  async assertFeatureCommentPermission(
    featureId: string,
    userId: string,
  ): Promise<void> {
    const roadmapId = await this.getRoadmapIdByFeatureId(featureId);
    if (!roadmapId) throw new NotFoundException('Feature not found');
    await this.assertRoadmapCommentPermission(roadmapId, userId);
  }

  async assertTaskCommentPermission(
    taskId: string,
    userId: string,
  ): Promise<void> {
    const featureId = await this.getFeatureIdByTaskId(taskId);
    if (!featureId) throw new NotFoundException('Task not found');
    await this.assertFeatureCommentPermission(featureId, userId);
  }
}
