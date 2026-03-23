import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../../config/supabase.module';
import type { IRoadmapsRepository } from '../repositories/roadmaps.repository.interface';
import {
  CreateRoadmapDto,
  UpdateRoadmapDto,
  UpdateRoadmapTemplateSettingsDto,
} from '../dto/roadmaps.dto';
import { RoadmapAuthorizationService } from './roadmap-authorization.service';
import {
  normalizeWorkspacePersona,
  type WorkspacePersona,
} from '../../../common/utils/persona-context';

export const ROADMAPS_REPOSITORY = Symbol('ROADMAPS_REPOSITORY');

@Injectable()
export class RoadmapsService {
  private readonly logger = new Logger(RoadmapsService.name);

  constructor(
    @Inject(ROADMAPS_REPOSITORY) private readonly repo: IRoadmapsRepository,
    @Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient,
    private readonly roadmapAuthz: RoadmapAuthorizationService,
  ) {}

  private async ensureConsultant(userId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id, is_consultant_verified')
      .eq('id', userId)
      .single();

    if (error || !data || !data.is_consultant_verified) {
      throw new ForbiddenException('Consultant access required');
    }
  }

  private async resolveActivePersona(
    userId: string,
    requestedPersona?: string | null,
  ): Promise<WorkspacePersona> {
    const fromRequest = normalizeWorkspacePersona(requestedPersona);
    if (fromRequest) return fromRequest;

    const { data, error } = await this.supabase
      .from('profiles')
      .select('active_persona')
      .eq('id', userId)
      .single();

    if (!error) {
      const fromProfile = normalizeWorkspacePersona(
        String(data?.active_persona ?? ''),
      );
      if (fromProfile) {
        this.logger.warn(
          `Missing X-Active-Persona; fallback to profile active_persona for user ${userId}.`,
        );
        return fromProfile;
      }
    }

    throw new ForbiddenException('Unable to resolve active persona.');
  }

  async findAll(userId: string, requestedPersona?: string | null) {
    const persona = await this.resolveActivePersona(userId, requestedPersona);
    return this.repo.findAll(userId, persona);
  }

  async findPreviews(userId: string, requestedPersona?: string | null) {
    const persona = await this.resolveActivePersona(userId, requestedPersona);
    return this.repo.findPreviews(userId, persona);
  }

  async findByUser(userId: string) {
    return this.repo.findByUser(userId);
  }

  async findByProjectId(
    projectId: string,
    userId: string,
    requestedPersona?: string | null,
  ) {
    const persona = await this.resolveActivePersona(userId, requestedPersona);
    const roadmap = await this.repo.findByProjectId(projectId, userId, persona);
    if (!roadmap) throw new NotFoundException('Roadmap not found');
    return roadmap;
  }

  async findById(id: string, userId: string, requestedPersona?: string | null) {
    const persona = await this.resolveActivePersona(userId, requestedPersona);
    const roadmap = await this.repo.findById(id, userId, persona);
    if (!roadmap) throw new NotFoundException('Roadmap not found');
    return roadmap;
  }

  async findFull(id: string, userId: string, requestedPersona?: string | null) {
    const persona = await this.resolveActivePersona(userId, requestedPersona);
    const roadmap = await this.repo.findFull(id, userId, persona);
    if (!roadmap) throw new NotFoundException('Roadmap not found');
    return roadmap;
  }

  async create(dto: CreateRoadmapDto, userId: string) {
    if (dto.project_id) {
      await this.roadmapAuthz.assertProjectRoadmapPermission(
        dto.project_id,
        userId,
        'roadmap.edit',
      );
    }
    return this.repo.create(dto, userId);
  }

  async findConsultantTemplateRoadmaps(userId: string) {
    await this.ensureConsultant(userId);
    return this.repo.findConsultantProjectless(userId);
  }

  async findPublicTemplates() {
    return this.repo.findPublicTemplatePreviews();
  }

  async updateTemplateSettings(
    id: string,
    dto: UpdateRoadmapTemplateSettingsDto,
    userId: string,
  ) {
    await this.ensureConsultant(userId);

    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Roadmap not found');

    if (existing.project_id) {
      await this.roadmapAuthz.assertRoadmapPermission(
        existing.id,
        userId,
        'roadmap.edit',
      );
      return this.repo.update(id, dto);
    }

    if (existing.owner_id !== userId) {
      throw new ForbiddenException('Not the owner');
    }

    return this.repo.update(id, dto);
  }

  async cloneFromTemplate(templateId: string, userId: string) {
    return this.repo.cloneFromTemplate(templateId, userId);
  }

  async update(id: string, dto: UpdateRoadmapDto, userId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Roadmap not found');

    if (existing.project_id) {
      await this.roadmapAuthz.assertRoadmapPermission(
        id,
        userId,
        'roadmap.edit',
      );
      return this.repo.update(id, dto);
    }

    if (existing.owner_id !== userId)
      throw new ForbiddenException('Not the owner');
    return this.repo.update(id, dto);
  }

  async remove(id: string, userId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Roadmap not found');

    if (existing.project_id) {
      await this.roadmapAuthz.assertRoadmapPermission(
        id,
        userId,
        'roadmap.edit',
      );
      return this.repo.remove(id);
    }

    if (existing.owner_id !== userId)
      throw new ForbiddenException('Not the owner');
    return this.repo.remove(id);
  }

  async migrateGuestRoadmaps(sessionId: string, userId: string) {
    return this.repo.migrateGuestRoadmaps(sessionId, userId);
  }
}
