import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  CreateFullRoadmapDto,
  FullRoadmapEpicDto,
  FullRoadmapFeatureDto,
  FullRoadmapState,
  FullRoadmapTaskDto,
  JsonPatchOperationDto,
} from '../dto/patch-roadmap.dto';
import { ROADMAPS_REPOSITORY } from './roadmaps.service';
import type { IRoadmapsRepository } from '../repositories/roadmaps.repository.interface';
import type { IRoadmapPatchRepository } from '../repositories/roadmap-patch.repository.interface';
import { RoadmapJsonPatchProcessor } from '../patch/roadmap-json-patch.processor';
import { RoadmapAuthorizationService } from './roadmap-authorization.service';

export const ROADMAP_PATCH_REPOSITORY = Symbol('ROADMAP_PATCH_REPOSITORY');

@Injectable()
export class RoadmapPatchService {
  constructor(
    @Inject(ROADMAPS_REPOSITORY)
    private readonly roadmapsRepo: IRoadmapsRepository,
    @Inject(ROADMAP_PATCH_REPOSITORY)
    private readonly patchRepo: IRoadmapPatchRepository,
    private readonly patchProcessor: RoadmapJsonPatchProcessor,
    private readonly roadmapAuthz: RoadmapAuthorizationService,
  ) {}

  async createFull(dto: CreateFullRoadmapDto, userId: string) {
    const roadmapId = dto.id ?? randomUUID();

    if (dto.id) {
      const existing = await this.roadmapsRepo.findById(dto.id);
      if (existing?.project_id) {
        await this.roadmapAuthz.assertRoadmapPermission(
          existing.id,
          userId,
          'roadmap.edit',
        );
      } else if (existing && existing.owner_id !== userId) {
        throw new ForbiddenException('Not the owner');
      }
    }

    if (dto.project_id) {
      await this.roadmapAuthz.assertProjectRoadmapPermission(
        dto.project_id,
        userId,
        'roadmap.edit',
      );
    }

    const normalizedState = this.normalizeFullRoadmapState({
      ...dto,
      id: roadmapId,
    });

    await this.patchRepo.upsertFullRoadmap({
      roadmapId,
      ownerId: userId,
      fullState: normalizedState,
      createIfMissing: true,
    });

    return this.roadmapsRepo.findFull(roadmapId, userId);
  }

  async applyPatch(
    roadmapId: string,
    operations: JsonPatchOperationDto[],
    userId: string,
  ) {
    if (!Array.isArray(operations) || operations.length === 0) {
      throw new BadRequestException(
        'Patch operations must be a non-empty array',
      );
    }

    const existing = await this.roadmapsRepo.findById(roadmapId);
    if (!existing) throw new NotFoundException('Roadmap not found');

    if (existing.project_id) {
      await this.roadmapAuthz.assertRoadmapPermission(
        roadmapId,
        userId,
        'roadmap.edit',
      );
    } else if (existing.owner_id !== userId)
      throw new ForbiddenException('Not the owner');

    const currentState = await this.roadmapsRepo.findFull(roadmapId, userId);
    if (!currentState) throw new NotFoundException('Roadmap not found');

    const patchedState = this.patchProcessor.apply(
      this.normalizeFullRoadmapState(currentState),
      operations,
    );

    const normalizedPatchedState = this.normalizeFullRoadmapState({
      ...patchedState,
      id: roadmapId,
    });

    await this.patchRepo.upsertFullRoadmap({
      roadmapId,
      ownerId: userId,
      fullState: normalizedPatchedState,
      createIfMissing: false,
    });

    return this.roadmapsRepo.findFull(roadmapId, userId);
  }

  private normalizeFullRoadmapState(state: FullRoadmapState): FullRoadmapState {
    const roadmapEpics = (state.roadmap_epics ?? []).map((epic, epicIndex) =>
      this.normalizeEpic(epic, epicIndex),
    );

    return {
      id: state.id,
      name: state.name,
      description: state.description,
      project_id: state.project_id,
      status: state.status ?? 'draft',
      start_date: state.start_date,
      end_date: state.end_date,
      settings: state.settings ?? {},
      roadmap_epics: roadmapEpics,
    };
  }

  private normalizeEpic(
    epic: FullRoadmapEpicDto,
    epicIndex: number,
  ): FullRoadmapEpicDto {
    return {
      id: epic.id ?? randomUUID(),
      title: epic.title,
      description: epic.description,
      status: epic.status ?? 'backlog',
      priority: epic.priority ?? 'medium',
      position: epic.position ?? epicIndex,
      color: epic.color,
      start_date: epic.start_date,
      end_date: epic.end_date,
      tags: epic.tags ?? [],
      roadmap_features: (epic.roadmap_features ?? []).map(
        (feature, featureIndex) => this.normalizeFeature(feature, featureIndex),
      ),
    };
  }

  private normalizeFeature(
    feature: FullRoadmapFeatureDto,
    featureIndex: number,
  ): FullRoadmapFeatureDto {
    return {
      id: feature.id ?? randomUUID(),
      title: feature.title,
      description: feature.description,
      status: feature.status ?? 'not_started',
      position: feature.position ?? featureIndex,
      is_deliverable: feature.is_deliverable ?? true,
      start_date: feature.start_date,
      end_date: feature.end_date,
      roadmap_tasks: (feature.roadmap_tasks ?? []).map((task, taskIndex) =>
        this.normalizeTask(task, taskIndex),
      ),
    };
  }

  private normalizeTask(
    task: FullRoadmapTaskDto,
    taskIndex: number,
  ): FullRoadmapTaskDto {
    return {
      id: task.id ?? randomUUID(),
      title: task.title,
      description: task.description,
      status: task.status ?? 'todo',
      priority: task.priority ?? 'medium',
      assignee_id: task.assignee_id,
      due_date: task.due_date,
      position: task.position ?? taskIndex,
    };
  }
}
