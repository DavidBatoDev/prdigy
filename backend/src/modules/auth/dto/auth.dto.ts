import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class OnboardingDto {
  @IsEnum(['client', 'freelancer'])
  active_persona: 'client' | 'freelancer';

  @IsString()
  @MaxLength(100)
  display_name: string;
}

export class CompleteOnboardingDto {
  @IsString()
  @IsOptional()
  intent?: string;
}

export class SwitchPersonaDto {
  @IsEnum(['client', 'freelancer', 'consultant'])
  persona: 'client' | 'freelancer' | 'consultant';
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  display_name?: string;

  @IsString()
  @IsOptional()
  avatar_url?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio?: string;
}
