import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  GoneException,
} from '@nestjs/common';
import type { IRoadmapSharesRepository } from './repositories/roadmap-shares.repository.interface';
import { CreateShareDto, AddShareCommentDto } from './dto/roadmap-shares.dto';

export const ROADMAP_SHARES_REPOSITORY = Symbol('ROADMAP_SHARES_REPOSITORY');

@Injectable()
export class RoadmapSharesService {
  constructor(
    @Inject(ROADMAP_SHARES_REPOSITORY)
    private readonly repo: IRoadmapSharesRepository,
  ) {}

  async getShareByRoadmap(roadmapId: string) {
    return this.repo.findByRoadmap(roadmapId);
  }

  async getByToken(token: string) {
    const share = await this.repo.findByToken(token);
    if (!share || !share.is_active)
      throw new NotFoundException('Share link not found or inactive');
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      throw new GoneException('Share link has expired');
    }
    return share;
  }

  async getSharedWithMe(userId: string) {
    return this.repo.findSharedWithMe(userId);
  }

  async create(roadmapId: string, dto: CreateShareDto, userId: string) {
    return this.repo.create(roadmapId, dto, userId);
  }

  async remove(roadmapId: string, userId: string) {
    const share = await this.repo.findByRoadmap(roadmapId);
    if (!share) throw new NotFoundException('Share not found');
    if (share.created_by !== userId)
      throw new ForbiddenException('Not the owner');
    return this.repo.remove(roadmapId, userId);
  }

  async addEpicComment(
    epicId: string,
    dto: AddShareCommentDto,
    userId?: string,
  ) {
    return this.repo.addEpicComment(epicId, dto, userId);
  }

  async addFeatureComment(
    featureId: string,
    dto: AddShareCommentDto,
    userId?: string,
  ) {
    return this.repo.addFeatureComment(featureId, dto, userId);
  }
}
