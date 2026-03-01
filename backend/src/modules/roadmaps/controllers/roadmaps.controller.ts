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
import { RoadmapsService } from '../services/roadmaps.service';
import { CreateRoadmapDto, UpdateRoadmapDto } from '../dto/roadmaps.dto';

@Controller('roadmaps')
@UseGuards(SupabaseAuthGuard)
export class RoadmapsController {
  constructor(private readonly roadmapsService: RoadmapsService) {}

  @Get()
  getAll(@CurrentUser() user: AuthenticatedUser) {
    return this.roadmapsService.findAll(user.id);
  }

  @Get('preview')
  getPreviews(@CurrentUser() user: AuthenticatedUser) {
    return this.roadmapsService.findPreviews(user.id);
  }

  @Get('user/:userId')
  getByUser(@Param('userId') userId: string) {
    return this.roadmapsService.findByUser(userId);
  }

  @Post('migrate')
  @HttpCode(HttpStatus.OK)
  migrateGuest(
    @Body('session_id') sessionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.roadmapsService.migrateGuestRoadmaps(sessionId, user.id);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.roadmapsService.findById(id, user.id);
  }

  @Get(':id/full')
  getFull(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.roadmapsService.findFull(id, user.id);
  }

  @Post()
  create(
    @Body() dto: CreateRoadmapDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.roadmapsService.create(dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRoadmapDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.roadmapsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.roadmapsService.remove(id, user.id);
  }
}
