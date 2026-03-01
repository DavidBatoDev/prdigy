import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../config/supabase.module';

export const CONSULTANTS_REPOSITORY = Symbol('CONSULTANTS_REPOSITORY');

@Injectable()
export class ConsultantsService {
  constructor(
    @Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient,
  ) {}

  async findAll() {
    const { data } = await this.supabase
      .from('profiles')
      .select(
        'id, display_name, avatar_url, banner_url, headline, bio, country, city, active_persona, is_consultant_verified, created_at',
      )
      .eq('is_consultant_verified', true);
    return data || [];
  }

  async findOne(id: string) {
    const { data } = await this.supabase
      .from('profiles')
      .select(
        'id, display_name, avatar_url, banner_url, headline, bio, country, city, active_persona, is_consultant_verified, created_at',
      )
      .eq('id', id)
      .eq('is_consultant_verified', true)
      .single();
    if (!data) throw new NotFoundException('Consultant not found');
    return data;
  }
}
