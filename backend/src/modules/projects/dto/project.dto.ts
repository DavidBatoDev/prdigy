import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

type ProjectStatus =
  | 'draft'
  | 'bidding'
  | 'active'
  | 'paused'
  | 'completed'
  | 'archived';

export class CreateProjectDto {
  @IsString() @MaxLength(200) title: string;
  @IsString() @IsOptional() @MaxLength(2000) description?: string;
  @IsEnum(['draft', 'bidding', 'active', 'paused', 'completed', 'archived'])
  @IsOptional()
  status?: ProjectStatus;
  @IsString() @IsOptional() category?: string;
  @IsString() @IsOptional() project_state?: string;
  @IsArray() @IsOptional() skills?: unknown[];
  @IsString() @IsOptional() duration?: string;
  @IsString() @IsOptional() budget_range?: string;
  @IsString() @IsOptional() funding_status?: string;
  @IsString() @IsOptional() start_date?: string;
  @IsString() @IsOptional() custom_start_date?: string;
}

export class UpdateProjectDto {
  @IsString() @IsOptional() @MaxLength(200) title?: string;
  @IsString() @IsOptional() @MaxLength(2000) description?: string;
  @IsEnum(['draft', 'bidding', 'active', 'paused', 'completed', 'archived'])
  @IsOptional()
  status?: ProjectStatus;
  @IsString() @IsOptional() category?: string;
  @IsString() @IsOptional() project_state?: string;
  @IsArray() @IsOptional() skills?: unknown[];
  @IsString() @IsOptional() duration?: string;
  @IsString() @IsOptional() budget_range?: string;
  @IsString() @IsOptional() funding_status?: string;
  @IsString() @IsOptional() start_date?: string;
  @IsString() @IsOptional() custom_start_date?: string;
}

export class AssignConsultantDto {
  @IsString() consultant_id: string;
}
