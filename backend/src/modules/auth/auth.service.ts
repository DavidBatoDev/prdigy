import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
export const AUTH_REPOSITORY = Symbol('AUTH_REPOSITORY');
import type { AuthRepository } from './repositories/auth.repository.interface';
import {
  CompleteOnboardingDto,
  OnboardingDto,
  SwitchPersonaDto,
  UpdateProfileDto,
} from './dto/auth.dto';
import { Profile } from '../../common/entities';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepo: AuthRepository,
  ) {}

  async getProfile(userId: string): Promise<Profile> {
    const profile = await this.authRepo.getProfile(userId);
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async onboarding(userId: string, dto: OnboardingDto): Promise<Profile> {
    return this.authRepo.updateOnboarding(userId, {
      active_persona: dto.active_persona,
      display_name: dto.display_name,
    });
  }

  async completeOnboarding(
    userId: string,
    dto: CompleteOnboardingDto,
  ): Promise<Profile> {
    return this.authRepo.completeOnboarding(userId, { intent: dto.intent });
  }

  async switchPersona(userId: string, dto: SwitchPersonaDto): Promise<Profile> {
    if (dto.persona === 'consultant') {
      const profile = await this.authRepo.getProfile(userId);
      if (!profile) throw new NotFoundException('Profile not found');
      if (!profile.is_consultant_verified) {
        throw new ForbiddenException(
          'Consultant verification required to switch to consultant persona',
        );
      }
    }
    return this.authRepo.switchPersona(userId, dto.persona);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<Profile> {
    return this.authRepo.updateProfile(userId, dto);
  }
}
