import { Injectable, ForbiddenException } from '@nestjs/common';
import type { AttendanceRecord, User } from '@prisma/client';
import { Role } from '../common/enums/role.enum';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceAccessPolicy {
  constructor(private prisma: PrismaService) {}

  async ensureUserCanAccessAttendance(
    user: User,
    attendenceId: string,
  ): Promise<AttendanceRecord | null> {
    const attendce = await this.prisma.attendanceRecord.findUnique({
      where: { id: attendenceId },
      include: { user: true },
    });

    if (!attendce) {
      throw new ForbiddenException('Attendance record not found');
    }

    if (user.role === Role.SUPER_ADMIN) {
      return attendce; // Super admin can access all attendance records
    }

    if (user.role === Role.EMPLOYEE && user.id === attendce?.user.id) {
      return attendce; // Employee can access their own attendance
    }

    if (user.role === Role.COMPANY_ADMIN) {
      if (attendce?.user.companyId !== user.companyId) {
        throw new ForbiddenException('Access denied: user not in your company');
      }
      return attendce;
    }

    throw new ForbiddenException('Access denied to this attendance record');
  }

  async canCreate(user: User, userId: string): Promise<void> {
    if (user.role === Role.SUPER_ADMIN) {
      return; // Super admin can create attendance for anyone
    }

    if (user.role === Role.EMPLOYEE && user.id === userId) {
      return; // Employee can create their own attendance
    }

    if (user.role === Role.COMPANY_ADMIN) {
      // Company admin can create attendance for employees in their company
      const targetUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      if (!targetUser || targetUser.companyId !== user.companyId) {
        throw new ForbiddenException('Access denied: user not in your company');
      }
      return;
    }

    throw new ForbiddenException(
      'Access denied to create this attendance record',
    );
  }

  async canRead(user: User, userId: string): Promise<void> {
    if (user.role === Role.SUPER_ADMIN) {
      return; // Super admin can read all attendance
    }

    if (user.role === Role.EMPLOYEE && user.id === userId) {
      return; // Employee can read their own attendance
    }

    if (user.role === Role.COMPANY_ADMIN) {
      // Company admin can read employees' attendance in their company
      const targetUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      if (!targetUser || targetUser.companyId !== user.companyId) {
        throw new ForbiddenException('Access denied: user not in your company');
      }
      return;
    }

    throw new ForbiddenException(
      'Access denied to read this attendance record',
    );
  }

  async canUpdate(user: User, userId: string): Promise<void> {
    if (user.role === Role.SUPER_ADMIN) {
      return; // Super admin can update all attendance
    }

    if (user.role === Role.EMPLOYEE && user.id === userId) {
      return; // Employee can update their own attendance
    }

    if (user.role === Role.COMPANY_ADMIN) {
      // Company admin can update employees' attendance in their company
      const targetUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      if (!targetUser || targetUser.companyId !== user.companyId) {
        throw new ForbiddenException('Access denied: user not in your company');
      }
      return;
    }

    throw new ForbiddenException(
      'Access denied to update this attendance record',
    );
  }

  async canDelete(user: User, userId: string): Promise<void> {
    if (user.role === Role.SUPER_ADMIN) {
      return; // Super admin can delete all attendance
    }

    if (user.role === Role.COMPANY_ADMIN) {
      // Company admin can delete employees' attendance in their company
      const targetUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      if (!targetUser || targetUser.companyId !== user.companyId) {
        throw new ForbiddenException('Access denied: user not in your company');
      }
      return;
    }

    throw new ForbiddenException(
      'Access denied to delete this attendance record',
    );
  }

  canReadCompanyAttendance(user: User, companyId: string): void {
    if (user.role === Role.SUPER_ADMIN) {
      return; // Super admin can read all company attendance
    }

    if (user.role === Role.COMPANY_ADMIN && user.companyId === companyId) {
      return; // Company admin can read their company's attendance
    }

    throw new ForbiddenException('Access denied to read company attendance');
  }
}
