import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../../config/supabase.module';
import { IFeaturesRepository } from './features.repository.interface';
import {
  CreateFeatureDto,
  UpdateFeatureDto,
  BulkReorderDto,
  LinkMilestoneDto,
  UnlinkMilestoneDto,
} from '../dto/roadmaps.dto';

@Injectable()
export class FeaturesRepositorySupabase implements IFeaturesRepository {
  constructor(@Inject(SUPABASE_ADMIN) private readonly db: SupabaseClient) {}

  async findByEpic(epicId: string): Promise<any[]> {
    const { data, error } = await this.db
      .from('features')
      .select(
        '*, milestone_features(milestone_id, milestone:milestones(id, title, status, target_date))',
      )
      .eq('epic_id', epicId)
      .order('position', { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async findByRoadmap(roadmapId: string): Promise<any[]> {
    const { data, error } = await this.db
      .from('features')
      .select('*, epic:epics(id, title)')
      .eq('roadmap_id', roadmapId)
      .order('position', { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async findById(id: string): Promise<any | null> {
    const { data, error } = await this.db
      .from('features')
      .select(
        '*, milestone_features(milestone_id, milestone:milestones(id, title))',
      )
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data ?? null;
  }

  async create(dto: CreateFeatureDto, userId: string): Promise<any> {
    const { data, error } = await this.db
      .from('features')
      .insert({ ...dto, created_by: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, dto: UpdateFeatureDto): Promise<any> {
    const { data, error } = await this.db
      .from('features')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async bulkReorder(epicId: string, dto: BulkReorderDto): Promise<void> {
    const updates = dto.items.map((item) =>
      this.db
        .from('features')
        .update({
          position: item.position,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id)
        .eq('epic_id', epicId),
    );
    const results = await Promise.all(updates);
    for (const { error } of results) {
      if (error) throw new Error(error.message);
    }
  }

  async linkMilestone(dto: LinkMilestoneDto): Promise<any> {
    const { data, error } = await this.db
      .from('milestone_features')
      .insert({ feature_id: dto.feature_id, milestone_id: dto.milestone_id })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async unlinkMilestone(dto: UnlinkMilestoneDto): Promise<void> {
    const { error } = await this.db
      .from('milestone_features')
      .delete()
      .eq('feature_id', dto.feature_id)
      .eq('milestone_id', dto.milestone_id);
    if (error) throw new Error(error.message);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.db.from('features').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
