import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';
import {
  MarkNotificationReadDto,
  NotificationsQueryDto,
} from './dto/notifications.dto';
import { NotificationsService } from './notifications.service';

@UseGuards(SupabaseAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: NotificationsQueryDto,
  ) {
    return this.notificationsService.listForUser(user.id, query);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.unreadCount(user.id);
  }

  @Patch('read-all')
  async markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Patch(':id/read')
  async markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: MarkNotificationReadDto,
  ) {
    return this.notificationsService.markAsRead(user.id, id, body);
  }

  @Delete(':id')
  async deleteOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.notificationsService.deleteNotification(user.id, id);
  }
}
