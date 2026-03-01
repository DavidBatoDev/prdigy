import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../../config/supabase.module';
import { AuthRepository } from './auth.repository.interface';
import { Profile } from '../../../common/entities';

@Injectable()
export class SupabaseAuthRepository implements AuthRepository {
  constructor(
    @Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient,
  ) {}

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return null;
    return data as Profile;
  }

  async updateOnboarding(
    userId: string,
    dto: { active_persona: string; display_name: string },
  ): Promise<Profile> {
    const { data, error } = await this.supabase
      .from('profiles')
      .update({
        active_persona: dto.active_persona,
        display_name: dto.display_name,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Profile;
  }

  async completeOnboarding(
    userId: string,
    dto: { intent?: string },
  ): Promise<Profile> {
    const updatePayload: Record<string, unknown> = {
      has_completed_onboarding: true,
    };

    if (dto.intent) {
      updatePayload.settings = { onboarding: { intent: dto.intent } };
    }

    const { data, error } = await this.supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Profile;
  }

  async switchPersona(userId: string, persona: string): Promise<Profile> {
    const { data, error } = await this.supabase
      .from('profiles')
      .update({ active_persona: persona })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundException('Profile not found');
    return data as Profile;
  }

  async updateProfile(
    userId: string,
    dto: Partial<Pick<Profile, 'display_name' | 'avatar_url' | 'bio'>>,
  ): Promise<Profile> {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(dto)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Profile;
  }
}
