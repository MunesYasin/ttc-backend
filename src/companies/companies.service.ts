import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
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
import { formatMobileNumber } from '../common/helpers/format-mobile-number';
import { normalizeKsaMobile } from '../common/helpers/normalize-key-mobile';

@Injectable()
export class CompaniesService {
  constructor(
    private prisma: PrismaService,
    private companyAccessPolicy: CompanyAccessPolicy,
  ) {}

  async create(createCompanyDto: CreateCompanyDto) {
    try {
      // Database validation errors array
      const dbErrors: { field: string; errors: string[] }[] = [];

      // If parentCompanyId is provided, validate that the parent company exists
      if (createCompanyDto.parentCompanyId) {
        const parentCompany = await this.prisma.company.findUnique({
          where: { id: createCompanyDto.parentCompanyId },
        });

        if (!parentCompany) {
          dbErrors.push({
            field: 'parentCompanyId',
            errors: ['Parent company not found'],
          });
        }
      }

      // Check for unique constraints before creating
      if (createCompanyDto.notionalId) {
        const existingNotionalId = await this.prisma.company.findUnique({
          where: { notionalId: createCompanyDto.notionalId },
        });
        if (existingNotionalId) {
          dbErrors.push({
            field: 'notionalId',
            errors: ['Notional ID is already taken'],
          });
        }
      }

      if (createCompanyDto.commercialRegistrationNumber) {
        const existingCRN = await this.prisma.company.findUnique({
          where: {
            commercialRegistrationNumber:
              createCompanyDto.commercialRegistrationNumber,
          },
        });
        if (existingCRN) {
          dbErrors.push({
            field: 'commercialRegistrationNumber',
            errors: ['Commercial Registration Number is already taken'],
          });
        }
      }

      if (createCompanyDto.taxNumber) {
        const existingTaxNumber = await this.prisma.company.findUnique({
          where: { taxNumber: createCompanyDto.taxNumber },
        });
        if (existingTaxNumber) {
          dbErrors.push({
            field: 'taxNumber',
            errors: ['Tax Number is already taken'],
          });
        }
      }

      if (createCompanyDto.address) {
        const existingAddress = await this.prisma.company.findUnique({
          where: { address: createCompanyDto.address },
        });
        if (existingAddress) {
          dbErrors.push({
            field: 'address',
            errors: ['Company address is already taken'],
          });
        }
      }

      if (createCompanyDto.nameOfAuthorizedSignatory) {
        const existingSignatory = await this.prisma.company.findUnique({
          where: {
            nameOfAuthorizedSignatory:
              createCompanyDto.nameOfAuthorizedSignatory,
          },
        });
        if (existingSignatory) {
          dbErrors.push({
            field: 'nameOfAuthorizedSignatory',
            errors: ['Authorized signatory name is already taken'],
          });
        }
      }

      if (createCompanyDto.emailOfAuthorizedSignatory) {
        const existingSignatoryEmail = await this.prisma.company.findUnique({
          where: {
            emailOfAuthorizedSignatory:
              createCompanyDto.emailOfAuthorizedSignatory,
          },
        });
        if (existingSignatoryEmail) {
          dbErrors.push({
            field: 'emailOfAuthorizedSignatory',
            errors: ['Authorized signatory email is already taken'],
          });
        }
      }

      if (createCompanyDto.mobileOfAuthorizedSignatory) {
        const formattedSignatoryMobile = formatMobileNumber(
          createCompanyDto.mobileOfAuthorizedSignatory,
        );
        const existingSignatoryMobile = await this.prisma.company.findUnique({
          where: { mobileOfAuthorizedSignatory: formattedSignatoryMobile },
        });
        if (existingSignatoryMobile) {
          dbErrors.push({
            field: 'mobileOfAuthorizedSignatory',
            errors: ['Authorized signatory mobile number is already taken'],
          });
        }
      }

      if (createCompanyDto.hrManager1Name) {
        const existingHR1Name = await this.prisma.company.findUnique({
          where: { hrManager1Name: createCompanyDto.hrManager1Name },
        });
        if (existingHR1Name) {
          dbErrors.push({
            field: 'hrManager1Name',
            errors: ['HR Manager 1 name is already taken'],
          });
        }
      }

      if (createCompanyDto.hrManager1Email) {
        const existingHR1Email = await this.prisma.company.findUnique({
          where: { hrManager1Email: createCompanyDto.hrManager1Email },
        });
        if (existingHR1Email) {
          dbErrors.push({
            field: 'hrManager1Email',
            errors: ['HR Manager 1 email is already taken'],
          });
        }
      }

      if (createCompanyDto.hrManager1Mobile) {
        const formattedHR1Mobile = formatMobileNumber(
          createCompanyDto.hrManager1Mobile,
        );
        const existingHR1Mobile = await this.prisma.company.findUnique({
          where: { hrManager1Mobile: formattedHR1Mobile },
        });
        if (existingHR1Mobile) {
          dbErrors.push({
            field: 'hrManager1Mobile',
            errors: ['HR Manager 1 mobile number is already taken'],
          });
        }
      }

      if (createCompanyDto.hrManager2Name) {
        const existingHR2Name = await this.prisma.company.findUnique({
          where: { hrManager2Name: createCompanyDto.hrManager2Name },
        });
        if (existingHR2Name) {
          dbErrors.push({
            field: 'hrManager2Name',
            errors: ['HR Manager 2 name is already taken'],
          });
        }
      }

      if (createCompanyDto.hrManager2Email) {
        const existingHR2Email = await this.prisma.company.findUnique({
          where: { hrManager2Email: createCompanyDto.hrManager2Email },
        });
        if (existingHR2Email) {
          dbErrors.push({
            field: 'hrManager2Email',
            errors: ['HR Manager 2 email is already taken'],
          });
        }
      }

      if (createCompanyDto.hrManager2Mobile) {
        const formattedHR2Mobile = formatMobileNumber(
          createCompanyDto.hrManager2Mobile,
        );
        const existingHR2Mobile = await this.prisma.company.findUnique({
          where: { hrManager2Mobile: formattedHR2Mobile },
        });
        if (existingHR2Mobile) {
          dbErrors.push({
            field: 'hrManager2Mobile',
            errors: ['HR Manager 2 mobile number is already taken'],
          });
        }
      }

      if (createCompanyDto.accountantName) {
        const existingAccountantName = await this.prisma.company.findUnique({
          where: { accountantName: createCompanyDto.accountantName },
        });
        if (existingAccountantName) {
          dbErrors.push({
            field: 'accountantName',
            errors: ['Accountant name is already taken'],
          });
        }
      }

      if (createCompanyDto.accountantEmail) {
        const existingAccountantEmail = await this.prisma.company.findUnique({
          where: { accountantEmail: createCompanyDto.accountantEmail },
        });
        if (existingAccountantEmail) {
          dbErrors.push({
            field: 'accountantEmail',
            errors: ['Accountant email is already taken'],
          });
        }
      }

      if (createCompanyDto.accountantMobile) {
        const formattedAccountantMobile = formatMobileNumber(
          createCompanyDto.accountantMobile,
        );
        const existingAccountantMobile = await this.prisma.company.findUnique({
          where: { accountantMobile: formattedAccountantMobile },
        });
        if (existingAccountantMobile) {
          dbErrors.push({
            field: 'accountantMobile',
            errors: ['Accountant mobile number is already taken'],
          });
        }
      }

      // If there are validation errors, throw them
      if (dbErrors.length > 0) {
        throw new BadRequestException({
          message: 'Database validation failed',
          error: 'Bad Request',
          statusCode: 400,
          errors: dbErrors,
        });
      }

      // Format mobile numbers before creating
      const formattedData = {
        ...createCompanyDto,
        mobileOfAuthorizedSignatory: formatMobileNumber(
          createCompanyDto.mobileOfAuthorizedSignatory,
        ),
        hrManager1Mobile: formatMobileNumber(createCompanyDto.hrManager1Mobile),
        hrManager2Mobile: formatMobileNumber(createCompanyDto.hrManager2Mobile),
        accountantMobile: formatMobileNumber(createCompanyDto.accountantMobile),
      };

      const company = await this.prisma.company.create({
        data: formattedData,
        include: {
          parentCompany: {
            select: {
              id: true,
              name: true,
            },
          },
          subcompanies: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return successResponse(company, 'Company created successfully', 201);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    user?: User,
  ) {
    try {
      // Normalize pagination parameters
      const { page: normalizedPage, limit: normalizedLimit } =
        normalizePaginationParams(page, limit);
      const skip = calculateSkip(normalizedPage, normalizedLimit);

      // Build where condition with search
      let whereCondition: any = {};

      // Add search condition if search term is provided
      if (search && search.trim()) {
        whereCondition.name = {
          contains: search.trim(),
        };
      }

      // Add access control based on user role using policy
      if (user) {
        const accessFilter =
          this.companyAccessPolicy.getAccessibleCompaniesFilter(user);
        whereCondition = {
          ...whereCondition,
          ...accessFilter,
        };
      }

      // Get total count of companies (with search filter and access control)
      const totalCompanies = await this.prisma.company.count({
        where: whereCondition,
      });

      // Get total employees across accessible companies only
      const totalEmployees = await this.prisma.user.count({
        where: {
          company: whereCondition,
        },
      });

      // Get paginated companies (with search filter and access control)
      const companies = await this.prisma.company.findMany({
        where: whereCondition,
        include: {
          parentCompany: {
            select: {
              id: true,
              name: true,
            },
          },
          subcompanies: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              users: true,
              reports: true,
              subcompanies: true,
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

      // Format mobile numbers in the companies data
      const formattedCompanies = paginatedResult.data.map((company) => ({
        ...company,
        mobileOfAuthorizedSignatory: normalizeKsaMobile(
          company.mobileOfAuthorizedSignatory,
        ),
        hrManager1Mobile: normalizeKsaMobile(company.hrManager1Mobile),
        hrManager2Mobile: normalizeKsaMobile(company.hrManager2Mobile),
        accountantMobile: normalizeKsaMobile(company.accountantMobile),
      }));

      // Calculate average employees per company
      const avgEmployeesPerCompany =
        totalCompanies > 0
          ? Math.round((totalEmployees / totalCompanies) * 100) / 100
          : 0;

      const companiesData = {
        totalCompanies: totalCompanies,
        totalEmployees: totalEmployees,
        avgEmployeesPerCompany: avgEmployeesPerCompany,
        companies: formattedCompanies,
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

      if (!company) {
        return successResponse(null, 'Company not found', 404);
      }

      // Normalize mobile numbers for display
      const formattedCompany = {
        ...company,
        mobileOfAuthorizedSignatory: normalizeKsaMobile(
          company.mobileOfAuthorizedSignatory,
        ),
        hrManager1Mobile: normalizeKsaMobile(company.hrManager1Mobile),
        hrManager2Mobile: normalizeKsaMobile(company.hrManager2Mobile),
        accountantMobile: normalizeKsaMobile(company.accountantMobile),
      };

      return successResponse(
        formattedCompany,
        'Company retrieved successfully',
        200,
      );
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
              // role: 'EMPLOYEE',
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
                  // role: 'EMPLOYEE',
                },
              },
              reports: true,
            },
          },
          parentCompany: {
            select: {
              id: true,
              name: true,
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
        notionalId: company.notionalId,
        commercialRegistrationNumber: company.commercialRegistrationNumber,
        taxNumber: company.taxNumber,
        address: company.address,
        nameOfAuthorizedSignatory: company.nameOfAuthorizedSignatory,
        emailOfAuthorizedSignatory: company.emailOfAuthorizedSignatory,
        mobileOfAuthorizedSignatory: normalizeKsaMobile(
          company.mobileOfAuthorizedSignatory,
        ),
        hrManager1Name: company.hrManager1Name,
        hrManager1Email: company.hrManager1Email,
        hrManager1Mobile: normalizeKsaMobile(company.hrManager1Mobile),
        hrManager2Name: company.hrManager2Name,
        hrManager2Email: company.hrManager2Email,
        hrManager2Mobile: normalizeKsaMobile(company.hrManager2Mobile),
        accountantName: company.accountantName,
        accountantEmail: company.accountantEmail,
        accountantMobile: normalizeKsaMobile(company.accountantMobile),
        location: company.location,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
        totalEmployees: company._count.users,
        totalReports: company._count.reports,
        parentCompany: company.parentCompany,
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
      // Normalize pagination parameters
      const { page: normalizedPage, limit: normalizedLimit } =
        normalizePaginationParams(page, limit);
      const skip = calculateSkip(normalizedPage, normalizedLimit);

      // Build where condition with search and access control using policy
      let whereCondition: any =
        this.companyAccessPolicy.getAccessibleEmployeesFilter(user);

      // Add search condition if search term is provided
      if (search && search.trim()) {
        whereCondition = {
          ...whereCondition,
          name: {
            contains: search.trim(),
          },
        };
      }

      // Get total count of employees (with search filter and access control)
      // const totalEmployees = await this.prisma.user.count({
      //   where: whereCondition,
      // });

      // Get counts by role for accessible companies
      const accessibleCompanyIds =
        await this.companyAccessPolicy.getAccessibleCompanyIds(user);

      const [companyAdminCount, employeeCount, totalEmployees] =
        await Promise.all([
          this.prisma.user.count({
            where: {
              companyId: accessibleCompanyIds
                ? { in: accessibleCompanyIds }
                : undefined,
              role: Role.COMPANY_ADMIN,
            },
          }),
          this.prisma.user.count({
            where: {
              companyId: accessibleCompanyIds
                ? { in: accessibleCompanyIds }
                : undefined,
              role: Role.EMPLOYEE,
            },
          }),
          this.prisma.user.count({
            where: {
              companyId: accessibleCompanyIds
                ? { in: accessibleCompanyIds }
                : undefined,
            },
          }),
        ]);

      // Get paginated employees (with search filter and access control)
      const employees = await this.prisma.user.findMany({
        where: whereCondition,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          companyId: true,
          createdAt: true,
          updatedAt: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
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

  async getCompanyEmployeesById(
    user: User,
    companyId: number,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) {
    try {
      // First, check if user can access this specific company using policy
      await this.companyAccessPolicy.ensureUserCanAccessCompany(
        user,
        companyId,
      );

      // Normalize pagination parameters
      const { page: normalizedPage, limit: normalizedLimit } =
        normalizePaginationParams(page, limit);
      const skip = calculateSkip(normalizedPage, normalizedLimit);

      // Build where condition with search for specific company
      let whereCondition: any = {
        companyId: companyId,
      };

      // Add search condition if search term is provided
      if (search && search.trim()) {
        whereCondition = {
          ...whereCondition,
          name: {
            contains: search.trim(),
          },
        };
      }

      // Get counts by role for this specific company
      const [companyAdminCount, employeeCount, totalEmployees] =
        await Promise.all([
          this.prisma.user.count({
            where: {
              companyId: companyId,
              role: Role.COMPANY_ADMIN,
            },
          }),
          this.prisma.user.count({
            where: {
              companyId: companyId,
              role: Role.EMPLOYEE,
            },
          }),
          this.prisma.user.count({
            where: {
              companyId: companyId,
            },
          }),
        ]);

      // Get paginated employees (with search filter for specific company)
      const employees = await this.prisma.user.findMany({
        where: whereCondition,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          companyId: true,
          createdAt: true,
          updatedAt: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
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
        companyId: companyId,
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
      let targetCompanyIds: number[] | undefined;

      if (companyId) {
        // Validate access to the specified companyId
        await this.companyAccessPolicy.ensureUserCanAccessCompany(
          user,
          companyId,
        );
      }

      // Determine which companies to get reports for
      if (user.role === Role.SUPER_ADMIN) {
        if (!companyId) {
          throw new ForbiddenException(
            'Super admin must specify companyId parameter',
          );
        }
        targetCompanyIds = [companyId];
      } else if (user.role === Role.COMPANY_ADMIN) {
        // Use policy to get accessible company IDs (own company + subcompanies)
        targetCompanyIds = companyId
          ? [companyId]
          : await this.companyAccessPolicy.getAccessibleCompanyIds(user);
        if (!targetCompanyIds || targetCompanyIds.length === 0) {
          throw new Error('User is not associated with any company');
        }
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
        companyId: { in: number[] } | number;
        name?: {
          contains: string;
        };
      } = {
        companyId:
          targetCompanyIds.length === 1
            ? targetCompanyIds[0]
            : { in: targetCompanyIds },
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
          company: {
            select: {
              id: true,
              name: true,
              isSaturdayWork: true,
            },
          },
          employeeRoles: true,
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
              // attendanceTasks: {
              //   include: {
              //     attendanceRecord: {
              //       include: {
              //         user: true,
              //       },
              //     },
              //   },
              // },
              roleTasks: true,
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
          const workDaysThisMonth = this.getWorkDaysInCurrentMonth(
            userData.company.isSaturdayWork,
          );
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
            companyName: userData.company.name,
            email: userData.email,
            employeeRole: userData.employeeRoles.name, // Default department since it's not in schema
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
        companyIds: targetCompanyIds,
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

  private getWorkDaysInCurrentMonth(isSaturdayWork?: boolean): number {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let workDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      // Count Monday to Friday as work days (1-5)
      if (dayOfWeek >= 1 && dayOfWeek <= (isSaturdayWork ? 6 : 5)) {
        workDays++;
      }
    }

    return workDays;
  }

  async update(id: number, updateCompanyDto: UpdateCompanyDto) {
    try {
      // Use ensure method which already validates access and fetches company
      // this.companyAccessPolicy.ensureUserCanManageCompany(user, id);

      // Format mobile numbers before updating
      const formattedData = {
        ...updateCompanyDto,
        mobileOfAuthorizedSignatory:
          updateCompanyDto.mobileOfAuthorizedSignatory
            ? formatMobileNumber(updateCompanyDto.mobileOfAuthorizedSignatory)
            : undefined,
        hrManager1Mobile: updateCompanyDto.hrManager1Mobile
          ? formatMobileNumber(updateCompanyDto.hrManager1Mobile)
          : undefined,
        hrManager2Mobile: updateCompanyDto.hrManager2Mobile
          ? formatMobileNumber(updateCompanyDto.hrManager2Mobile)
          : undefined,
        accountantMobile: updateCompanyDto.accountantMobile
          ? formatMobileNumber(updateCompanyDto.accountantMobile)
          : undefined,
      };

      const company = await this.prisma.company.update({
        where: { id },
        data: formattedData,
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

  async getSubcompanies(user: User, parentCompanyId?: number) {
    try {
      // Use policy to determine target company ID for subcompanies
      const targetCompanyId =
        this.companyAccessPolicy.getTargetCompanyIdForSubcompanies(
          user,
          parentCompanyId,
        );

      // Get subcompanies
      const subcompanies = await this.prisma.company.findMany({
        where: {
          parentCompanyId: targetCompanyId,
        },
        include: {
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
      });

      // Format mobile numbers
      const formattedSubcompanies = subcompanies.map((company) => ({
        ...company,
        mobileOfAuthorizedSignatory: normalizeKsaMobile(
          company.mobileOfAuthorizedSignatory,
        ),
        hrManager1Mobile: normalizeKsaMobile(company.hrManager1Mobile),
        hrManager2Mobile: normalizeKsaMobile(company.hrManager2Mobile),
        accountantMobile: normalizeKsaMobile(company.accountantMobile),
      }));

      return successResponse(
        {
          parentCompanyId: targetCompanyId,
          totalSubcompanies: subcompanies.length,
          subcompanies: formattedSubcompanies,
        },
        'Subcompanies retrieved successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }
}
