import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../../config/supabase.module';
import { IEpicsRepository } from './epics.repository.interface';
import {
  CreateEpicDto,
  UpdateEpicDto,
  BulkReorderDto,
} from '../dto/roadmaps.dto';

@Injectable()
export class EpicsRepositorySupabase implements IEpicsRepository {
  constructor(@Inject(SUPABASE_ADMIN) private readonly db: SupabaseClient) {}

  async findByRoadmap(roadmapId: string): Promise<any[]> {
    const { data, error } = await this.db
      .from('roadmap_epics')
      .select('*')
      .eq('roadmap_id', roadmapId)
      .order('position', { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async findById(id: string): Promise<any | null> {
    const { data, error } = await this.db
      .from('roadmap_epics')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data ?? null;
  }

  async create(dto: CreateEpicDto, userId: string): Promise<any> {
    const { data, error } = await this.db
      .from('roadmap_epics')
      .insert({ ...dto })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, dto: UpdateEpicDto): Promise<any> {
    // Strip frontend-only fields that have no DB column
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { labels, ...dbFields } = dto as UpdateEpicDto & { labels?: unknown };
    const { data, error } = await this.db
      .from('roadmap_epics')
      .update({ ...dbFields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async bulkReorder(roadmapId: string, dto: BulkReorderDto): Promise<void> {
    const updates = dto.items.map((item) =>
      this.db
        .from('roadmap_epics')
        .update({
          position: item.position,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id)
        .eq('roadmap_id', roadmapId),
    );
    const results = await Promise.all(updates);
    for (const { error } of results) {
      if (error) throw new Error(error.message);
    }
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.db.from('roadmap_epics').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
