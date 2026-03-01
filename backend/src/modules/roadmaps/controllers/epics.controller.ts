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
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-request.interface';
import { EpicsService } from '../services/epics.service';
import {
  CreateEpicDto,
  UpdateEpicDto,
  BulkReorderDto,
} from '../dto/roadmaps.dto';

@Controller('epics')
@UseGuards(SupabaseAuthGuard)
export class EpicsController {
  constructor(private readonly epicsService: EpicsService) {}

  @Get('roadmap/:roadmapId')
  getByRoadmap(@Param('roadmapId') roadmapId: string) {
    return this.epicsService.findByRoadmap(roadmapId);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.epicsService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateEpicDto, @CurrentUser() user: AuthenticatedUser) {
    return this.epicsService.create(dto, user.id);
  }

  @Patch('reorder')
  bulkReorder(
    @Body('roadmap_id') roadmapId: string,
    @Body() dto: BulkReorderDto,
  ) {
    return this.epicsService.bulkReorder(roadmapId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEpicDto) {
    return this.epicsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.epicsService.remove(id);
  }
}
