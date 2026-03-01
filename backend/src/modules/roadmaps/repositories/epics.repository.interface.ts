import {
  CreateEpicDto,
  UpdateEpicDto,
  BulkReorderDto,
} from '../dto/roadmaps.dto';

export interface IEpicsRepository {
  findByRoadmap(roadmapId: string): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  create(dto: CreateEpicDto, userId: string): Promise<any>;
  update(id: string, dto: UpdateEpicDto): Promise<any>;
  bulkReorder(roadmapId: string, dto: BulkReorderDto): Promise<void>;
  remove(id: string): Promise<void>;
}
