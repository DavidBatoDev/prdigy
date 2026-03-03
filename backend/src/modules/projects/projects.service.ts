import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
export const PROJECTS_REPOSITORY = Symbol('PROJECTS_REPOSITORY');
import type { ProjectsRepository } from './repositories/projects.repository.interface';
import {
  AddProjectMemberDto,
  CreateProjectDto,
  UpdateProjectDto,
  UpdateProjectMemberDto,
} from './dto/project.dto';
import { Project } from '../../common/entities';

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(PROJECTS_REPOSITORY)
    private readonly projectsRepo: ProjectsRepository,
  ) {}

  async listUserProjects(userId: string): Promise<Project[]> {
    return this.projectsRepo.findByUser(userId);
  }

  async listDashboardProjects(userId: string): Promise<Project[]> {
    return this.projectsRepo.findDashboardByUser(userId);
  }

  async getProject(id: string) {
    const project = await this.projectsRepo.findById(id);
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async createProject(userId: string, dto: CreateProjectDto): Promise<Project> {
    return this.projectsRepo.create(userId, dto);
  }

  async updateProject(
    id: string,
    userId: string,
    dto: UpdateProjectDto,
  ): Promise<Project> {
    const isOwner = await this.projectsRepo.isOwner(id, userId);
    if (!isOwner)
      throw new ForbiddenException('Only the project owner can update it');
    return this.projectsRepo.update(id, dto);
  }

  async assignConsultant(
    projectId: string,
    consultantId: string,
  ): Promise<Project> {
    return this.projectsRepo.assignConsultant(projectId, consultantId);
  }

  async addMember(
    projectId: string,
    callerId: string,
    dto: AddProjectMemberDto,
  ): Promise<unknown> {
    const project = await this.projectsRepo.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');
    // Only the consultant (or owner) can manage the team
    const p = project as Project & { consultant?: { id: string } };
    const isConsultant = p.consultant_id === callerId;
    const isClient = p.client_id === callerId;
    if (!isConsultant && !isClient) {
      throw new ForbiddenException(
        'Only the project consultant or client can manage the team.',
      );
    }
    return this.projectsRepo.addMember(projectId, dto);
  }

  async updateMember(
    projectId: string,
    memberId: string,
    callerId: string,
    dto: UpdateProjectMemberDto,
  ): Promise<unknown> {
    const project = await this.projectsRepo.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');
    const isConsultant = project.consultant_id === callerId;
    if (!isConsultant) {
      throw new ForbiddenException(
        'Only the project consultant can update team members.',
      );
    }
    return this.projectsRepo.updateMember(projectId, memberId, dto);
  }

  async removeMember(
    projectId: string,
    memberId: string,
    callerId: string,
  ): Promise<void> {
    const project = await this.projectsRepo.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');
    const isConsultant = project.consultant_id === callerId;
    const isClient = project.client_id === callerId;
    if (!isConsultant && !isClient) {
      throw new ForbiddenException(
        'Only the project consultant or client can remove team members.',
      );
    }
    return this.projectsRepo.removeMember(projectId, memberId);
  }
}
