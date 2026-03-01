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
      .select('*, project:projects(id, name)')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async findById(id: string, userId?: string): Promise<any | null> {
    let query = this.db
      .from('roadmaps')
      .select('*, project:projects(id, name)')
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
        project:projects(id, name),
        milestones(*),
        epics(*, features(*, tasks(*)))
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
      .select('*, project:projects(id, name)')
      .eq('owner_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async findPreviews(userId: string): Promise<any[]> {
    const { data, error } = await this.db
      .from('roadmaps')
      .select('id, name, status, updated_at, project:projects(id, name)')
      .eq('owner_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
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
