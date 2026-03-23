import {
  Body,
  Controller,
  Delete,
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
  BulkReviewTimeLogsDto,
  CreateProjectMemberTimeRateDto,
  ReviewTimeLogDto,
  StartTimeLogDto,
  StopTimeLogDto,
  TimeLogsQueryDto,
  UpdateProjectMemberTimeRateDto,
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

  @Delete('logs/:id')
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.projectTimeService.delete(user.id, id);
  }

  @Post('logs/:id/review')
  review(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewTimeLogDto,
  ) {
    return this.projectTimeService.review(user.id, id, dto);
  }

  @Post('logs/review-bulk')
  reviewBulk(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkReviewTimeLogsDto,
  ) {
    return this.projectTimeService.reviewBulk(user.id, dto);
  }

  @Get('projects/:projectId/rates')
  listProjectMemberRates(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
  ) {
    return this.projectTimeService.listProjectMemberRates(user.id, projectId);
  }

  @Get('projects/:projectId/my-rate')
  getMyProjectMemberRate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
  ) {
    return this.projectTimeService.getMyProjectMemberRate(user.id, projectId);
  }

  @Get('projects/:projectId/tasks')
  listProjectTasks(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
  ) {
    return this.projectTimeService.listProjectTasks(user.id, projectId);
  }

  @Post('projects/:projectId/rates')
  createProjectMemberRate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateProjectMemberTimeRateDto,
  ) {
    return this.projectTimeService.createProjectMemberRate(
      user.id,
      projectId,
      dto,
    );
  }

  @Patch('projects/:projectId/rates/:rateId')
  updateProjectMemberRate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('rateId') rateId: string,
    @Body() dto: UpdateProjectMemberTimeRateDto,
  ) {
    return this.projectTimeService.updateProjectMemberRate(
      user.id,
      projectId,
      rateId,
      dto,
    );
  }

  @Delete('projects/:projectId/rates/:rateId')
  deleteProjectMemberRate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('rateId') rateId: string,
  ) {
    return this.projectTimeService.deleteProjectMemberRate(
      user.id,
      projectId,
      rateId,
    );
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
