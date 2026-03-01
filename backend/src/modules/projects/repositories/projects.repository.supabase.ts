import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../../config/supabase.module';
import { ProjectsRepository } from './projects.repository.interface';
import { Project } from '../../../common/entities';
import { CreateProjectDto, UpdateProjectDto } from '../dto/project.dto';

@Injectable()
export class SupabaseProjectsRepository implements ProjectsRepository {
  constructor(
    @Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient,
  ) {}

  async findByUser(userId: string): Promise<Project[]> {
    const { data } = await this.supabase
      .from('project_members')
      .select(
        'project:projects(*, client:profiles!projects_client_id_fkey(id, display_name, avatar_url))',
      )
      .eq('user_id', userId);

    return (data || [])
      .map((r: Record<string, unknown>) => r.project)
      .filter(Boolean) as Project[];
  }

  async findById(
    id: string,
  ): Promise<
    | (Project & {
        client?: unknown;
        consultant?: unknown;
        members?: unknown[];
      })
    | null
  > {
    const { data, error } = await this.supabase
      .from('projects')
      .select(
        `
        *,
        client:profiles!projects_client_id_fkey(id, display_name, avatar_url, headline),
        consultant:profiles!projects_consultant_id_fkey(id, display_name, avatar_url, headline),
        members:project_members(*, user:profiles(id, display_name, avatar_url))
      `,
      )
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as Project & {
      client?: unknown;
      consultant?: unknown;
      members?: unknown[];
    };
  }

  async create(userId: string, dto: CreateProjectDto): Promise<Project> {
    const { data: project, error } = await this.supabase
      .from('projects')
      .insert({ ...dto, client_id: userId })
      .select()
      .single();

    if (error || !project)
      throw new Error(error?.message ?? 'Failed to create project');

    // Auto-add creator as client member
    await this.supabase.from('project_members').insert({
      project_id: project.id,
      user_id: userId,
      role: 'client',
    });

    return project as Project;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const { data, error } = await this.supabase
      .from('projects')
      .update(dto)
      .eq('id', id)
      .select()
      .single();
    if (error || !data)
      throw new Error(error?.message ?? 'Failed to update project');
    return data as Project;
  }

  async assignConsultant(
    projectId: string,
    consultantId: string,
  ): Promise<Project> {
    const { data, error } = await this.supabase
      .from('projects')
      .update({ consultant_id: consultantId, status: 'active' })
      .eq('id', projectId)
      .select()
      .single();

    if (error || !data) throw new NotFoundException('Project not found');

    // Upsert consultant as project member
    await this.supabase.from('project_members').upsert(
      {
        project_id: projectId,
        user_id: consultantId,
        role: 'consultant',
      },
      { onConflict: 'project_id,user_id' },
    );

    return data as Project;
  }

  async isOwner(projectId: string, userId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .or(`client_id.eq.${userId},consultant_id.eq.${userId}`)
      .single();
    return !!data;
  }
}
