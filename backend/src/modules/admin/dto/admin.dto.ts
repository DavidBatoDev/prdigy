import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class ApplicationsQueryDto {
  @IsString() @IsOptional() status?: string;
}

export class RejectApplicationDto {
  @IsString() @IsOptional() reason?: string;
}

export class MatchCandidatesQueryDto {
  @IsUUID() project_id: string;
}

export class MatchAssignDto {
  @IsUUID() project_id: string;
  @IsUUID() consultant_id: string;
}

export class GrantAdminDto {
  @IsEnum(['support', 'moderator', 'super_admin'])
  @IsOptional()
  access_level?: string = 'support';
  @IsString() @IsOptional() department?: string;
}
