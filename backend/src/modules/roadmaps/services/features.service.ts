import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IFeaturesRepository } from '../repositories/features.repository.interface';
import {
  CreateFeatureDto,
  UpdateFeatureDto,
  BulkReorderDto,
  LinkMilestoneDto,
  UnlinkMilestoneDto,
} from '../dto/roadmaps.dto';

export const FEATURES_REPOSITORY = Symbol('FEATURES_REPOSITORY');

@Injectable()
export class FeaturesService {
  constructor(
    @Inject(FEATURES_REPOSITORY) private readonly repo: IFeaturesRepository,
  ) {}

  async findByEpic(epicId: string) {
    return this.repo.findByEpic(epicId);
  }

  async findByRoadmap(roadmapId: string) {
    return this.repo.findByRoadmap(roadmapId);
  }

  async findById(id: string) {
    const feature = await this.repo.findById(id);
    if (!feature) throw new NotFoundException('Feature not found');
    return feature;
  }

  async create(dto: CreateFeatureDto, userId: string) {
    return this.repo.create(dto, userId);
  }

  async update(id: string, dto: UpdateFeatureDto) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Feature not found');
    return this.repo.update(id, dto);
  }

  async bulkReorder(epicId: string, dto: BulkReorderDto) {
    return this.repo.bulkReorder(epicId, dto);
  }

  async linkMilestone(dto: LinkMilestoneDto) {
    return this.repo.linkMilestone(dto);
  }

  async unlinkMilestone(dto: UnlinkMilestoneDto) {
    return this.repo.unlinkMilestone(dto);
  }

  async remove(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Feature not found');
    return this.repo.remove(id);
  }
}
