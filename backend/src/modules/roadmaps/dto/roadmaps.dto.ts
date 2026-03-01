import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// Roadmap DTOs
export class CreateRoadmapDto {
  @IsString() @MaxLength(200) name: string;
  @IsString() @IsOptional() description?: string;
  @IsUUID() @IsOptional() project_id?: string;
  @IsEnum(['draft', 'active', 'paused', 'completed', 'archived'])
  @IsOptional()
  status?: string;
  @IsDateString() @IsOptional() start_date?: string;
  @IsDateString() @IsOptional() end_date?: string;
  @IsOptional() settings?: Record<string, unknown>;
  @IsOptional() project_metadata?: Record<string, unknown>;
}

export class UpdateRoadmapDto {
  @IsString() @IsOptional() @MaxLength(200) name?: string;
  @IsString() @IsOptional() description?: string;
  @IsEnum(['draft', 'active', 'paused', 'completed', 'archived'])
  @IsOptional()
  status?: string;
  @IsDateString() @IsOptional() start_date?: string;
  @IsDateString() @IsOptional() end_date?: string;
  @IsOptional() settings?: Record<string, unknown>;
  @IsOptional() project_metadata?: Record<string, unknown>;
}

// Milestone DTOs
export class CreateMilestoneDto {
  @IsString() @MaxLength(200) title: string;
  @IsString() @IsOptional() description?: string;
  @IsDateString() target_date: string;
  @IsEnum(['not_started', 'in_progress', 'at_risk', 'completed', 'missed'])
  @IsOptional()
  status?: string;
  @IsNumber() @IsOptional() @Min(0) position?: number;
  @IsString() @IsOptional() color?: string;
}

export class UpdateMilestoneDto {
  @IsString() @IsOptional() @MaxLength(200) title?: string;
  @IsString() @IsOptional() description?: string;
  @IsDateString() @IsOptional() target_date?: string;
  @IsEnum(['not_started', 'in_progress', 'at_risk', 'completed', 'missed'])
  @IsOptional()
  status?: string;
  @IsString() @IsOptional() color?: string;
}

export class ReorderDto {
  @IsNumber() @Min(0) position: number;
}

export class BulkReorderDto {
  @IsArray() items: { id: string; position: number }[];
}

// Epic DTOs
export class CreateEpicDto {
  @IsUUID() roadmap_id: string;
  @IsString() @MaxLength(200) title: string;
  @IsString() @IsOptional() description?: string;
  @IsEnum(['critical', 'high', 'medium', 'low', 'nice_to_have'])
  @IsOptional()
  priority?: string;
  @IsEnum([
    'backlog',
    'planned',
    'in_progress',
    'in_review',
    'completed',
    'on_hold',
  ])
  @IsOptional()
  status?: string;
  @IsNumber() @IsOptional() @Min(0) position?: number;
  @IsString() @IsOptional() color?: string;
  @IsNumber() @IsOptional() @Min(0) estimated_hours?: number;
  @IsDateString() @IsOptional() start_date?: string;
  @IsDateString() @IsOptional() due_date?: string;
  @IsArray() @IsOptional() tags?: string[];
}

export class UpdateEpicDto {
  @IsString() @IsOptional() @MaxLength(200) title?: string;
  @IsString() @IsOptional() description?: string;
  @IsEnum(['critical', 'high', 'medium', 'low', 'nice_to_have'])
  @IsOptional()
  priority?: string;
  @IsEnum([
    'backlog',
    'planned',
    'in_progress',
    'in_review',
    'completed',
    'on_hold',
  ])
  @IsOptional()
  status?: string;
  @IsString() @IsOptional() color?: string;
  @IsNumber() @IsOptional() @Min(0) estimated_hours?: number;
  @IsNumber() @IsOptional() @Min(0) actual_hours?: number;
  @IsDateString() @IsOptional() start_date?: string;
  @IsDateString() @IsOptional() due_date?: string;
  @IsArray() @IsOptional() tags?: string[];
}

// Feature DTOs
export class CreateFeatureDto {
  @IsUUID() roadmap_id: string;
  @IsUUID() epic_id: string;
  @IsString() @MaxLength(200) title: string;
  @IsString() @IsOptional() description?: string;
  @IsEnum(['not_started', 'in_progress', 'in_review', 'completed', 'blocked'])
  @IsOptional()
  status?: string;
  @IsNumber() @IsOptional() @Min(0) position?: number;
  @IsBoolean() @IsOptional() is_deliverable?: boolean;
  @IsNumber() @IsOptional() @Min(0) estimated_hours?: number;
}

export class UpdateFeatureDto {
  @IsString() @IsOptional() @MaxLength(200) title?: string;
  @IsString() @IsOptional() description?: string;
  @IsEnum(['not_started', 'in_progress', 'in_review', 'completed', 'blocked'])
  @IsOptional()
  status?: string;
  @IsBoolean() @IsOptional() is_deliverable?: boolean;
  @IsNumber() @IsOptional() @Min(0) estimated_hours?: number;
  @IsNumber() @IsOptional() @Min(0) actual_hours?: number;
}

export class LinkMilestoneDto {
  @IsUUID() feature_id: string;
  @IsUUID() milestone_id: string;
}

export class UnlinkMilestoneDto {
  @IsUUID() feature_id: string;
  @IsUUID() milestone_id: string;
}

// Task DTOs
export class CreateTaskDto {
  @IsUUID() feature_id: string;
  @IsString() @MaxLength(200) title: string;
  @IsString() @IsOptional() description?: string;
  @IsEnum(['urgent', 'high', 'medium', 'low']) @IsOptional() priority?: string;
  @IsEnum(['todo', 'in_progress', 'in_review', 'done', 'blocked'])
  @IsOptional()
  status?: string;
  @IsDateString() @IsOptional() due_date?: string;
  @IsNumber() @IsOptional() @Min(0) position?: number;
}

export class UpdateTaskDto {
  @IsString() @IsOptional() @MaxLength(200) title?: string;
  @IsString() @IsOptional() description?: string;
  @IsEnum(['urgent', 'high', 'medium', 'low']) @IsOptional() priority?: string;
  @IsEnum(['todo', 'in_progress', 'in_review', 'done', 'blocked'])
  @IsOptional()
  status?: string;
  @IsDateString() @IsOptional() due_date?: string;
  @IsNumber() @IsOptional() @Min(0) estimated_hours?: number;
  @IsNumber() @IsOptional() @Min(0) actual_hours?: number;
  @IsArray() @IsOptional() labels?: string[];
  @IsOptional() checklist?: unknown[];
}

// Comment/Attachment DTOs
export class AddCommentDto {
  @IsString() @MaxLength(5000) content: string;
}

export class UpdateCommentDto {
  @IsString() @MaxLength(5000) content: string;
}

export class AddAttachmentDto {
  @IsString() file_name: string;
  @IsString() file_url: string;
  @IsString() @IsOptional() file_type?: string;
  @IsNumber() @IsOptional() @Min(0) file_size?: number;
}
