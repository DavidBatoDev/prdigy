import {
  CreateFeatureDto,
  UpdateFeatureDto,
  BulkReorderDto,
  LinkMilestoneDto,
  UnlinkMilestoneDto,
} from '../dto/roadmaps.dto';

export interface IFeaturesRepository {
  findByEpic(epicId: string): Promise<any[]>;
  findByRoadmap(roadmapId: string): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  create(dto: CreateFeatureDto, userId: string): Promise<any>;
  update(id: string, dto: UpdateFeatureDto): Promise<any>;
  bulkReorder(epicId: string, dto: BulkReorderDto): Promise<void>;
  linkMilestone(dto: LinkMilestoneDto): Promise<any>;
  unlinkMilestone(dto: UnlinkMilestoneDto): Promise<void>;
  remove(id: string): Promise<void>;
}
