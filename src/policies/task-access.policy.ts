import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { Task, User } from '@prisma/client';
import { Role } from '../common/enums/role.enum';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaskAccessPolicy {
  constructor(private prisma: PrismaService) {}

  async ensureUserCanAccessTask(user: User, taskId: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        user: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (user.role === Role.SUPER_ADMIN) {
      return task;
    }

    if (user.role === Role.EMPLOYEE && user.id === taskId) {
      return task;
    }

    if (user.role === Role.COMPANY_ADMIN) {
      if (user.companyId !== task.user.companyId) {
        throw new ForbiddenException('Access denied: user not in your company');
      }
      return task;
    }

    throw new ForbiddenException('Access denied to read this task');
  }

  async canCreate(user: User, userId: string): Promise<void> {
    if (user.role === Role.SUPER_ADMIN) {
      return; // Super admin can create tasks for anyone
    }

    if (user.role === Role.EMPLOYEE && user.id === userId) {
      return; // Employee can create their own tasks
    }

    if (user.role === Role.COMPANY_ADMIN) {
      // Company admin can create tasks for employees in their company
      const targetUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      if (!targetUser || targetUser.companyId !== user.companyId) {
        throw new ForbiddenException('Access denied: user not in your company');
      }
      return;
    }

    throw new ForbiddenException('Access denied to create this task');
  }

  async canRead(user: User, taskId: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        user: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (user.role === Role.SUPER_ADMIN) {
      return task;
    }

    if (user.role === Role.EMPLOYEE && user.id === taskId) {
      return task;
    }

    if (user.role === Role.COMPANY_ADMIN) {
      if (user.companyId !== task.user.companyId) {
        throw new ForbiddenException('Access denied: user not in your company');
      }
      return task;
    }

    throw new ForbiddenException('Access denied to read this task');
  }

  async canUpdate(user: User, userId: string): Promise<void> {
    if (user.role === Role.SUPER_ADMIN) {
      return; // Super admin can update all tasks
    }

    if (user.role === Role.EMPLOYEE && user.id === userId) {
      return; // Employee can update their own tasks
    }

    if (user.role === Role.COMPANY_ADMIN) {
      // Company admin can update employees' tasks in their company
      const targetUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      if (!targetUser || targetUser.companyId !== user.companyId) {
        throw new ForbiddenException('Access denied: user not in your company');
      }
      return;
    }

    throw new ForbiddenException('Access denied to update this task');
  }

  async canDelete(user: User, userId: string): Promise<void> {
    if (user.role === Role.SUPER_ADMIN) {
      return; // Super admin can delete all tasks
    }

    if (user.role === Role.EMPLOYEE && user.id === userId) {
      return; // Employee can delete their own tasks
    }

    if (user.role === Role.COMPANY_ADMIN) {
      // Company admin can delete employees' tasks in their company
      const targetUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      if (!targetUser || targetUser.companyId !== user.companyId) {
        throw new ForbiddenException('Access denied: user not in your company');
      }
      return;
    }

    throw new ForbiddenException('Access denied to delete this task');
  }

  canReadCompanyTasks(user: User, companyId: string): void {
    if (user.role === Role.SUPER_ADMIN) {
      return; // Super admin can read all company tasks
    }

    if (user.role === Role.COMPANY_ADMIN && user.companyId === companyId) {
      return; // Company admin can read their company's tasks
    }

    throw new ForbiddenException('Access denied to read company tasks');
  }
}
