import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { NotificationPreferencesDto } from './dto/notification.dto';

@Controller('notifications')
@UseGuards(RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles(Role.EMPLOYEE, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  async getNotifications(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    return this.notificationsService.getNotifications(
      user.id,
      pageNum,
      limitNum,
    );
  }

  @Get('unread-count')
  @Roles(Role.EMPLOYEE, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  async getUnreadCount(@CurrentUser() user: User) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Put(':id/read')
  @Roles(Role.EMPLOYEE, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  async markAsRead(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) notificationId: number,
  ) {
    return this.notificationsService.markAsRead(user.id, notificationId);
  }

  @Put('mark-all-read')
  @Roles(Role.EMPLOYEE, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  async markAllAsRead(@CurrentUser() user: User) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Get('preferences')
  @Roles(Role.EMPLOYEE, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  async getPreferences(@CurrentUser() user: User) {
    return this.notificationsService.getPreferences(user.id);
  }

  @Put('preferences')
  @Roles(Role.EMPLOYEE, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  async updatePreferences(
    @CurrentUser() user: User,
    @Body() preferencesDto: NotificationPreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(user.id, preferencesDto);
  }
}
