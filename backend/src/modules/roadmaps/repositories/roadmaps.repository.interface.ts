import { CreateRoadmapDto, UpdateRoadmapDto } from '../dto/roadmaps.dto';

export interface IRoadmapsRepository {
  findAll(userId: string): Promise<any[]>;
  findById(id: string, userId?: string): Promise<any | null>;
  findFull(id: string, userId?: string): Promise<any | null>;
  findByUser(userId: string): Promise<any[]>;
  findPreviews(userId: string): Promise<any[]>;
  create(dto: CreateRoadmapDto, userId: string): Promise<any>;
  update(id: string, dto: UpdateRoadmapDto): Promise<any>;
  remove(id: string): Promise<void>;
  migrateGuestRoadmaps(
    sessionId: string,
    userId: string,
  ): Promise<{ migrated: number }>;
}
