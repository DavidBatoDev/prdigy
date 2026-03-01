import { Project } from '../../../common/entities';
import { CreateProjectDto, UpdateProjectDto } from '../dto/project.dto';

export interface ProjectsRepository {
  findByUser(userId: string): Promise<Project[]>;
  findById(
    id: string,
  ): Promise<
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
}
