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
  ProjectMemberRole,
  ProjectInviteQueryDto,
  RespondProjectInviteDto,
  UpdateProjectDto,
  UpdateProjectMemberDto,
  UpdateProjectMemberPermissionsDto,
} from '../dto/project.dto';
import {
  getTemplateByKey,
  resolvePermissionTemplateKey,
} from '../permissions/project-permissions';
import type { ProjectPermissions } from '../permissions/project-permissions';

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

  private getDefaultPermissionsForMember(params: {
    projectId: string;
    clientId: string;
    consultantId?: string | null;
    member: {
      user_id: string | null;
      role: ProjectMemberRole;
    };
  }) {
    const templateKey = resolvePermissionTemplateKey(
      {
        id: params.projectId,
        client_id: params.clientId,
        consultant_id: params.consultantId,
      },
      {
        id: 'n/a',
        user_id: params.member.user_id,
        role: params.member.role,
      },
    );

    return getTemplateByKey(templateKey);
  }

  async findByUser(userId: string): Promise<Project[]> {
    const { data } = await this.supabase
      .from('project_members')
      .select(
        'project:projects(*, client:profiles!projects_client_id_fkey(id, display_name, avatar_url, email))',
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
          '*, client:profiles!projects_client_id_fkey(id, display_name, avatar_url, email), consultant:profiles!projects_consultant_id_fkey(id, display_name, avatar_url, email)',
        )
        .or(`client_id.eq.${userId},consultant_id.eq.${userId}`),
      this.supabase
        .from('project_members')
        .select(
          'project:projects(*, client:profiles!projects_client_id_fkey(id, display_name, avatar_url, email), consultant:profiles!projects_consultant_id_fkey(id, display_name, avatar_url, email))',
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
    const { data, error } = await this.supabase
      .from('projects')
      .select(
        `
        *,
        client:profiles!projects_client_id_fkey(id, display_name, avatar_url, headline, email),
        consultant:profiles!projects_consultant_id_fkey(id, display_name, avatar_url, headline, email),
        members:project_members(id, project_id, user_id, role, position, joined_at, user:profiles(id, display_name, avatar_url, email, first_name, last_name))
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
      role: isConsultantMode
        ? ProjectMemberRole.CONSULTANT
        : ProjectMemberRole.CLIENT,
      position: isConsultantMode ? 'Main Consultant' : 'Client',
      permissions_json: isConsultantMode
        ? getTemplateByKey('consultant_incubation')
        : getTemplateByKey('client'),
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
        role: ProjectMemberRole.CONSULTANT,
        position: 'Main Consultant',
        permissions_json: getTemplateByKey('consultant'),
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
    const { data: projectRow } = await this.supabase
      .from('projects')
      .select('id, client_id, consultant_id')
      .eq('id', projectId)
      .single();

    if (!projectRow) {
      throw new NotFoundException('Project not found');
    }

    let userId: string | null = null;

    if (dto.email) {
      // Resolve user by email
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
        role: ProjectMemberRole.MEMBER,
        position: dto.position,
        permissions_json: this.getDefaultPermissionsForMember({
          projectId,
          clientId: projectRow.client_id as string,
          consultantId: (projectRow.consultant_id as string | null) || null,
          member: {
            user_id: userId,
            role: ProjectMemberRole.MEMBER,
          },
        }),
      })
      .select(
        'id, project_id, user_id, role, position, joined_at, user:profiles(id, display_name, avatar_url, email, first_name, last_name)',
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
    const invitedPosition = dto.position.trim();
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
          invited_position: invitedPosition,
          message:
            inviteMessage && inviteMessage.length > 0 ? inviteMessage : null,
          status: 'pending',
          updated_at: new Date().toISOString(),
          responded_at: null,
        },
        { onConflict: 'project_id,invitee_email' },
      )
      .select(
        'id, project_id, invited_by, invitee_id, invitee_email, invited_position, status, message, created_at, updated_at',
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
        'id, project_id, invited_by, invitee_id, invitee_email, invited_position, status, message, created_at, updated_at, responded_at',
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
      .select('id, project_id, invited_by, invitee_id, invited_position, status')
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
      const { data: projectRow } = await this.supabase
        .from('projects')
        .select('id, client_id, consultant_id')
        .eq('id', invite.project_id)
        .single();

      if (!projectRow) {
        throw new NotFoundException('Project not found.');
      }

      const { error: memberError } = await this.supabase
        .from('project_members')
        .upsert(
          {
            project_id: invite.project_id,
            user_id: userId,
            role: ProjectMemberRole.MEMBER,
            position: invite.invited_position || 'Member',
            permissions_json: this.getDefaultPermissionsForMember({
              projectId: invite.project_id as string,
              clientId: projectRow.client_id as string,
              consultantId: (projectRow.consultant_id as string | null) || null,
              member: {
                user_id: userId,
                role: ProjectMemberRole.MEMBER,
              },
            }),
          },
          { onConflict: 'project_id,user_id' },
        );

      if (memberError) {
        throw new BadRequestException(
          memberError.message || 'Failed to add member to project members.',
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
    if (dto.position !== undefined) patch.position = dto.position;

    const { data, error } = await this.supabase
      .from('project_members')
      .update(patch)
      .eq('id', memberId)
      .eq('project_id', projectId)
      .select(
        'id, project_id, user_id, role, position, joined_at, user:profiles(id, display_name, avatar_url, email, first_name, last_name)',
      )
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async removeMember(projectId: string, memberId: string): Promise<void> {
    // Prevent removing project leads.
    const { data: existing } = await this.supabase
      .from('project_members')
      .select('id, role')
      .eq('id', memberId)
      .eq('project_id', projectId)
      .single();

    if (!existing) throw new NotFoundException('Member not found');
    const role = String((existing as Record<string, unknown>).role ?? '')
      .trim()
      .toLowerCase();
    if (role === ProjectMemberRole.CLIENT || role === ProjectMemberRole.CONSULTANT) {
      throw new BadRequestException('Project leads cannot be removed.');
    }

    const { error } = await this.supabase
      .from('project_members')
      .delete()
      .eq('id', memberId)
      .eq('project_id', projectId);

    if (error) throw new BadRequestException(error.message);
  }

  async getMemberById(
    projectId: string,
    memberId: string,
  ): Promise<{
    id: string;
    user_id: string | null;
    role: string;
    position?: string | null;
    permissions_json?: Record<string, unknown> | null;
  } | null> {
    const { data, error } = await this.supabase
      .from('project_members')
      .select('id, user_id, role, position, permissions_json')
      .eq('project_id', projectId)
      .eq('id', memberId)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as {
      id: string;
      user_id: string | null;
      role: string;
      position?: string | null;
      permissions_json?: Record<string, unknown> | null;
    };
  }

  async getMemberByProjectAndUserId(
    projectId: string,
    userId: string,
  ): Promise<{
    id: string;
    user_id: string | null;
    role: string;
    position?: string | null;
    permissions_json?: Record<string, unknown> | null;
  } | null> {
    const { data, error } = await this.supabase
      .from('project_members')
      .select('id, user_id, role, position, permissions_json')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as {
      id: string;
      user_id: string | null;
      role: string;
      position?: string | null;
      permissions_json?: Record<string, unknown> | null;
    };
  }

  async getMemberPermissions(
    projectId: string,
    memberId: string,
  ): Promise<ProjectPermissions | null> {
    const { data, error } = await this.supabase
      .from('project_members')
      .select('permissions_json')
      .eq('project_id', projectId)
      .eq('id', memberId)
      .maybeSingle();

    if (error || !data) return null;
    return (data.permissions_json || null) as ProjectPermissions | null;
  }

  async updateMemberPermissions(
    projectId: string,
    memberId: string,
    dto: UpdateProjectMemberPermissionsDto,
  ): Promise<unknown> {
    const patch: Record<string, unknown> = {};
    if (dto.roadmap !== undefined) patch.roadmap = dto.roadmap;
    if (dto.members !== undefined) patch.members = dto.members;
    if (dto.project !== undefined) patch.project = dto.project;
    if (dto.time !== undefined) patch.time = dto.time;

    const existing = await this.getMemberPermissions(projectId, memberId);
    const merged: Record<string, unknown> = {
      ...(existing || {}),
      ...patch,
    };

    const { data, error } = await this.supabase
      .from('project_members')
      .update({ permissions_json: merged })
      .eq('id', memberId)
      .eq('project_id', projectId)
      .select('id, project_id, user_id, role, position, permissions_json, joined_at')
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
