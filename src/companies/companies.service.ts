import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
import type { User } from '@prisma/client';
import { Role } from '../common/enums/role.enum';
import { CompanyAccessPolicy } from '../policies/company-access.policy';
import { successResponse } from '../../utilies/response';
import { handlePrismaError } from 'utilies/error-handler';
import {
  normalizePaginationParams,
  calculateSkip,
  createPaginatedResult,
} from '../common/helpers/pagination.helper';
import { calculateDateRanges } from '../common/helpers/date.helper';

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

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    try {
      // Normalize pagination parameters
      const { page: normalizedPage, limit: normalizedLimit } =
        normalizePaginationParams(page, limit);
      const skip = calculateSkip(normalizedPage, normalizedLimit);

      // Build where condition with search
      const whereCondition: {
        name?: {
          contains: string;
        };
      } = {};

      // Add search condition if search term is provided
      if (search && search.trim()) {
        whereCondition.name = {
          contains: search.trim(),
        };
      }

      // Get total count of companies (with search filter)
      const totalCompanies = await this.prisma.company.count({
        where: whereCondition,
      });

      // Get total employees across all companies
      const totalEmployees = await this.prisma.user.count();

      // Get paginated companies (with search filter)
      const companies = await this.prisma.company.findMany({
        where: whereCondition,
        include: {
          // users: {
          //   select: {
          //     id: true,
          //     name: true,
          //     email: true,
          //     role: true,
          //     createdAt: true,
          //   },
          // },
          _count: {
            select: {
              users: true,
              reports: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
        skip: skip,
        take: normalizedLimit,
      });

      // Create paginated result
      const paginatedResult = createPaginatedResult(
        companies,
        normalizedPage,
        normalizedLimit,
        totalCompanies,
      );

      // Calculate average employees per company
      const avgEmployeesPerCompany =
        totalCompanies > 0
          ? Math.round((totalEmployees / totalCompanies) * 100) / 100
          : 0;

      const companiesData = {
        totalCompanies: totalCompanies,
        totalEmployees: totalEmployees,
        avgEmployeesPerCompany: avgEmployeesPerCompany,
        companies: paginatedResult.data,
        pagination: paginatedResult.pagination,
      };

      return successResponse(
        companiesData,
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
        location: company.location,
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

  async getMyCompanyEmployees(
    user: User,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) {
    try {
      // Validate that user is a company admin
      if (!user.companyId) {
        throw new Error('User is not associated with any company');
      }

      // Normalize pagination parameters
      const { page: normalizedPage, limit: normalizedLimit } =
        normalizePaginationParams(page, limit);
      const skip = calculateSkip(normalizedPage, normalizedLimit);

      // Build where condition with search
      const whereCondition: {
        companyId: number;
        name?: {
          contains: string;
        };
      } = {
        companyId: user.companyId,
      };

      // Add search condition if search term is provided
      if (search && search.trim()) {
        whereCondition.name = {
          contains: search.trim(),
        };
      }

      // Get total count of employees (with search filter)
      const totalEmployees = await this.prisma.user.count({
        where: whereCondition,
      });

      // Get counts by role for this company
      const [companyAdminCount, employeeCount] = await Promise.all([
        this.prisma.user.count({
          where: {
            companyId: user.companyId,
            role: Role.COMPANY_ADMIN,
          },
        }),
        this.prisma.user.count({
          where: {
            companyId: user.companyId,
            role: Role.EMPLOYEE,
          },
        }),
      ]);

      // Get paginated employees from the same company (with search filter)
      const employees = await this.prisma.user.findMany({
        where: whereCondition,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          // Exclude sensitive information like password
        },
        orderBy: {
          name: 'asc',
        },
        skip: skip,
        take: normalizedLimit,
      });

      // Create paginated result
      const paginatedResult = createPaginatedResult(
        employees,
        normalizedPage,
        normalizedLimit,
        totalEmployees,
      );

      const employeeData = {
        companyId: user.companyId,
        totalEmployees: totalEmployees,
        companyAdminCount: companyAdminCount,
        employeeCount: employeeCount,
        employees: paginatedResult.data,
        pagination: paginatedResult.pagination,
      };

      return successResponse(
        employeeData,
        'Company employees retrieved successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getMyCompanyUserReports(
    user: User,
    page: number = 1,
    filterType?: string,
    filterValue?: string,
    search?: string,
    companyId?: number,
  ) {
    try {
      let targetCompanyId: number;

      // Determine which company to get reports for
      if (user.role === Role.SUPER_ADMIN) {
        if (!companyId) {
          throw new ForbiddenException(
            'Super admin must specify companyId parameter',
          );
        }
        targetCompanyId = companyId;
      } else if (user.role === Role.COMPANY_ADMIN) {
        // Company admin should not provide companyId, they use their own company
        if (companyId) {
          throw new ForbiddenException(
            'Company admin should not specify companyId parameter',
          );
        }
        if (!user.companyId) {
          throw new Error('User is not associated with any company');
        }
        targetCompanyId = user.companyId;
      } else {
        throw new ForbiddenException(
          'Only company admins and super admins can access user reports',
        );
      }

      // Normalize pagination parameters
      const { page: normalizedPage, limit: normalizedLimit } =
        normalizePaginationParams(page, 10); // Default limit of 10 for reports
      const skip = calculateSkip(normalizedPage, normalizedLimit);

      const userWhereCondition: {
        companyId: number;
        name?: {
          contains: string;
        };
      } = {
        companyId: targetCompanyId,
      };

      // Add search condition if search term is provided
      if (search && search.trim()) {
        userWhereCondition.name = {
          contains: search.trim(),
        };
      }

      // Get total count of users matching criteria
      const totalUsers = await this.prisma.user.count({
        where: userWhereCondition,
      });

      // Calculate date range based on filter
      const dateRanges = calculateDateRanges(filterType, filterValue);
      const { currentPeriodStart, currentPeriodEnd } = dateRanges;

      // Get users and their attendance records
      const users = await this.prisma.user.findMany({
        where: userWhereCondition,
        include: {
          attendances: {
            where: {
              date: {
                gte: currentPeriodStart,
                lte: currentPeriodEnd,
              },
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
        skip: skip,
        take: normalizedLimit,
      });

      // Calculate report data for each user by fetching tasks separately
      const reports = await Promise.all(
        users.map(async (userData) => {
          // Get tasks for this user in the period
          const tasks = await this.prisma.task.findMany({
            where: {
              attendanceTasks: {
                some: {
                  attendanceRecord: {
                    userId: userData.id,
                    date: {
                      gte: currentPeriodStart,
                      lte: currentPeriodEnd,
                    },
                  },
                },
              },
            },
            include: {
              attendanceTasks: {
                include: {
                  attendanceRecord: {
                    include: {
                      user: true,
                    },
                  },
                },
              },
            },
          });

          const attendanceRecords = userData.attendances;

          // Calculate total hours from attendance records (clockOut - clockIn)
          const totalHours = attendanceRecords.reduce((sum, record) => {
            if (record.clockInAt && record.clockOutAt) {
              const hours =
                (record.clockOutAt.getTime() - record.clockInAt.getTime()) /
                (1000 * 60 * 60);
              return sum + hours;
            }
            return sum;
          }, 0);

          // Calculate tasks completed
          const tasksCompleted = tasks.length;

          // Calculate attendance rate (present days / total work days this month)
          const workDaysThisMonth = this.getWorkDaysInCurrentMonth();
          const presentDays = attendanceRecords.filter(
            (record) => record.clockInAt,
          ).length;
          const attendanceRate =
            workDaysThisMonth > 0 ? (presentDays / workDaysThisMonth) * 100 : 0;

          // Calculate productivity (tasks per hour worked)
          const productivity = totalHours > 0 ? tasksCompleted / totalHours : 0;

          return {
            id: userData.id.toString(),
            userId: userData.id.toString(),
            userName: userData.name,
            email: userData.email,
            department: 'General', // Default department since it's not in schema
            role: userData.role as 'EMPLOYEE' | 'COMPANY_ADMIN',
            totalHours: Math.round(totalHours * 100) / 100,
            tasksCompleted,
            tasks,
            productivity: Math.round(productivity * 100) / 100,
            attendanceRate: Math.round(attendanceRate * 100) / 100,
            date: new Date().toISOString().split('T')[0],
            createdAt: userData.createdAt.toISOString(),
          };
        }),
      );

      // Create paginated result
      const paginatedResult = createPaginatedResult(
        reports,
        normalizedPage,
        normalizedLimit,
        totalUsers,
      );

      const reportData = {
        companyId: targetCompanyId,
        totalReports: totalUsers,
        reports: paginatedResult.data,
        pagination: {
          currentPage: paginatedResult.pagination.currentPage,
          totalPages: paginatedResult.pagination.totalPages,
          totalItems: paginatedResult.pagination.totalRecords,
          itemsPerPage: paginatedResult.pagination.limit,
          hasNext: paginatedResult.pagination.hasNextPage,
          hasPrev: paginatedResult.pagination.hasPreviousPage,
        },
      };

      return successResponse(
        reportData,
        'Company user reports retrieved successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

  private getWorkDaysInCurrentMonth(): number {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let workDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      // Count Monday to Friday as work days (1-5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        workDays++;
      }
    }

    return workDays;
  }

  async update(id: number, updateCompanyDto: UpdateCompanyDto) {
    try {
      // Use ensure method which already validates access and fetches company
      // this.companyAccessPolicy.ensureUserCanManageCompany(user, id);

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
          attendanceTasks: {
            some: {
              attendanceRecord: {
                user: {
                  companyId,
                },
              },
            },
          },
        },
        include: {
          attendanceTasks: {
            include: {
              attendanceRecord: {
                include: {
                  user: true,
                },
              },
            },
          },
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
        tasks: tasks.map((task) => {
          // Get the first attendanceTask to extract user info
          const firstAttendance = task.attendanceTasks[0];
          const user = firstAttendance?.attendanceRecord?.user;

          return {
            employeeName: user?.name || 'Unknown',
            title: task.title,
            description: task.description,
            duration: task.duration,
          };
        }),
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
