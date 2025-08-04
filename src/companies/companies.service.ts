import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
import type { User } from '@prisma/client';
import { CompanyAccessPolicy } from '../policies/company-access.policy';
import { successResponse } from '../../utilies/response';
import { handlePrismaError } from 'utilies/error-handler';

@Injectable()
export class CompaniesService {
  constructor(
    private prisma: PrismaService,
    private companyAccessPolicy: CompanyAccessPolicy,
  ) {}

  async create(createCompanyDto: CreateCompanyDto) {
    try {
      const company = await this.prisma.company.create({
        data: createCompanyDto,
      });

      return successResponse(company, 'Company created successfully', 201);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll() {
    try {
      const companies = await this.prisma.company.findMany({
        include: {
          users: true,
          _count: {
            select: {
              users: true,
              reports: true,
            },
          },
        },
      });

      return successResponse(
        companies,
        'Companies retrieved successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findOne(id: number, user: User) {
    try {
      // Use ensure method which already fetches and validates access
      const company = await this.companyAccessPolicy.ensureUserCanAccessCompany(
        user,
        id,
      );

      return successResponse(company, 'Company retrieved successfully', 200);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getMyCompany(user: User) {
    try {
      if (!user.companyId) {
        throw new Error('User is not associated with any company');
      }

      // Get company details with employee count
      const company = await this.prisma.company.findUnique({
        where: {
          id: user.companyId,
        },
        include: {
          users: {
            where: {
              role: 'EMPLOYEE',
            },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              users: {
                where: {
                  role: 'EMPLOYEE',
                },
              },
              reports: true,
            },
          },
        },
      });

      if (!company) {
        throw new Error('Company not found');
      }

      const companyDetails = {
        id: company.id,
        name: company.name,
        industry: company.industry,
        logoUrl: company.logoUrl,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
        totalEmployees: company._count.users,
        totalReports: company._count.reports,
        statistics: {
          employeeCount: company._count.users,
          reportsGenerated: company._count.reports,
          companyAge: Math.floor(
            (new Date().getTime() - company.createdAt.getTime()) /
              (1000 * 60 * 60 * 24),
          ), // days since creation
        },
      };

      return successResponse(
        companyDetails,
        'Company details retrieved successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async update(id: number, updateCompanyDto: UpdateCompanyDto, user: User) {
    try {
      // Use ensure method which already validates access and fetches company
      this.companyAccessPolicy.ensureUserCanManageCompany(user, id);

      const company = await this.prisma.company.update({
        where: { id },
        data: updateCompanyDto,
        include: {
          users: true,
        },
      });

      return successResponse(company, 'Company updated successfully', 200);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async remove(id: number, user: User) {
    try {
      await this.companyAccessPolicy.ensureUserCanAccessCompany(user, id);

      const company = await this.prisma.company.delete({
        where: { id },
      });

      return successResponse(company, 'Company deleted successfully', 200);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async generateDailyReport(companyId: number, date: Date, user: User) {
    try {
      // Use ensure method which already validates access and fetches company
      await this.companyAccessPolicy.ensureUserCanAccessCompany(
        user,
        companyId,
      );

      const startOfDay = new Date(date);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const attendanceRecords = await this.prisma.attendanceRecord.findMany({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          user: {
            companyId,
          },
        },
        include: {
          user: true,
        },
      });

      const tasks = await this.prisma.task.findMany({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          user: {
            companyId,
          },
        },
        include: {
          user: true,
        },
      });

      const reportData = {
        date: date.toISOString().split('T')[0],
        totalEmployees: attendanceRecords.length,
        totalTasksCompleted: tasks.length,
        totalHoursWorked: tasks.reduce((sum, task) => sum + task.duration, 0),
        attendanceRecords: attendanceRecords.map((record) => ({
          employeeName: record.user.name,
          clockIn: record.clockInAt,
          clockOut: record.clockOutAt,
          note: record.note,
        })),
        tasks: tasks.map((task) => ({
          employeeName: task.user.name,
          title: task.title,
          description: task.description,
          duration: task.duration,
        })),
      };

      // Save the report
      await this.prisma.dailyReport.upsert({
        where: {
          companyId_date: {
            companyId,
            date: startOfDay,
          },
        },
        update: {
          data: reportData,
        },
        create: {
          companyId,
          date: startOfDay,
          data: reportData,
        },
      });

      return successResponse(
        reportData,
        'Daily report generated successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }
}
