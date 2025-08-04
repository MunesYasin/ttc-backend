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
      const task = await this.prisma.task.create({
        data: {
          userId: createTaskDto.userId,
          date: new Date(createTaskDto.date),
          title: createTaskDto.title,
          description: createTaskDto.description,
          duration: createTaskDto.duration,
        },
        include: {
          user: true,
        },
      });

      return successResponse(task, 'Task created successfully', 201);
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
  ) {
    try {
      // Normalize pagination parameters
      const { page: normalizedPage, limit: normalizedLimit } =
        normalizePaginationParams(page, limit);

      const where: any = {};

      if (currentUser.role === Role.EMPLOYEE) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        where.userId = currentUser.id;
      }

      if (currentUser.role === Role.COMPANY_ADMIN) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        where.user = {
          companyId: currentUser.companyId,
        };
      }
      if (startDate || endDate) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        where.date = {};
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (startDate) where.date.gte = startDate;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (endDate) where.date.lte = endDate;
      }

      // Calculate pagination skip
      const skip = calculateSkip(normalizedPage, normalizedLimit);

      // Get total count for pagination info
      const totalRecords = await this.prisma.task.count({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where,
      });

      const tasks = await this.prisma.task.findMany({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where,
        include: {
          user: true,
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

      const updateData: any = {};
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (updateTaskDto.date) updateData.date = new Date(updateTaskDto.date);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (updateTaskDto.title) updateData.title = updateTaskDto.title;
      if (updateTaskDto.description)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        updateData.description = updateTaskDto.description;
      if (updateTaskDto.duration !== undefined)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        updateData.duration = updateTaskDto.duration;

      const task = await this.prisma.task.update({
        where: { id },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: updateData,
        include: {
          user: true,
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
          user: true,
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

      const where: any = {
        user: {
          companyId,
        },
      };

      if (startDate || endDate) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        where.date = {};
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (startDate) where.date.gte = startDate;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (endDate) where.date.lte = endDate;
      }

      const tasks = await this.prisma.task.findMany({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where,
        include: {
          user: true,
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
        where: { userId },
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
          user: true,
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
