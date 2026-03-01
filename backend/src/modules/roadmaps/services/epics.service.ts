import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IEpicsRepository } from '../repositories/epics.repository.interface';
import {
  CreateEpicDto,
  UpdateEpicDto,
  BulkReorderDto,
} from '../dto/roadmaps.dto';

export const EPICS_REPOSITORY = Symbol('EPICS_REPOSITORY');

@Injectable()
export class EpicsService {
  constructor(
    @Inject(EPICS_REPOSITORY) private readonly repo: IEpicsRepository,
  ) {}

  async findByRoadmap(roadmapId: string) {
    return this.repo.findByRoadmap(roadmapId);
  }

  async findById(id: string) {
    const epic = await this.repo.findById(id);
    if (!epic) throw new NotFoundException('Epic not found');
    return epic;
  }

  async create(dto: CreateEpicDto, userId: string) {
    return this.repo.create(dto, userId);
  }

  async update(id: string, dto: UpdateEpicDto) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Epic not found');
    return this.repo.update(id, dto);
  }

  async bulkReorder(roadmapId: string, dto: BulkReorderDto) {
    return this.repo.bulkReorder(roadmapId, dto);
  }

  async remove(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Epic not found');
    return this.repo.remove(id);
  }
}
