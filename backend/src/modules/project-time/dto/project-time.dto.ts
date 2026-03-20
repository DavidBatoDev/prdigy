import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
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
  @IsUUID()
  @IsOptional()
  task_id?: string;

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

export class CreateProjectMemberTimeRateDto {
  @IsUUID()
  @IsOptional()
  project_member_id?: string;

  @ValidateIf((o: CreateProjectMemberTimeRateDto) => !o.project_member_id)
  @IsUUID()
  @IsOptional()
  member_user_id?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  hourly_rate: number;

  @IsString()
  @MaxLength(8)
  currency: string;

  @IsString()
  @MaxLength(120)
  @IsOptional()
  custom_id?: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  @IsOptional()
  end_date?: string;
}

export class UpdateProjectMemberTimeRateDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  hourly_rate?: number;

  @IsString()
  @MaxLength(8)
  @IsOptional()
  currency?: string;

  @IsString()
  @MaxLength(120)
  @IsOptional()
  custom_id?: string;

  @IsDateString()
  @IsOptional()
  start_date?: string;

  @IsDateString()
  @IsOptional()
  end_date?: string;
}
