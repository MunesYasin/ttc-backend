import { Injectable, ForbiddenException } from '@nestjs/common';
import { User } from '@prisma/client';
import { Role } from '../common/enums/role.enum';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EmployeeAccessPolicy {
  constructor(private prisma: PrismaService) {}

  async ensureUserCanAccessEmployee(
    user: User,
    employeeId: number,
  ): Promise<User | null> {
    const userByID = await this.prisma.user.findUnique({
      where: { id: employeeId },
      include: { company: { select: { id: true, name: true } } }, // Include company to check access
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
      // Use the new method to check if user can access this employee's company
      const accessibleCompanyIds = await this.getAccessibleCompanyIds(user);
      if (
        !accessibleCompanyIds ||
        !accessibleCompanyIds.includes(userByID.companyId)
      ) {
        throw new ForbiddenException(
          'Access denied: employee not in your accessible companies',
        );
      }
      return userByID;
    }

    throw new ForbiddenException('Access denied to this employee');
  }

  async getAccessibleCompanyIds(user: User): Promise<number[] | undefined> {
    if (user.role === Role.SUPER_ADMIN) {
      // Super admin can access all companies - return undefined for no filter
      return undefined;
    } else if (user.role === Role.COMPANY_ADMIN) {
      // Company admin can access their own company and all subcompanies
      if (!user.companyId) {
        throw new Error('User is not associated with any company');
      }

      // Get all subcompanies where this company is the parent
      const subcompanies = await this.prisma.company.findMany({
        where: {
          parentCompanyId: user.companyId,
        },
        select: {
          id: true,
        },
      });

      // Return array of accessible company IDs (own company + all subcompanies)
      const subcompanyIds = subcompanies.map((sub) => sub.id);
      return [user.companyId, ...subcompanyIds];
    } else {
      // Employees can only access their own company
      return user.companyId ? [user.companyId] : [];
    }
  }
}
