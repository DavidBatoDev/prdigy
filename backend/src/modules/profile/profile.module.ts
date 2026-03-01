import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { SupabaseProfileRepository } from './repositories/profile.repository.supabase';
import { PROFILE_REPOSITORY } from './profile.service';

@Module({
  controllers: [ProfileController],
  providers: [
    ProfileService,
    { provide: PROFILE_REPOSITORY, useClass: SupabaseProfileRepository },
  ],
})
export class ProfileModule {}
