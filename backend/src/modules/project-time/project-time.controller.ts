import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';
import { ProjectTimeService } from './project-time.service';
import {
  ReviewTimeLogDto,
  StartTimeLogDto,
  StopTimeLogDto,
  TimeLogsQueryDto,
  UpdateTimeLogDto,
} from './dto/project-time.dto';

@Controller('project-time')
@UseGuards(SupabaseAuthGuard)
export class ProjectTimeController {
  constructor(private readonly projectTimeService: ProjectTimeService) {}

  @Post('logs/start')
  start(@CurrentUser() user: AuthenticatedUser, @Body() dto: StartTimeLogDto) {
    return this.projectTimeService.start(user.id, dto);
  }

  @Post('logs/:id/stop')
  stop(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: StopTimeLogDto,
  ) {
    return this.projectTimeService.stop(user.id, id, dto);
  }

  @Patch('logs/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateTimeLogDto,
  ) {
    return this.projectTimeService.update(user.id, id, dto);
  }

  @Post('logs/:id/review')
  review(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewTimeLogDto,
  ) {
    return this.projectTimeService.review(user.id, id, dto);
  }

  @Get('projects/:projectId/my')
  listMyLogs(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Query() query: TimeLogsQueryDto,
  ) {
    return this.projectTimeService.listMyLogs(user.id, projectId, query);
  }

  @Get('projects/:projectId/approvals')
  listApprovals(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Query() query: TimeLogsQueryDto,
  ) {
    return this.projectTimeService.listApprovals(user.id, projectId, query);
  }

  @Get('projects/:projectId/team')
  listTeamLogs(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Query() query: TimeLogsQueryDto,
  ) {
    return this.projectTimeService.listTeamLogs(user.id, projectId, query);
  }

  @Get('projects/:projectId/tasks/:taskId/logs/me')
  listMyTaskLogs(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Query() query: TimeLogsQueryDto,
  ) {
    return this.projectTimeService.listMyTaskLogs(
      user.id,
      projectId,
      taskId,
      query,
    );
  }
}
