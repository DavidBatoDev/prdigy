import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Headers,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-request.interface';
import { RoadmapsService } from '../services/roadmaps.service';
import {
  CreateRoadmapDto,
  UpdateRoadmapDto,
  UpdateRoadmapTemplateSettingsDto,
} from '../dto/roadmaps.dto';

@Controller('roadmaps')
@UseGuards(SupabaseAuthGuard)
export class RoadmapsController {
  constructor(private readonly roadmapsService: RoadmapsService) {}

  @Get()
  getAll(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-active-persona') headerPersona?: string,
    @Query('role') queryPersona?: string,
  ) {
    return this.roadmapsService.findAll(user.id, headerPersona ?? queryPersona);
  }

  @Get('preview')
  getPreviews(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-active-persona') headerPersona?: string,
    @Query('role') queryPersona?: string,
  ) {
    return this.roadmapsService.findPreviews(
      user.id,
      headerPersona ?? queryPersona,
    );
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

  @Get('project/:projectId')
  getByProjectId(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-active-persona') headerPersona?: string,
    @Query('role') queryPersona?: string,
  ) {
    return this.roadmapsService.findByProjectId(
      projectId,
      user.id,
      headerPersona ?? queryPersona,
    );
  }

  @Get('consultant/templates/mine')
  getConsultantTemplatesMine(@CurrentUser() user: AuthenticatedUser) {
    return this.roadmapsService.findConsultantTemplateRoadmaps(user.id);
  }

  @Get('templates/public')
  @Public()
  getPublicTemplates() {
    return this.roadmapsService.findPublicTemplates();
  }

  @Get(':id')
  getOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-active-persona') headerPersona?: string,
    @Query('role') queryPersona?: string,
  ) {
    return this.roadmapsService.findById(
      id,
      user.id,
      headerPersona ?? queryPersona,
    );
  }

  @Get(':id/full')
  getFull(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-active-persona') headerPersona?: string,
    @Query('role') queryPersona?: string,
  ) {
    return this.roadmapsService.findFull(
      id,
      user.id,
      headerPersona ?? queryPersona,
    );
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

  @Patch(':id/template-settings')
  updateTemplateSettings(
    @Param('id') id: string,
    @Body() dto: UpdateRoadmapTemplateSettingsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.roadmapsService.updateTemplateSettings(id, dto, user.id);
  }

  @Post(':id/clone-from-template')
  cloneFromTemplate(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.roadmapsService.cloneFromTemplate(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.roadmapsService.remove(id, user.id);
  }
}
