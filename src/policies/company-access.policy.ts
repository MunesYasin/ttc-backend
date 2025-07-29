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
}
