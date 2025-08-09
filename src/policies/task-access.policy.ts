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

  async ensureUserCanAccessTask(user: User, taskId: number): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
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

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (user.role === Role.SUPER_ADMIN) {
      return task;
    }

    // Check if the user has access to any of the attendance records linked to this task
    const hasAccess = task.attendanceTasks.some((attendanceTask) => {
      const attendanceUser = attendanceTask.attendanceRecord.user;
      
      if (user.role === Role.EMPLOYEE) {
        return attendanceUser.id === user.id;
      }
      
      if (user.role === Role.COMPANY_ADMIN) {
        return attendanceUser.companyId === user.companyId;
      }
      
      return false;
    });

    if (!hasAccess) {
      throw new ForbiddenException('Access denied to read this task');
    }

    return task;
  }

  async canCreate(user: User, userId: number): Promise<void> {
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

  async canRead(user: User, taskId: number): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
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

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (user.role === Role.SUPER_ADMIN) {
      return task;
    }

    // Check if the user has access to any of the attendance records linked to this task
    const hasAccess = task.attendanceTasks.some((attendanceTask) => {
      const attendanceUser = attendanceTask.attendanceRecord.user;
      
      if (user.role === Role.EMPLOYEE) {
        return attendanceUser.id === user.id;
      }
      
      if (user.role === Role.COMPANY_ADMIN) {
        return attendanceUser.companyId === user.companyId;
      }
      
      return false;
    });

    if (!hasAccess) {
      throw new ForbiddenException('Access denied to read this task');
    }

    return task;
  }

  async canUpdate(user: User, userId: number): Promise<void> {
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

  async canDelete(user: User, userId: number): Promise<void> {
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

  canReadCompanyTasks(user: User, companyId: number): void {
    if (user.role === Role.SUPER_ADMIN) {
      return; // Super admin can read all company tasks
    }

    if (user.role === Role.COMPANY_ADMIN && user.companyId === companyId) {
      return; // Company admin can read their company's tasks
    }

    throw new ForbiddenException('Access denied to read company tasks');
  }
}
