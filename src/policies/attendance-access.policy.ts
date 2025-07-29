import { Injectable, ForbiddenException } from '@nestjs/common';
import type { AttendanceRecord, User } from '@prisma/client';
import { Role } from '../common/enums/role.enum';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceAccessPolicy {
  constructor(private prisma: PrismaService) {}

  async ensureUserCanAccessAttendance(
    user: User,
    attendenceId: number,
  ): Promise<AttendanceRecord | null> {
    const attendce = await this.prisma.attendanceRecord.findUnique({
      where: { id: attendenceId },
    });

    if (!attendce) {
      throw new ForbiddenException('Attendance record not found');
    }

    if (user.role === Role.SUPER_ADMIN) {
      return attendce; // Super admin can access all attendance records
    }

    if (user.role === Role.EMPLOYEE && user.id === attendce?.userId) {
      return attendce; // Employee can access their own attendance
    }

    if (user.role === Role.COMPANY_ADMIN) {
      // Need to fetch user to check company
      const attendanceUser = await this.prisma.user.findUnique({
        where: { id: attendce.userId },
      });
      if (attendanceUser?.companyId !== user.companyId) {
        throw new ForbiddenException('Access denied: user not in your company');
      }
      return attendce;
    }

    throw new ForbiddenException('Access denied to this attendance record');
  }

  async canCreate(user: User, userId: number): Promise<void> {
    if (user.role === Role.SUPER_ADMIN) {
      return; // Super admin can create attendance for anyone
    }

    if (user.role === Role.EMPLOYEE && user.id === userId) {
      return; // Employee can create their own attendance
    }

    if (user.role === Role.COMPANY_ADMIN) {
      // Validate that the user belongs to the same company
      const targetUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!targetUser) {
        throw new ForbiddenException('User not found');
      }

      if (targetUser.companyId !== user.companyId) {
        throw new ForbiddenException(
          'Cannot create attendance for user outside your company',
        );
      }
      return;
    }

    throw new ForbiddenException(
      'Access denied: insufficient permissions to create attendance',
    );
  }

  async canRead(user: User, userId: number): Promise<void> {
    if (user.role === Role.SUPER_ADMIN) {
      return; // Super admin can read attendance for anyone
    }

    if (user.role === Role.EMPLOYEE && user.id === userId) {
      return; // Employee can read their own attendance
    }

    if (user.role === Role.COMPANY_ADMIN) {
      // Validate that the user belongs to the same company
      const targetUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!targetUser) {
        throw new ForbiddenException('User not found');
      }

      if (targetUser.companyId !== user.companyId) {
        throw new ForbiddenException(
          'Cannot read attendance for user outside your company',
        );
      }
      return;
    }

    throw new ForbiddenException(
      'Access denied: insufficient permissions to read attendance',
    );
  }

  async canUpdate(user: User, userId: number): Promise<void> {
    if (user.role === Role.SUPER_ADMIN) {
      return; // Super admin can update attendance for anyone
    }

    if (user.role === Role.EMPLOYEE && user.id === userId) {
      return; // Employee can update their own attendance
    }

    if (user.role === Role.COMPANY_ADMIN) {
      // Validate that the user belongs to the same company
      const targetUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!targetUser) {
        throw new ForbiddenException('User not found');
      }

      if (targetUser.companyId !== user.companyId) {
        throw new ForbiddenException(
          'Cannot update attendance for user outside your company',
        );
      }
      return;
    }

    throw new ForbiddenException(
      'Access denied: insufficient permissions to update attendance',
    );
  }

  async canDelete(user: User, userId: number): Promise<void> {
    if (user.role === Role.SUPER_ADMIN) {
      return; // Super admin can delete attendance for anyone
    }

    // Company admins can delete attendance records in their company
    if (user.role === Role.COMPANY_ADMIN) {
      // Validate that the user belongs to the same company
      const targetUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!targetUser) {
        throw new ForbiddenException('User not found');
      }

      if (targetUser.companyId !== user.companyId) {
        throw new ForbiddenException(
          'Cannot delete attendance for user outside your company',
        );
      }
      return;
    }

    throw new ForbiddenException(
      'Access denied: insufficient permissions to delete attendance',
    );
  }

  canAccessCompanyData(user: User, companyId: number): void {
    if (user.role === Role.SUPER_ADMIN) {
      return; // Super admin can access all company data
    }

    if (user.role === Role.COMPANY_ADMIN && user.companyId === companyId) {
      return; // Company admin can access their own company data
    }

    throw new ForbiddenException(
      'Access denied: insufficient permissions to access company data',
    );
  }
}
