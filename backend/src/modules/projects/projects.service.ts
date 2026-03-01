import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
export const PROJECTS_REPOSITORY = Symbol('PROJECTS_REPOSITORY');
import type { ProjectsRepository } from './repositories/projects.repository.interface';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
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
}
