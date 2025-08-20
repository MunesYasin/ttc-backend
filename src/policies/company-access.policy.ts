import { Injectable, ForbiddenException } from '@nestjs/common';
import type { Company, User } from '@prisma/client';
import { Role } from '../common/enums/role.enum';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompanyAccessPolicy {
  constructor(private prisma: PrismaService) {}

  async ensureUserCanAccessCompany(
    user: User,
    companyId: number,
  ): Promise<Company | null> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        users: true,
        parentCompany: true,
        subcompanies: true,
      },
    });

    if (!company) {
      throw new ForbiddenException('Company not found');
    }

    if (user.role === Role.SUPER_ADMIN) {
      return company; // Super admin can access all companies
    }

    if (user.role === Role.COMPANY_ADMIN && user.companyId === company?.id) {
      return company; // Company admin can access their own company
    }

    // Check if user is admin of parent company and can access subcompanies
    if (
      user.role === Role.COMPANY_ADMIN &&
      company.parentCompanyId === user.companyId
    ) {
      return company; // Parent company admin can access subcompanies
    }

    throw new ForbiddenException('Access denied to this company');
  }

  ensureUserCanManageCompany(user: User, companyId: number): void {
    if (user.role === Role.SUPER_ADMIN) {
      return; // Super admin can manage all companies
    }

    if (user.role === Role.COMPANY_ADMIN && user.companyId === companyId) {
      return; // Company admin can manage their own company
    }

    throw new ForbiddenException('Access denied to manage this company');
  }

  canCreate(user: User): void {
    if (user.role === Role.SUPER_ADMIN) {
      return; // Super admin can create companies
    }

    throw new ForbiddenException('Access denied to create companies');
  }

  canRead(user: User, companyId: number): void {
    if (user.role === Role.SUPER_ADMIN) {
      return; // Super admin can read all companies
    }

    if (user.role === Role.COMPANY_ADMIN && user.companyId === companyId) {
      return; // Company admin can read their own company
    }

    throw new ForbiddenException('Access denied to read this company');
  }

  canUpdate(user: User, companyId: number): void {
    if (user.role === Role.SUPER_ADMIN) {
      return; // Super admin can update all companies
    }

    if (user.role === Role.COMPANY_ADMIN && user.companyId === companyId) {
      return; // Company admin can update their own company
    }

    throw new ForbiddenException('Access denied to update this company');
  }

  canDelete(user: User): void {
    if (user.role === Role.SUPER_ADMIN) {
      return; // Super admin can delete any company
    }

    throw new ForbiddenException('Access denied to delete companies');
  }

  canGenerateReport(user: User, companyId: number): void {
    if (user.role === Role.SUPER_ADMIN) {
      return; // Super admin can generate reports for any company
    }

    if (user.role === Role.COMPANY_ADMIN && user.companyId === companyId) {
      return; // Company admin can generate reports for their own company
    }

    throw new ForbiddenException('Access denied to generate company reports');
  }

  getAccessibleCompaniesFilter(user: User): any {
    if (user.role === Role.SUPER_ADMIN) {
      // Super admin can see all companies - no filter needed
      return {};
    } else if (user.role === Role.COMPANY_ADMIN) {
      // Company admin can see their own company and its subcompanies
      return {
        OR: [
          { id: user.companyId }, // Their own company
          { parentCompanyId: user.companyId }, // Their subcompanies
        ],
      };
    } else {
      // Employees can only see their own company
      return { id: user.companyId };
    }
  }

  getAccessibleEmployeesFilter(user: User): any {
    if (user.role === Role.SUPER_ADMIN) {
      // Super admin can see all employees - no filter needed
      return {};
    } else if (user.role === Role.COMPANY_ADMIN) {
      // Company admin can see employees from their own company and subcompanies
      return {
        OR: [
          { companyId: user.companyId }, // Their own company employees
          {
            company: {
              parentCompanyId: user.companyId,
            },
          }, // Subcompany employees
        ],
      };
    } else {
      // Employees can only see employees from their own company
      return { companyId: user.companyId };
    }
  }

  getTargetCompanyIdForSubcompanies(
    user: User,
    parentCompanyId?: number,
  ): number {
    if (user.role === Role.SUPER_ADMIN) {
      if (!parentCompanyId) {
        throw new Error('Super admin must specify parentCompanyId parameter');
      }
      return parentCompanyId;
    } else if (user.role === Role.COMPANY_ADMIN) {
      // Company admin gets subcompanies of their own company
      if (!user.companyId) {
        throw new Error('User is not associated with any company');
      }
      return user.companyId;
    } else {
      throw new ForbiddenException('Access denied to view subcompanies');
    }
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
