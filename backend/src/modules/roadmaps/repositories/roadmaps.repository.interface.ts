import { CreateRoadmapDto, UpdateRoadmapDto } from '../dto/roadmaps.dto';
import type { WorkspacePersona } from '../../../common/utils/persona-context';

export interface IRoadmapsRepository {
  findAll(userId: string, persona?: WorkspacePersona): Promise<any[]>;
  findByProjectId(
    projectId: string,
    userId?: string,
    persona?: WorkspacePersona,
  ): Promise<any | null>;
  findById(
    id: string,
    userId?: string,
    persona?: WorkspacePersona,
  ): Promise<any | null>;
  findFull(
    id: string,
    userId?: string,
    persona?: WorkspacePersona,
  ): Promise<any | null>;
  findByUser(userId: string): Promise<any[]>;
  findPreviews(userId: string, persona?: WorkspacePersona): Promise<any[]>;
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
