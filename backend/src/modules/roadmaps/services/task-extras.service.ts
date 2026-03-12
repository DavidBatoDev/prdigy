import { Injectable, Inject } from '@nestjs/common';
import type { ITaskExtrasRepository } from '../repositories/task-extras.repository.interface';
import {
  AddCommentDto,
  UpdateCommentDto,
  AddAttachmentDto,
} from '../dto/roadmaps.dto';
import { RoadmapAuthorizationService } from './roadmap-authorization.service';

export const TASK_EXTRAS_REPOSITORY = Symbol('TASK_EXTRAS_REPOSITORY');

@Injectable()
export class TaskExtrasService {
  constructor(
    @Inject(TASK_EXTRAS_REPOSITORY)
    private readonly repo: ITaskExtrasRepository,
    private readonly roadmapAuthz: RoadmapAuthorizationService,
  ) {}

  async findComments(taskId: string) {
    return this.repo.findComments(taskId);
  }

  async addComment(taskId: string, dto: AddCommentDto, userId: string) {
    await this.roadmapAuthz.assertTaskCommentPermission(taskId, userId);
    return this.repo.addComment(taskId, dto, userId);
  }

  async updateComment(
    commentId: string,
    dto: UpdateCommentDto,
    userId: string,
  ) {
    return this.repo.updateComment(commentId, dto, userId);
  }

  async deleteComment(commentId: string, userId: string) {
    return this.repo.deleteComment(commentId, userId);
  }

  async findAttachments(taskId: string) {
    return this.repo.findAttachments(taskId);
  }

  async addAttachment(taskId: string, dto: AddAttachmentDto, userId: string) {
    await this.roadmapAuthz.assertTaskPermission(
      taskId,
      userId,
      'roadmap.edit',
    );
    return this.repo.addAttachment(taskId, dto, userId);
  }

  async deleteAttachment(attachmentId: string, userId: string) {
    return this.repo.deleteAttachment(attachmentId, userId);
  }
}
