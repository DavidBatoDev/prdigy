import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../../config/supabase.module';
import { ITasksRepository } from './tasks.repository.interface';
import {
  CreateTaskDto,
  UpdateTaskDto,
  BulkReorderDto,
} from '../dto/roadmaps.dto';

@Injectable()
export class TasksRepositorySupabase implements ITasksRepository {
  constructor(@Inject(SUPABASE_ADMIN) private readonly db: SupabaseClient) {}

  async findByFeature(featureId: string): Promise<any[]> {
    const { data, error } = await this.db
      .from('roadmap_tasks')
      .select('*')
      .eq('feature_id', featureId)
      .order('position', { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async findById(id: string): Promise<any | null> {
    const { data, error } = await this.db
      .from('roadmap_tasks')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data ?? null;
  }

  async create(dto: CreateTaskDto, userId: string): Promise<any> {
    // Only persist columns that exist in roadmap_tasks
    const dbPayload = {
      feature_id: dto.feature_id,
      title: dto.title,
      priority: dto.priority,
      status: dto.status,
      due_date: dto.due_date,
      position: dto.position,
    };
    const { data, error } = await this.db
      .from('roadmap_tasks')
      .insert(dbPayload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, dto: UpdateTaskDto): Promise<any> {
    // Only persist columns that exist in roadmap_tasks
    const dbPayload = {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.priority !== undefined && { priority: dto.priority }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.position !== undefined && { position: dto.position }),
      ...(dto.due_date !== undefined && { due_date: dto.due_date }),
      ...(dto.completed_at !== undefined && { completed_at: dto.completed_at }),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await this.db
      .from('roadmap_tasks')
      .update(dbPayload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async bulkReorder(featureId: string, dto: BulkReorderDto): Promise<void> {
    const updates = dto.items.map((item) =>
      this.db
        .from('roadmap_tasks')
        .update({
          position: item.position,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id)
        .eq('feature_id', featureId),
    );
    const results = await Promise.all(updates);
    for (const { error } of results) {
      if (error) throw new Error(error.message);
    }
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.db.from('roadmap_tasks').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
