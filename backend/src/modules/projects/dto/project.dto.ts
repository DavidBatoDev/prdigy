import {
  IsBoolean,
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

class RoadmapPermissionsDto {
  @IsBoolean() edit: boolean;
  @IsBoolean() view_internal: boolean;
  @IsBoolean() comment: boolean;
  @IsBoolean() promote: boolean;
}

class MembersPermissionsDto {
  @IsBoolean() manage: boolean;
  @IsBoolean() view: boolean;
}

class ProjectPermissionsDto {
  @IsBoolean() settings: boolean;
  @IsBoolean() transfer: boolean;
}

class TimePermissionsDto {
  @IsBoolean() manage_rates: boolean;
  @IsBoolean() view: boolean;
}

export class UpdateProjectMemberPermissionsDto {
  @IsOptional()
  roadmap?: RoadmapPermissionsDto;

  @IsOptional()
  members?: MembersPermissionsDto;

  @IsOptional()
  project?: ProjectPermissionsDto;

  @IsOptional()
  time?: TimePermissionsDto;
}

export class AddProjectMemberDto {
  @IsEmail() @IsOptional() email?: string;
  @IsString() @MaxLength(100) role: string;
}

export class UpdateProjectMemberDto {
  @IsString() @IsOptional() @MaxLength(100) role?: string;
}

export class InviteProjectByEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  @MaxLength(100)
  role: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  message?: string;
}

export class RespondProjectInviteDto {
  @IsIn(['accepted', 'declined'])
  status: 'accepted' | 'declined';
}

export class ProjectInviteQueryDto {
  @IsOptional()
  @IsUUID()
  project_id?: string;
}

type ProjectStatus =
  | 'draft'
  | 'bidding'
  | 'active'
  | 'paused'
  | 'completed'
  | 'archived';

export class CreateProjectDto {
  @IsEnum(['client', 'consultant'])
  @IsOptional()
  creation_mode?: 'client' | 'consultant';

  @IsString() @MaxLength(200) title: string;
  @IsString() @IsOptional() @MaxLength(500) brief?: string;
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
  @IsString() @IsOptional() @MaxLength(500) brief?: string;
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
