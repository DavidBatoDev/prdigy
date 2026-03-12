import { Project } from '../../../common/entities';
import {
  AddProjectMemberDto,
  CreateProjectDto,
  InviteProjectByEmailDto,
  ProjectInviteQueryDto,
  RespondProjectInviteDto,
  UpdateProjectDto,
  UpdateProjectMemberDto,
  UpdateProjectMemberPermissionsDto,
} from '../dto/project.dto';
import type { ProjectPermissions } from '../permissions/project-permissions';

export interface ProjectsRepository {
  getCreatorProfileForProjectCreation(userId: string): Promise<{
    active_persona: string;
    is_consultant_verified: boolean;
  } | null>;
  findByUser(userId: string): Promise<Project[]>;
  findDashboardByUser(userId: string): Promise<Project[]>;
  findById(id: string): Promise<
    | (Project & {
        client?: unknown;
        consultant?: unknown;
        members?: unknown[];
      })
    | null
  >;
  create(userId: string, dto: CreateProjectDto): Promise<Project>;
  update(id: string, dto: UpdateProjectDto): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  transferOwner(
    projectId: string,
    previousOwnerId: string,
    newOwnerId: string,
  ): Promise<Project>;
  assignConsultant(projectId: string, consultantId: string): Promise<Project>;
  isOwner(projectId: string, userId: string): Promise<boolean>;
  addMember(projectId: string, dto: AddProjectMemberDto): Promise<unknown>;
  getProfileDisplayName(userId: string): Promise<string | null>;
  inviteByEmail(
    projectId: string,
    invitedBy: string,
    dto: InviteProjectByEmailDto,
  ): Promise<unknown>;
  listInvitesForUser(
    userId: string,
    query?: ProjectInviteQueryDto,
  ): Promise<unknown[]>;
  respondInvite(
    userId: string,
    inviteId: string,
    dto: RespondProjectInviteDto,
  ): Promise<unknown>;
  updateMember(
    projectId: string,
    memberId: string,
    dto: UpdateProjectMemberDto,
  ): Promise<unknown>;
  removeMember(projectId: string, memberId: string): Promise<void>;
  getMemberById(
    projectId: string,
    memberId: string,
  ): Promise<{
    id: string;
    user_id: string | null;
    role: string;
    position?: string | null;
    permissions_json?: Record<string, unknown> | null;
  } | null>;
  getMemberByProjectAndUserId(
    projectId: string,
    userId: string,
  ): Promise<{
    id: string;
    user_id: string | null;
    role: string;
    position?: string | null;
    permissions_json?: Record<string, unknown> | null;
  } | null>;
  getMemberPermissions(
    projectId: string,
    memberId: string,
  ): Promise<ProjectPermissions | null>;
  updateMemberPermissions(
    projectId: string,
    memberId: string,
    dto: UpdateProjectMemberPermissionsDto,
  ): Promise<unknown>;
}
