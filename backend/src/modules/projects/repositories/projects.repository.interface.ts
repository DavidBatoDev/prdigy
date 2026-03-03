import { Project } from '../../../common/entities';
import {
  AddProjectMemberDto,
  CreateProjectDto,
  UpdateProjectDto,
  UpdateProjectMemberDto,
} from '../dto/project.dto';

export interface ProjectsRepository {
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
  assignConsultant(projectId: string, consultantId: string): Promise<Project>;
  isOwner(projectId: string, userId: string): Promise<boolean>;
  addMember(projectId: string, dto: AddProjectMemberDto): Promise<unknown>;
  updateMember(
    projectId: string,
    memberId: string,
    dto: UpdateProjectMemberDto,
  ): Promise<unknown>;
  removeMember(projectId: string, memberId: string): Promise<void>;
}
