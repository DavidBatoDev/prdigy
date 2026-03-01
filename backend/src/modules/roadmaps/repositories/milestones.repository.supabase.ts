import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../../config/supabase.module';
import { IMilestonesRepository } from './milestones.repository.interface';
import {
  CreateMilestoneDto,
  UpdateMilestoneDto,
  ReorderDto,
} from '../dto/roadmaps.dto';

@Injectable()
export class MilestonesRepositorySupabase implements IMilestonesRepository {
  constructor(@Inject(SUPABASE_ADMIN) private readonly db: SupabaseClient) {}

  async findByRoadmap(roadmapId: string): Promise<any[]> {
    const { data, error } = await this.db
      .from('milestones')
      .select('*')
      .eq('roadmap_id', roadmapId)
      .order('position', { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async findById(id: string): Promise<any | null> {
    const { data, error } = await this.db
      .from('milestones')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data ?? null;
  }

  async create(
    roadmapId: string,
    dto: CreateMilestoneDto,
    userId: string,
  ): Promise<any> {
    const { data, error } = await this.db
      .from('milestones')
      .insert({ ...dto, roadmap_id: roadmapId, created_by: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, dto: UpdateMilestoneDto): Promise<any> {
    const { data, error } = await this.db
      .from('milestones')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async reorder(id: string, dto: ReorderDto): Promise<any> {
    const { data, error } = await this.db
      .from('milestones')
      .update({ position: dto.position, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.db.from('milestones').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
