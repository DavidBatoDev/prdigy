import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IMilestonesRepository } from '../repositories/milestones.repository.interface';
import {
  CreateMilestoneDto,
  UpdateMilestoneDto,
  ReorderDto,
} from '../dto/roadmaps.dto';
import { RoadmapAuthorizationService } from './roadmap-authorization.service';

export const MILESTONES_REPOSITORY = Symbol('MILESTONES_REPOSITORY');

@Injectable()
export class MilestonesService {
  constructor(
    @Inject(MILESTONES_REPOSITORY) private readonly repo: IMilestonesRepository,
    private readonly roadmapAuthz: RoadmapAuthorizationService,
  ) {}

  async findByRoadmap(roadmapId: string) {
    return this.repo.findByRoadmap(roadmapId);
  }

  async findById(id: string) {
    const milestone = await this.repo.findById(id);
    if (!milestone) throw new NotFoundException('Milestone not found');
    return milestone;
  }

  async create(roadmapId: string, dto: CreateMilestoneDto, userId: string) {
    await this.roadmapAuthz.assertRoadmapPermission(
      roadmapId,
      userId,
      'roadmap.edit',
    );
    return this.repo.create(roadmapId, dto, userId);
  }

  async update(id: string, dto: UpdateMilestoneDto, userId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Milestone not found');
    await this.roadmapAuthz.assertMilestonePermission(
      id,
      userId,
      'roadmap.edit',
    );
    return this.repo.update(id, dto);
  }

  async reorder(id: string, dto: ReorderDto, userId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Milestone not found');
    await this.roadmapAuthz.assertMilestonePermission(
      id,
      userId,
      'roadmap.edit',
    );
    return this.repo.reorder(id, dto);
  }

  async remove(id: string, userId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Milestone not found');
    await this.roadmapAuthz.assertMilestonePermission(
      id,
      userId,
      'roadmap.edit',
    );
    return this.repo.remove(id);
  }
}
