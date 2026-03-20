import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class StartTimeLogDto {
  @IsUUID()
  project_id: string;

  @IsUUID()
  task_id: string;
}

export class StopTimeLogDto {
  @IsDateString()
  @IsOptional()
  ended_at?: string;
}

export class UpdateTimeLogDto {
  @IsDateString()
  @IsOptional()
  started_at?: string;

  @IsDateString()
  @IsOptional()
  ended_at?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  review_note?: string;
}

export class ReviewTimeLogDto {
  @IsEnum(['approved', 'rejected'])
  decision: 'approved' | 'rejected';

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  reason?: string;
}

export class TimeLogsQueryDto {
  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;

  @IsEnum(['pending', 'approved', 'rejected'])
  @IsOptional()
  status?: 'pending' | 'approved' | 'rejected';

  @IsUUID()
  @IsOptional()
  member_user_id?: string;

  @IsUUID()
  @IsOptional()
  task_id?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}

