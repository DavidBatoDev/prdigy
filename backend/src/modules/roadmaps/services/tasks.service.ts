import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ITasksRepository } from '../repositories/tasks.repository.interface';
import {
  CreateTaskDto,
  UpdateTaskDto,
  BulkReorderDto,
} from '../dto/roadmaps.dto';

export const TASKS_REPOSITORY = Symbol('TASKS_REPOSITORY');

@Injectable()
export class TasksService {
  constructor(
    @Inject(TASKS_REPOSITORY) private readonly repo: ITasksRepository,
  ) {}

  async findByFeature(featureId: string) {
    return this.repo.findByFeature(featureId);
  }

  async findById(id: string) {
    const task = await this.repo.findById(id);
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async create(dto: CreateTaskDto, userId: string) {
    return this.repo.create(dto, userId);
  }

  async update(id: string, dto: UpdateTaskDto) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Task not found');
    return this.repo.update(id, dto);
  }

  async bulkReorder(featureId: string, dto: BulkReorderDto) {
    return this.repo.bulkReorder(featureId, dto);
  }

  async remove(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Task not found');
    return this.repo.remove(id);
  }
}
