import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationPreferencesDto } from './dto/notification.dto';
import { successResponse, paginationResponse } from '../../utilies/response';
import { handlePrismaError } from '../../utilies/error-handler';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getNotifications(userId: number, page: number = 1, limit: number = 10) {
    try {
      // Since there's no notification model in the schema,
      // we'll create a mock implementation that can be extended later
      const mockNotifications = [
        {
          id: 1,
          title: 'Welcome to TTC System',
          message: 'Welcome to the Time Tracking and Collaboration system!',
          type: 'info',
          read: false,
          createdAt: new Date(),
        },
        {
          id: 2,
          title: 'Time Tracking Reminder',
          message: "Don't forget to clock in today!",
          type: 'reminder',
          read: true,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        {
          id: 3,
          title: 'Task Deadline Approaching',
          message:
            'Your task "Complete project documentation" is due tomorrow.',
          type: 'deadline',
          read: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      ];

      // Filter notifications for pagination
      const total = mockNotifications.length;
      const skip = (page - 1) * limit;
      const notifications = mockNotifications.slice(skip, skip + limit);

      return paginationResponse(
        notifications,
        total,
        page,
        limit,
        'Notifications retrieved successfully',
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getUnreadCount(userId: number) {
    try {
      // Mock implementation - in real app this would query the notification table
      const unreadCount = 2;

      return successResponse(
        { unreadCount },
        'Unread notification count retrieved successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async markAsRead(userId: number, notificationId: number) {
    try {
      // Mock implementation - in real app this would update the notification
      const notification = {
        id: notificationId,
        title: 'Notification',
        message: 'This notification has been marked as read',
        type: 'info',
        read: true,
        createdAt: new Date(),
      };

      return successResponse(notification, 'Notification marked as read', 200);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async markAllAsRead(userId: number) {
    try {
      // Mock implementation - in real app this would update all user notifications
      const result = { markedCount: 2 };

      return successResponse(result, 'All notifications marked as read', 200);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async updatePreferences(
    userId: number,
    preferencesDto: NotificationPreferencesDto,
  ) {
    try {
      // Mock implementation - in real app this would update user preferences
      const preferences = {
        id: userId,
        email: preferencesDto.email,
        push: preferencesDto.push,
        taskReminders: preferencesDto.taskReminders,
        appointmentReminders: preferencesDto.appointmentReminders,
        deadlineAlerts: preferencesDto.deadlineAlerts,
        updatedAt: new Date(),
      };

      return successResponse(
        preferences,
        'Notification preferences updated successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getPreferences(userId: number) {
    try {
      // Mock implementation - in real app this would fetch user preferences
      const preferences = {
        id: userId,
        email: true,
        push: false,
        taskReminders: true,
        appointmentReminders: true,
        deadlineAlerts: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return successResponse(
        preferences,
        'Notification preferences retrieved successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }
}
