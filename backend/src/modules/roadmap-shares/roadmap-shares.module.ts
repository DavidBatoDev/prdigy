import { Module } from '@nestjs/common';
import { RoadmapSharesController } from './roadmap-shares.controller';
import {
  RoadmapSharesService,
  ROADMAP_SHARES_REPOSITORY,
} from './roadmap-shares.service';
import { RoadmapSharesRepositorySupabase } from './repositories/roadmap-shares.repository.supabase';

@Module({
  controllers: [RoadmapSharesController],
  providers: [
    RoadmapSharesService,
    {
      provide: ROADMAP_SHARES_REPOSITORY,
      useClass: RoadmapSharesRepositorySupabase,
    },
  ],
})
export class RoadmapSharesModule {}
