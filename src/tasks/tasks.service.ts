import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import type { User } from '@prisma/client';
import { TaskAccessPolicy } from '../policies/task-access.policy';
import { Role } from 'src/common';
import { successResponse } from '../../utilies/response';
import { handlePrismaError } from 'utilies/error-handler';

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

  async findByUser(currentUser: User, startDate?: Date, endDate?: Date) {
    try {
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

      return successResponse(tasks, 'Tasks retrieved successfully', 200);
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
}
