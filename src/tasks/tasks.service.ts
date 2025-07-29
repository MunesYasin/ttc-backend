import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import type { User } from '@prisma/client';
import { TaskAccessPolicy } from '../policies/task-access.policy';
import { Role } from 'src/common';
import { successResponse } from '../../utilies/response';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private taskAccessPolicy: TaskAccessPolicy,
  ) {}

  async create(createTaskDto: CreateTaskDto) {
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
  }

  async findByUser(currentUser: User, startDate?: Date, endDate?: Date) {
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
  }

  async findOne(currentUser: User, id: number) {
    // Use ensure method which already fetches the task and validates access
    const task = await this.taskAccessPolicy.ensureUserCanAccessTask(
      currentUser,
      id,
    );

    return successResponse(task, 'Task retrieved successfully', 200);
  }

  async update(currentUser: User, id: number, updateTaskDto: UpdateTaskDto) {
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
  }

  async remove(currentUser: User, id: number) {
    // Use ensure method which already fetches the task and validates access
    await this.taskAccessPolicy.ensureUserCanAccessTask(currentUser, id);

    const task = await this.prisma.task.delete({
      where: { id },
      include: {
        user: true,
      },
    });

    return successResponse(task, 'Task deleted successfully', 200);
  }

  async findByCompany(
    currentUser: User,
    companyId: number,
    startDate?: Date,
    endDate?: Date,
  ) {
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

    return successResponse(tasks, 'Company tasks retrieved successfully', 200);
  }
}
