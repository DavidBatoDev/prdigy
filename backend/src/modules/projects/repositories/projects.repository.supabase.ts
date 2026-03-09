import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../../config/supabase.module';
import { ProjectsRepository } from './projects.repository.interface';
import { Project } from '../../../common/entities';
import {
  AddProjectMemberDto,
  CreateProjectDto,
  InviteProjectByEmailDto,
  ProjectInviteQueryDto,
  RespondProjectInviteDto,
  UpdateProjectDto,
  UpdateProjectMemberDto,
} from '../dto/project.dto';

@Injectable()
export class SupabaseProjectsRepository implements ProjectsRepository {
  constructor(
    @Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient,
  ) {}

  async getCreatorProfileForProjectCreation(userId: string): Promise<{
    active_persona: string;
    is_consultant_verified: boolean;
  } | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('active_persona, is_consultant_verified')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    return {
      active_persona: String(data.active_persona ?? ''),
      is_consultant_verified: data.is_consultant_verified === true,
    };
  }

  private isMissingMemberTypeColumn(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const maybeError = error as { message?: string; details?: string };
    const haystack =
      `${maybeError.message ?? ''} ${maybeError.details ?? ''}`.toLowerCase();
    return haystack.includes('member_type') && haystack.includes('column');
  }

  private toProjectsTablePayload(
    dto: CreateProjectDto | UpdateProjectDto,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    if (dto.title !== undefined) payload.title = dto.title;
    if (dto.status !== undefined) payload.status = dto.status;
    if (dto.category !== undefined) payload.category = dto.category;
    if (dto.project_state !== undefined)
      payload.project_state = dto.project_state;
    if (dto.skills !== undefined) payload.skills = dto.skills;
    if (dto.duration !== undefined) payload.duration = dto.duration;
    if (dto.budget_range !== undefined) payload.budget_range = dto.budget_range;
    if (dto.funding_status !== undefined)
      payload.funding_status = dto.funding_status;
    if (dto.start_date !== undefined) payload.start_date = dto.start_date;
    if (dto.custom_start_date !== undefined)
      payload.custom_start_date = dto.custom_start_date;

    return payload;
  }

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

  async findDashboardByUser(userId: string): Promise<Project[]> {
    const [ownedResult, memberResult] = await Promise.all([
      this.supabase
        .from('projects')
        .select(
          '*, client:profiles!projects_client_id_fkey(id, display_name, avatar_url), consultant:profiles!projects_consultant_id_fkey(id, display_name, avatar_url)',
        )
        .or(`client_id.eq.${userId},consultant_id.eq.${userId}`),
      this.supabase
        .from('project_members')
        .select(
          'project:projects(*, client:profiles!projects_client_id_fkey(id, display_name, avatar_url), consultant:profiles!projects_consultant_id_fkey(id, display_name, avatar_url))',
        )
        .eq('user_id', userId),
    ]);

    if (ownedResult.error) {
      throw new Error(ownedResult.error.message);
    }

    if (memberResult.error) {
      throw new Error(memberResult.error.message);
    }

    const memberProjects = (memberResult.data || [])
      .map((row: Record<string, unknown>) => row.project)
      .filter(Boolean) as Project[];

    const deduped = new Map<string, Project>();
    for (const project of [...(ownedResult.data || []), ...memberProjects]) {
      deduped.set(project.id, project);
    }

    return Array.from(deduped.values()).sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  async findById(id: string): Promise<
    | (Project & {
        client?: unknown;
        consultant?: unknown;
        members?: unknown[];
      })
    | null
  > {
    const withMemberType = await this.supabase
      .from('projects')
      .select(
        `
        *,
        client:profiles!projects_client_id_fkey(id, display_name, avatar_url, headline),
        consultant:profiles!projects_consultant_id_fkey(id, display_name, avatar_url, headline),
        members:project_members(id, project_id, user_id, role, member_type, joined_at, user:profiles(id, display_name, avatar_url, email, first_name, last_name))
      `,
      )
      .eq('id', id)
      .single();

    if (!withMemberType.error && withMemberType.data) {
      return withMemberType.data as Project & {
        client?: unknown;
        consultant?: unknown;
        members?: unknown[];
      };
    }

    if (!this.isMissingMemberTypeColumn(withMemberType.error)) {
      return null;
    }

    const withoutMemberType = await this.supabase
      .from('projects')
      .select(
        `
        *,
        client:profiles!projects_client_id_fkey(id, display_name, avatar_url, headline),
        consultant:profiles!projects_consultant_id_fkey(id, display_name, avatar_url, headline),
        members:project_members(id, project_id, user_id, role, joined_at, user:profiles(id, display_name, avatar_url, email, first_name, last_name))
      `,
      )
      .eq('id', id)
      .single();

    if (withoutMemberType.error || !withoutMemberType.data) return null;

    const normalized = withoutMemberType.data as Project & {
      client?: unknown;
      consultant?: unknown;
      members?: Array<Record<string, unknown>>;
    };

    normalized.members = (normalized.members ?? []).map((member) => {
      const role = String(member.role ?? '').toLowerCase();
      const inferredType =
        role === 'client' ||
        role === 'consultant' ||
        role === 'consultant (lead)'
          ? 'stakeholder'
          : 'freelancer';
      return { ...member, member_type: inferredType };
    });

    return normalized as Project & {
      client?: unknown;
      consultant?: unknown;
      members?: unknown[];
    };
  }

  async create(userId: string, dto: CreateProjectDto): Promise<Project> {
    const projectPayload = this.toProjectsTablePayload(dto);
    const isConsultantMode = dto.creation_mode === 'consultant';

    const { data: project, error } = await this.supabase
      .from('projects')
      .insert({
        ...projectPayload,
        client_id: userId,
        consultant_id: isConsultantMode ? userId : undefined,
      })
      .select()
      .single();

    if (error || !project)
      throw new Error(error?.message ?? 'Failed to create project');

    // Auto-add creator to the team with mode-specific bootstrap permissions.
    await this.supabase.from('project_members').insert({
      project_id: project.id,
      user_id: userId,
      role: isConsultantMode ? 'consultant' : 'client',
      member_type: 'stakeholder',
      permissions_json: isConsultantMode
        ? {
            'project.transfer': true,
            'members.manage': true,
          }
        : {},
    });

    return project as Project;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const projectPayload = this.toProjectsTablePayload(dto);

    const { data, error } = await this.supabase
      .from('projects')
      .update(projectPayload)
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
        member_type: 'stakeholder',
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

  async addMember(
    projectId: string,
    dto: AddProjectMemberDto,
  ): Promise<unknown> {
    let userId: string | null = null;

    if (dto.member_type !== 'open_role') {
      // Resolve user by email
      if (!dto.email) {
        throw new BadRequestException(
          'Email is required when adding a real member.',
        );
      }
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('email', dto.email)
        .single();

      if (!profile) {
        throw new NotFoundException(
          `No registered user found with email ${dto.email}`,
        );
      }
      userId = profile.id as string;
    }

    const { data, error } = await this.supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: userId,
        role: dto.role,
        member_type: dto.member_type,
      })
      .select(
        'id, project_id, user_id, role, member_type, joined_at, user:profiles(id, display_name, avatar_url, email, first_name, last_name)',
      )
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getProfileDisplayName(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('display_name, first_name, last_name, email')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;

    const displayName =
      typeof data.display_name === 'string' ? data.display_name.trim() : '';
    if (displayName) return displayName;

    const firstName =
      typeof data.first_name === 'string' ? data.first_name.trim() : '';
    const lastName =
      typeof data.last_name === 'string' ? data.last_name.trim() : '';
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) return fullName;

    const email = typeof data.email === 'string' ? data.email.trim() : '';
    return email || null;
  }

  async inviteByEmail(
    projectId: string,
    invitedBy: string,
    dto: InviteProjectByEmailDto,
  ): Promise<unknown> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const invitedRole = dto.role.trim();
    const inviteMessage = dto.message?.trim();

    if (!normalizedEmail) {
      throw new BadRequestException('Email is required.');
    }

    const { data: profile } = await this.supabase
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    const { data, error } = await this.supabase
      .from('project_invites')
      .upsert(
        {
          project_id: projectId,
          invited_by: invitedBy,
          invitee_id: (profile?.id as string | undefined) || null,
          invitee_email: normalizedEmail,
          invited_role: invitedRole,
          message:
            inviteMessage && inviteMessage.length > 0 ? inviteMessage : null,
          status: 'pending',
          updated_at: new Date().toISOString(),
          responded_at: null,
        },
        { onConflict: 'project_id,invitee_email' },
      )
      .select(
        'id, project_id, invited_by, invitee_id, invitee_email, invited_role, status, message, created_at, updated_at',
      )
      .single();

    if (error || !data) {
      throw new BadRequestException(error?.message || 'Failed to send invite.');
    }

    return data;
  }

  async listInvitesForUser(
    userId: string,
    query?: ProjectInviteQueryDto,
  ): Promise<unknown[]> {
    let dbQuery = this.supabase
      .from('project_invites')
      .select(
        'id, project_id, invited_by, invitee_id, invitee_email, invited_role, status, message, created_at, updated_at, responded_at',
      )
      .eq('invitee_id', userId)
      .order('created_at', { ascending: false });

    if (query?.project_id) {
      dbQuery = dbQuery.eq('project_id', query.project_id);
    }

    const { data: invites, error } = await dbQuery;

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!invites?.length) {
      return [];
    }

    const projectIds = [...new Set(invites.map((invite) => invite.project_id))];
    const inviterIds = [...new Set(invites.map((invite) => invite.invited_by))];

    const [projectsRes, invitersRes] = await Promise.all([
      this.supabase
        .from('projects')
        .select('id, title, status')
        .in('id', projectIds),
      this.supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', inviterIds),
    ]);

    const projectById = new Map(
      (projectsRes.data || []).map((project) => [
        project.id as string,
        project,
      ]),
    );
    const inviterById = new Map(
      (invitersRes.data || []).map((inviter) => [
        inviter.id as string,
        inviter,
      ]),
    );

    return invites.map((invite) => ({
      ...invite,
      project: (() => {
        const project = projectById.get(invite.project_id as string);
        if (!project) return null;
        return {
          id: project.id as string,
          title: (project.title as string) || 'Untitled Project',
          status: (project.status as string) || 'unknown',
        };
      })(),
      inviter: (() => {
        const inviter = inviterById.get(invite.invited_by as string);
        if (!inviter) return null;
        return {
          id: inviter.id as string,
          display_name: (inviter.display_name as string | null) || null,
          avatar_url: (inviter.avatar_url as string | null) || null,
        };
      })(),
    }));
  }

  async respondInvite(
    userId: string,
    inviteId: string,
    dto: RespondProjectInviteDto,
  ): Promise<unknown> {
    const { data: invite, error: inviteError } = await this.supabase
      .from('project_invites')
      .select('id, project_id, invited_by, invitee_id, invited_role, status')
      .eq('id', inviteId)
      .single();

    if (inviteError || !invite) {
      throw new NotFoundException('Invite not found.');
    }

    if (invite.invitee_id !== userId) {
      throw new BadRequestException(
        'Only the invitee can respond to this invite.',
      );
    }

    if (invite.status !== 'pending') {
      throw new BadRequestException('Invite has already been responded to.');
    }

    const nowIso = new Date().toISOString();

    const { data: updatedInvite, error: updateError } = await this.supabase
      .from('project_invites')
      .update({ status: dto.status, responded_at: nowIso, updated_at: nowIso })
      .eq('id', inviteId)
      .select('id, project_id, invited_by, status')
      .single();

    if (updateError || !updatedInvite) {
      throw new BadRequestException(
        updateError?.message || 'Failed to update invite.',
      );
    }

    if (dto.status === 'accepted') {
      const { error: memberError } = await this.supabase
        .from('project_members')
        .upsert(
          {
            project_id: invite.project_id,
            user_id: userId,
            role: invite.invited_role || 'Freelancer',
            member_type: 'freelancer',
          },
          { onConflict: 'project_id,user_id' },
        );

      if (memberError) {
        throw new BadRequestException(
          memberError.message || 'Failed to add freelancer to project members.',
        );
      }
    }

    return updatedInvite;
  }

  async updateMember(
    projectId: string,
    memberId: string,
    dto: UpdateProjectMemberDto,
  ): Promise<unknown> {
    const patch: Record<string, unknown> = {};
    if (dto.role !== undefined) patch.role = dto.role;
    if (dto.member_type !== undefined) patch.member_type = dto.member_type;

    const { data, error } = await this.supabase
      .from('project_members')
      .update(patch)
      .eq('id', memberId)
      .eq('project_id', projectId)
      .select(
        'id, project_id, user_id, role, member_type, joined_at, user:profiles(id, display_name, avatar_url, email, first_name, last_name)',
      )
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async removeMember(projectId: string, memberId: string): Promise<void> {
    // Prevent removing stakeholder rows
    const { data: existing } = await this.supabase
      .from('project_members')
      .select('id, member_type')
      .eq('id', memberId)
      .eq('project_id', projectId)
      .single();

    if (!existing) throw new NotFoundException('Member not found');
    if ((existing as Record<string, unknown>).member_type === 'stakeholder') {
      throw new BadRequestException('Stakeholder members cannot be removed.');
    }

    const { error } = await this.supabase
      .from('project_members')
      .delete()
      .eq('id', memberId)
      .eq('project_id', projectId);

    if (error) throw new BadRequestException(error.message);
  }
}
