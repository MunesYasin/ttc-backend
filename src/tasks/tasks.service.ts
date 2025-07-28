import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import type { User, Task } from '@prisma/client';
import { TaskAccessPolicy } from '../policies/task-access.policy';
import { Role } from 'src/common';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private taskAccessPolicy: TaskAccessPolicy,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    return this.prisma.task.create({
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
  }

  async findByUser(
    currentUser: User,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Task[]> {
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

    return this.prisma.task.findMany({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where,
      include: {
        user: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async findOne(currentUser: User, id: string): Promise<Task> {
    // Use ensure method which already fetches the task and validates access
    return await this.taskAccessPolicy.ensureUserCanAccessTask(currentUser, id);
  }

  async update(
    currentUser: User,
    id: string,
    updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
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

    return this.prisma.task.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: updateData,
      include: {
        user: true,
      },
    });
  }

  async remove(currentUser: User, id: string): Promise<Task> {
    // Use ensure method which already fetches the task and validates access
    await this.taskAccessPolicy.ensureUserCanAccessTask(currentUser, id);

    return this.prisma.task.delete({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  async findByCompany(
    currentUser: User,
    companyId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Task[]> {
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

    return this.prisma.task.findMany({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where,
      include: {
        user: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }
}
