import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { PersonaGuard } from '../../common/guards/persona.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Personas } from '../../common/decorators/personas.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';
import {
  AssignConsultantDto,
  CreateProjectDto,
  UpdateProjectDto,
} from './dto/project.dto';

@Controller('projects')
@UseGuards(SupabaseAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  listProjects(@CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.listUserProjects(user.id);
  }

  @Post()
  @Personas('client')
  @UseGuards(PersonaGuard)
  createProject(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.createProject(user.id, dto);
  }

  @Get(':id')
  getProject(@Param('id') id: string) {
    return this.projectsService.getProject(id);
  }

  @Patch(':id')
  updateProject(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.updateProject(id, user.id, dto);
  }

  @Post(':id/assign-consultant')
  @UseGuards(AdminGuard)
  assignConsultant(@Param('id') id: string, @Body() dto: AssignConsultantDto) {
    return this.projectsService.assignConsultant(id, dto.consultant_id);
  }
}
