import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../../config/supabase.module';
import { IEpicsRepository } from './epics.repository.interface';
import {
  CreateEpicDto,
  UpdateEpicDto,
  BulkReorderDto,
  AddCommentDto,
  UpdateCommentDto,
} from '../dto/roadmaps.dto';
import { sanitizeCommentHtml } from '../utils/comment-sanitizer';

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

  async findComments(epicId: string): Promise<any[]> {
    const { data, error } = await this.db
      .from('epic_comments')
      .select(
        '*, user:profiles(id, display_name, first_name, last_name, avatar_url, email)',
      )
      .eq('epic_id', epicId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async addComment(
    epicId: string,
    dto: AddCommentDto,
    userId: string,
  ): Promise<any> {
    const content = sanitizeCommentHtml(dto.content);
    const { data, error } = await this.db
      .from('epic_comments')
      .insert({ epic_id: epicId, content, user_id: userId })
      .select(
        '*, user:profiles(id, display_name, first_name, last_name, avatar_url, email)',
      )
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async updateComment(
    commentId: string,
    dto: UpdateCommentDto,
    userId: string,
  ): Promise<any> {
    const content = sanitizeCommentHtml(dto.content);
    const { data: existing, error: existingError } = await this.db
      .from('epic_comments')
      .select('user_id')
      .eq('id', commentId)
      .single();
    if (existingError) throw new Error(existingError.message);
    if (existing && existing.user_id !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const { data, error } = await this.db
      .from('epic_comments')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .select(
        '*, user:profiles(id, display_name, first_name, last_name, avatar_url, email)',
      )
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const { data: existing, error: existingError } = await this.db
      .from('epic_comments')
      .select('user_id')
      .eq('id', commentId)
      .single();
    if (existingError) throw new Error(existingError.message);
    if (existing && existing.user_id !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    const { error } = await this.db
      .from('epic_comments')
      .delete()
      .eq('id', commentId);
    if (error) throw new Error(error.message);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.db.from('roadmap_epics').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
