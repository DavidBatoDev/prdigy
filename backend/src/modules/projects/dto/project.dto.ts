import {
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export type MemberType = 'stakeholder' | 'freelancer' | 'open_role';

export class AddProjectMemberDto {
  @IsEmail() @IsOptional() email?: string;
  @IsString() @MaxLength(100) role: string;
  @IsEnum(['stakeholder', 'freelancer', 'open_role'])
  member_type: MemberType;
}

export class UpdateProjectMemberDto {
  @IsString() @IsOptional() @MaxLength(100) role?: string;
  @IsEnum(['stakeholder', 'freelancer', 'open_role'])
  @IsOptional()
  member_type?: MemberType;
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
