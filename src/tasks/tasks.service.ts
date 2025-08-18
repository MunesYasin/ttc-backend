import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import type { User } from '@prisma/client';
import { TaskAccessPolicy } from '../policies/task-access.policy';
import { Role } from 'src/common';
import { successResponse } from '../../utilies/response';
import { handlePrismaError } from 'utilies/error-handler';
import {
  calculateSkip,
  createPaginatedResult,
  normalizePaginationParams,
} from '../common/helpers/pagination.helper';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private taskAccessPolicy: TaskAccessPolicy,
  ) {}

  async create(createTaskDto: CreateTaskDto) {
    try {
      // First, verify the attendance record exists and get the user info
      const attendanceRecord = await this.prisma.attendanceRecord.findUnique({
        where: { id: createTaskDto.attendanceRecordId },
        include: { user: true },
      });

      if (!attendanceRecord) {
        throw new NotFoundException('Attendance record not found');
      }

      // Check if user can create tasks for this attendance record
      await this.taskAccessPolicy.canCreate(
        attendanceRecord.user,
        attendanceRecord.userId,
      );

      const task = await this.prisma.task.create({
        data: {
          date: new Date(createTaskDto.date),
          title: createTaskDto.title,
          description: createTaskDto.description,
          duration: createTaskDto.duration,
        },
      });

      // Create the relationship in the junction table
      await this.prisma.attendanceTask.create({
        data: {
          taskId: task.id,
          attendanceRecordId: createTaskDto.attendanceRecordId,
        },
      });

      // Return task with attendance record info
      const taskWithRelations = await this.prisma.task.findUnique({
        where: { id: task.id },
        include: {
          attendanceTasks: {
            include: {
              attendanceRecord: {
                include: { user: true },
              },
            },
          },
        },
      });

      return successResponse(
        taskWithRelations,
        'Task created successfully',
        201,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findByUser(
    currentUser: User,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) {
    try {
      // Normalize pagination parameters
      const { page: normalizedPage, limit: normalizedLimit } =
        normalizePaginationParams(page, limit);

      const where: {
        attendanceTasks?: any;
        date?: {
          gte?: Date;
          lte?: Date;
        };
        title?: {
          contains: string;
        };
      } = {};

      if (currentUser.role === Role.EMPLOYEE) {
        // For employees, find tasks linked to their attendance records
        where.attendanceTasks = {
          some: {
            attendanceRecord: {
              userId: currentUser.id,
            },
          },
        };
      }

      if (currentUser.role === Role.COMPANY_ADMIN) {
        // For company admins, find tasks linked to attendance records of users in their company
        where.attendanceTasks = {
          some: {
            attendanceRecord: {
              user: {
                companyId: currentUser.companyId,
              },
            },
          },
        };
      }

      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = startDate;
        if (endDate) where.date.lte = endDate;
      }

      // Add search functionality by task title
      if (search && search.trim()) {
        where.title = {
          contains: search.trim(),
        };
      }

      // Calculate pagination skip
      const skip = calculateSkip(normalizedPage, normalizedLimit);

      // Get total count for pagination info
      const totalRecords = await this.prisma.task.count({
        where,
      });

      const tasks = await this.prisma.task.findMany({
        where,
        include: {
          attendanceTasks: {
            include: {
              attendanceRecord: {
                include: { user: true },
              },
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        skip,
        take: normalizedLimit,
      });

      // Create paginated result
      const paginatedResult = createPaginatedResult(
        tasks,
        normalizedPage,
        normalizedLimit,
        totalRecords,
      );

      return successResponse(
        {
          tasks: paginatedResult.data,
          pagination: paginatedResult.pagination,
        },
        'Tasks retrieved successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findOne(currentUser: User, id: number) {
    try {
      // Use ensure method which already fetches the task and validates access
      const task = await this.taskAccessPolicy.ensureUserCanAccessTask(
        currentUser,
        id,
      );

      return successResponse(task, 'Task retrieved successfully', 200);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async update(currentUser: User, id: number, updateTaskDto: UpdateTaskDto) {
    try {
      // Use ensure method which already fetches the task and validates access
      await this.taskAccessPolicy.ensureUserCanAccessTask(currentUser, id);

      const updateData: {
        date?: Date;
        title?: string;
        description?: string;
        duration?: number;
      } = {};

      if (updateTaskDto.date) updateData.date = new Date(updateTaskDto.date);
      if (updateTaskDto.title) updateData.title = updateTaskDto.title;
      if (updateTaskDto.description)
        updateData.description = updateTaskDto.description;
      if (updateTaskDto.duration !== undefined)
        updateData.duration = updateTaskDto.duration;

      const task = await this.prisma.task.update({
        where: { id },
        data: updateData,
        include: {
          attendanceTasks: {
            include: {
              attendanceRecord: {
                include: { user: true },
              },
            },
          },
        },
      });

      return successResponse(task, 'Task updated successfully', 200);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async remove(currentUser: User, id: number) {
    try {
      // Use ensure method which already fetches the task and validates access
      await this.taskAccessPolicy.ensureUserCanAccessTask(currentUser, id);

      const task = await this.prisma.task.delete({
        where: { id },
        include: {
          attendanceTasks: {
            include: {
              attendanceRecord: {
                include: { user: true },
              },
            },
          },
        },
      });

      return successResponse(task, 'Task deleted successfully', 200);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findByCompany(
    currentUser: User,
    companyId: number,
    startDate?: Date,
    endDate?: Date,
  ) {
    try {
      this.taskAccessPolicy.canReadCompanyTasks(currentUser, companyId);

      const where: {
        attendanceTasks?: any;
        date?: {
          gte?: Date;
          lte?: Date;
        };
      } = {
        attendanceTasks: {
          some: {
            attendanceRecord: {
              user: {
                companyId,
              },
            },
          },
        },
      };

      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = startDate;
        if (endDate) where.date.lte = endDate;
      }

      const tasks = await this.prisma.task.findMany({
        where,
        include: {
          attendanceTasks: {
            include: {
              attendanceRecord: {
                include: { user: true },
              },
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      });

      return successResponse(
        tasks,
        'Company tasks retrieved successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getTaskStats(userId: number) {
    try {
      const tasks = await this.prisma.task.findMany({
        where: {
          attendanceTasks: {
            some: {
              attendanceRecord: {
                userId,
              },
            },
          },
        },
        select: {
          duration: true,
          date: true,
        },
      });

      const totalTasks = tasks.length;
      const totalHours = tasks.reduce((sum, task) => sum + task.duration, 0);
      const averageHours = totalTasks > 0 ? totalHours / totalTasks : 0;

      // Get this month's tasks
      const thisMonth = new Date();
      thisMonth.setDate(1);

      const thisMonthTasks = tasks.filter((task) => task.date >= thisMonth);
      const thisMonthHours = thisMonthTasks.reduce(
        (sum, task) => sum + task.duration,
        0,
      );

      const stats = {
        totalTasks,
        totalHours: Math.round(totalHours * 100) / 100,
        averageHours: Math.round(averageHours * 100) / 100,
        thisMonthTasks: thisMonthTasks.length,
        thisMonthHours: Math.round(thisMonthHours * 100) / 100,
      };

      return successResponse(
        stats,
        'Task statistics retrieved successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async updateTaskStatus(user: User, id: number, status: string) {
    try {
      // First verify the user can access this task
      const existingTask = await this.taskAccessPolicy.ensureUserCanAccessTask(
        user,
        id,
      );
      if (!existingTask) {
        throw new NotFoundException('Task not found');
      }

      // Note: Since the Task model doesn't have a status field in the current schema,
      // we'll update the title to include status for now
      const updatedTask = await this.prisma.task.update({
        where: { id },
        data: {
          title: `[${status.toUpperCase()}] ${existingTask.title.replace(/^\[(PENDING|IN_PROGRESS|COMPLETED)\]\s*/, '')}`,
        },
        include: {
          attendanceTasks: {
            include: {
              attendanceRecord: {
                include: { user: true },
              },
            },
          },
        },
      });

      return successResponse(
        updatedTask,
        'Task status updated successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }
}
