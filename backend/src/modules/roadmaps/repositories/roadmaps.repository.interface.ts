import { CreateRoadmapDto, UpdateRoadmapDto } from '../dto/roadmaps.dto';

export interface IRoadmapsRepository {
  findAll(userId: string): Promise<any[]>;
  findByProjectId(projectId: string, userId?: string): Promise<any | null>;
  findById(id: string, userId?: string): Promise<any | null>;
  findFull(id: string, userId?: string): Promise<any | null>;
  findByUser(userId: string): Promise<any[]>;
  findPreviews(userId: string): Promise<any[]>;
  findConsultantProjectless(userId: string): Promise<any[]>;
  findPublicTemplatePreviews(): Promise<any[]>;
  findPublicTemplateById(id: string): Promise<any | null>;
  create(dto: CreateRoadmapDto, userId: string): Promise<any>;
  update(id: string, dto: UpdateRoadmapDto): Promise<any>;
  cloneFromTemplate(templateId: string, userId: string): Promise<any>;
  remove(id: string): Promise<void>;
  migrateGuestRoadmaps(
    sessionId: string,
    userId: string,
  ): Promise<{ migrated: number }>;
}
