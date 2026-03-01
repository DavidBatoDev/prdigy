import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-request.interface';
import { TasksService } from '../services/tasks.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  BulkReorderDto,
} from '../dto/roadmaps.dto';

@Controller('tasks')
@UseGuards(SupabaseAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('feature/:featureId')
  getByFeature(@Param('featureId') featureId: string) {
    return this.tasksService.findByFeature(featureId);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.tasksService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: AuthenticatedUser) {
    return this.tasksService.create(dto, user.id);
  }

  @Patch('reorder')
  bulkReorder(
    @Body('feature_id') featureId: string,
    @Body() dto: BulkReorderDto,
  ) {
    return this.tasksService.bulkReorder(featureId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }

  // Deprecated assign/unassign — 410 Gone
  @Post(':id/assign')
  assignDeprecated() {
    throw new HttpException(
      'This endpoint has been deprecated and removed',
      HttpStatus.GONE,
    );
  }

  @Delete(':id/unassign')
  unassignDeprecated() {
    throw new HttpException(
      'This endpoint has been deprecated and removed',
      HttpStatus.GONE,
    );
  }
}
