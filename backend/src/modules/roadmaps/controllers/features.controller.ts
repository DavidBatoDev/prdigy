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
import { FeaturesService } from '../services/features.service';
import {
  CreateFeatureDto,
  UpdateFeatureDto,
  BulkReorderDto,
  LinkMilestoneDto,
  UnlinkMilestoneDto,
} from '../dto/roadmaps.dto';

@Controller('features')
@UseGuards(SupabaseAuthGuard)
export class FeaturesController {
  constructor(private readonly featuresService: FeaturesService) {}

  @Get('epic/:epicId')
  getByEpic(@Param('epicId') epicId: string) {
    return this.featuresService.findByEpic(epicId);
  }

  @Get('roadmap/:roadmapId')
  getByRoadmap(@Param('roadmapId') roadmapId: string) {
    return this.featuresService.findByRoadmap(roadmapId);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.featuresService.findById(id);
  }

  @Post()
  create(
    @Body() dto: CreateFeatureDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.featuresService.create(dto, user.id);
  }

  @Patch('reorder')
  bulkReorder(@Body('epic_id') epicId: string, @Body() dto: BulkReorderDto) {
    return this.featuresService.bulkReorder(epicId, dto);
  }

  @Post('link-milestone')
  linkMilestone(@Body() dto: LinkMilestoneDto) {
    return this.featuresService.linkMilestone(dto);
  }

  @Delete('unlink-milestone')
  @HttpCode(HttpStatus.NO_CONTENT)
  unlinkMilestone(@Body() dto: UnlinkMilestoneDto) {
    return this.featuresService.unlinkMilestone(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFeatureDto) {
    return this.featuresService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.featuresService.remove(id);
  }

  // Deprecated assign/unassign endpoints — return 410 Gone
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
