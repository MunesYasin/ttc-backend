import { Injectable, ForbiddenException } from '@nestjs/common';
import { User } from '@prisma/client';
import { Role } from '../common/enums/role.enum';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EmployeeAccessPolicy {
  constructor(private prisma: PrismaService) {}

  async ensureUserCanAccessEmployee(
    user: User,
    employeeId: string,
  ): Promise<User | null> {
    const userByID = await this.prisma.user.findUnique({
      where: { id: employeeId },
    });

    if (!userByID) {
      throw new ForbiddenException('Employee not found');
    }

    if (user.role === Role.SUPER_ADMIN) {
      return userByID; // Super admin can access all employees
    }

    if (user.role === Role.EMPLOYEE && user.id === employeeId) {
      return userByID; // Employee can access their own data
    }

    if (user.role === Role.COMPANY_ADMIN) {
      if (userByID.companyId !== user.companyId) {
        throw new ForbiddenException(
          'Access denied: employee not in your company',
        );
      }
      // Company admin can access employees in their company
      // This should be checked with the employee's company in the service
      return userByID;
    }

    throw new ForbiddenException('Access denied to this employee');
  }
}
