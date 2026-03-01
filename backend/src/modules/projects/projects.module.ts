import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { SupabaseProjectsRepository } from './repositories/projects.repository.supabase';
import { PROJECTS_REPOSITORY } from './projects.service';

@Module({
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    { provide: PROJECTS_REPOSITORY, useClass: SupabaseProjectsRepository },
  ],
  exports: [ProjectsService],
})
export class ProjectsModule {}
