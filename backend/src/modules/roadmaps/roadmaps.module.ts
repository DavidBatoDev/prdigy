import { Module } from '@nestjs/common';

// Controllers
import { RoadmapsController } from './controllers/roadmaps.controller';
import { MilestonesController } from './controllers/milestones.controller';
import { EpicsController } from './controllers/epics.controller';
import { FeaturesController } from './controllers/features.controller';
import { TasksController } from './controllers/tasks.controller';
import { TaskExtrasController } from './controllers/task-extras.controller';
import { RoadmapPatchController } from './controllers/roadmap-patch.controller';

// Services & tokens
import {
  RoadmapsService,
  ROADMAPS_REPOSITORY,
} from './services/roadmaps.service';
import {
  MilestonesService,
  MILESTONES_REPOSITORY,
} from './services/milestones.service';
import { EpicsService, EPICS_REPOSITORY } from './services/epics.service';
import {
  FeaturesService,
  FEATURES_REPOSITORY,
} from './services/features.service';
import { TasksService, TASKS_REPOSITORY } from './services/tasks.service';
import {
  TaskExtrasService,
  TASK_EXTRAS_REPOSITORY,
} from './services/task-extras.service';
import {
  RoadmapPatchService,
  ROADMAP_PATCH_REPOSITORY,
} from './services/roadmap-patch.service';

// Repository implementations
import { RoadmapsRepositorySupabase } from './repositories/roadmaps.repository.supabase';
import { MilestonesRepositorySupabase } from './repositories/milestones.repository.supabase';
import { EpicsRepositorySupabase } from './repositories/epics.repository.supabase';
import { FeaturesRepositorySupabase } from './repositories/features.repository.supabase';
import { TasksRepositorySupabase } from './repositories/tasks.repository.supabase';
import { TaskExtrasRepositorySupabase } from './repositories/task-extras.repository.supabase';
import { RoadmapPatchRepositorySupabase } from './repositories/roadmap-patch.repository.supabase';
import { RoadmapJsonPatchProcessor } from './patch/roadmap-json-patch.processor';

@Module({
  controllers: [
    RoadmapsController,
    MilestonesController,
    EpicsController,
    FeaturesController,
    TasksController,
    TaskExtrasController,
    RoadmapPatchController,
  ],
  providers: [
    RoadmapsService,
    { provide: ROADMAPS_REPOSITORY, useClass: RoadmapsRepositorySupabase },
    RoadmapPatchService,
    {
      provide: ROADMAP_PATCH_REPOSITORY,
      useClass: RoadmapPatchRepositorySupabase,
    },
    RoadmapJsonPatchProcessor,
    MilestonesService,
    { provide: MILESTONES_REPOSITORY, useClass: MilestonesRepositorySupabase },
    EpicsService,
    { provide: EPICS_REPOSITORY, useClass: EpicsRepositorySupabase },
    FeaturesService,
    { provide: FEATURES_REPOSITORY, useClass: FeaturesRepositorySupabase },
    TasksService,
    { provide: TASKS_REPOSITORY, useClass: TasksRepositorySupabase },
    TaskExtrasService,
    { provide: TASK_EXTRAS_REPOSITORY, useClass: TaskExtrasRepositorySupabase },
  ],
})
export class RoadmapsModule {}
