import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../../config/supabase.module';
import { IRoadmapsRepository } from './roadmaps.repository.interface';
import { CreateRoadmapDto, UpdateRoadmapDto } from '../dto/roadmaps.dto';

@Injectable()
export class RoadmapsRepositorySupabase implements IRoadmapsRepository {
  constructor(@Inject(SUPABASE_ADMIN) private readonly db: SupabaseClient) {}

  async findAll(userId: string): Promise<any[]> {
    const { data, error } = await this.db
      .from('roadmaps')
      .select('*, project:projects(id, title)')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async findById(id: string, userId?: string): Promise<any | null> {
    let query = this.db
      .from('roadmaps')
      .select('*, project:projects(id, title)')
      .eq('id', id);
    if (userId) query = query.eq('owner_id', userId);
    const { data, error } = await query.single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data ?? null;
  }

  async findFull(id: string, userId?: string): Promise<any | null> {
    let query = this.db
      .from('roadmaps')
      .select(
        `
        *,
        project:projects(id, title),
        milestones:roadmap_milestones(*),
        epics:roadmap_epics(*, features:roadmap_features(*, tasks:roadmap_tasks(*)))
      `,
      )
      .eq('id', id);
    if (userId) query = query.eq('owner_id', userId);
    const { data, error } = await query.single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data ?? null;
  }

  async findByUser(userId: string): Promise<any[]> {
    const { data, error } = await this.db
      .from('roadmaps')
      .select('*, project:projects(id, title)')
      .eq('owner_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async findPreviews(userId: string): Promise<any[]> {
    // Step 1: fetch roadmaps
    const { data: roadmaps, error: roadmapsError } = await this.db
      .from('roadmaps')
      .select(
        'id, name, description, status, project_id, created_at, updated_at, project:projects(id, title)',
      )
      .eq('owner_id', userId)
      .order('updated_at', { ascending: false });
    if (roadmapsError) throw new Error(roadmapsError.message);
    if (!roadmaps || roadmaps.length === 0) return [];

    const roadmapIds = roadmaps.map((r) => r.id);

    // Step 2: fetch epics for those roadmaps
    const { data: epics, error: epicsError } = await this.db
      .from('roadmap_epics')
      .select('id, roadmap_id, title, position, status')
      .in('roadmap_id', roadmapIds)
      .order('position', { ascending: true });
    if (epicsError) throw new Error(epicsError.message);

    // Step 3: fetch features for those roadmaps
    const { data: features, error: featuresError } = await this.db
      .from('roadmap_features')
      .select('id, roadmap_id, epic_id, title, position, status')
      .in('roadmap_id', roadmapIds)
      .order('position', { ascending: true });
    if (featuresError) throw new Error(featuresError.message);

    // Step 4: fetch tasks for those features (if any)
    const featureIds = (features ?? []).map((f) => f.id);
    let tasks: any[] = [];
    if (featureIds.length > 0) {
      const { data: taskData, error: tasksError } = await this.db
        .from('roadmap_tasks')
        .select('id, feature_id, position, status')
        .in('feature_id', featureIds)
        .order('position', { ascending: true });
      if (tasksError) throw new Error(tasksError.message);
      tasks = taskData ?? [];
    }

    // Step 5: assemble nested structure
    const tasksByFeature = tasks.reduce<Record<string, any[]>>((acc, task) => {
      (acc[task.feature_id] ??= []).push(task);
      return acc;
    }, {});

    const featuresByEpic = (features ?? []).reduce<Record<string, any[]>>(
      (acc, feature) => {
        (acc[feature.epic_id] ??= []).push({
          ...feature,
          tasks: tasksByFeature[feature.id] ?? [],
        });
        return acc;
      },
      {},
    );

    const epicsByRoadmap = (epics ?? []).reduce<Record<string, any[]>>(
      (acc, epic) => {
        (acc[epic.roadmap_id] ??= []).push({
          ...epic,
          features: featuresByEpic[epic.id] ?? [],
        });
        return acc;
      },
      {},
    );

    return roadmaps.map((roadmap) => ({
      ...roadmap,
      epics: epicsByRoadmap[roadmap.id] ?? [],
    }));
  }

  async create(dto: CreateRoadmapDto, userId: string): Promise<any> {
    const { data, error } = await this.db
      .from('roadmaps')
      .insert({ ...dto, owner_id: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, dto: UpdateRoadmapDto): Promise<any> {
    const { data, error } = await this.db
      .from('roadmaps')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.db.from('roadmaps').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async migrateGuestRoadmaps(
    sessionId: string,
    userId: string,
  ): Promise<{ migrated: number }> {
    // Find roadmaps owned by profile with this guest session
    const { data: guestProfile } = await this.db
      .from('profiles')
      .select('id')
      .eq('guest_session_id', sessionId)
      .eq('is_guest', true)
      .single();

    if (!guestProfile) return { migrated: 0 };

    const { data, error } = await this.db
      .from('roadmaps')
      .update({ owner_id: userId })
      .eq('owner_id', guestProfile.id)
      .select('id');
    if (error) throw new Error(error.message);
    return { migrated: (data ?? []).length };
  }
}
