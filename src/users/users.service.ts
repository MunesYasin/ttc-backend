import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateUserDto,
  UpdateUserDto,
  CreateBulkUsersDto,
} from './dto/user.dto';
import * as bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import { Role } from '../common/enums/role.enum';
import { EmployeeAccessPolicy } from '../policies/employee-access.policy';
import { successResponse } from '../../utilies/response';
import { handlePrismaError } from '../../utilies/error-handler';
import { calculateDateRanges } from '../common/helpers/date.helper';
import {
  normalizePaginationParams,
  calculateSkip,
  createPaginatedResult,
} from '../common/helpers/pagination.helper';
import { formatMobileNumber } from 'src/common/helpers/format-mobile-number';
import { normalizeKsaMobile } from 'src/common/helpers/normalize-key-mobile';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private employeeAccessPolicy: EmployeeAccessPolicy,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      // Set default password to personalEmail if password is not provided
      const password = createUserDto.password || createUserDto.email;

      if (!password) {
        throw new Error('Either password or personalEmail must be provided');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Set default role to EMPLOYEE if not provided
      const role = createUserDto.role || Role.EMPLOYEE;

      ////////////////////// db errors vaildations
      const dbErrors: { field: string; errors: string[] }[] = [];

      // Check if role is SUPER_ADMIN and validate accordingly
      if (role === Role.SUPER_ADMIN) {
        // For SUPER_ADMIN, subRoleId is required
        if (!createUserDto.subRoleId) {
          dbErrors.push({
            field: 'subRoleId',
            errors: ['SubRole ID is required for SUPER_ADMIN role'],
          });
        }

        // For SUPER_ADMIN, these fields should not be provided
        if (createUserDto.companyId) {
          dbErrors.push({
            field: 'companyId',
            errors: ['Super admin cannot have a company'],
          });
        }
        if (createUserDto.directManager) {
          dbErrors.push({
            field: 'directManager',
            errors: ['Super admin cannot have a direct manager'],
          });
        }
        if (createUserDto.employeeRolesId) {
          dbErrors.push({
            field: 'employeeRolesId',
            errors: ['Super admin cannot have an employee role'],
          });
        }
        if (createUserDto.department) {
          dbErrors.push({
            field: 'department',
            errors: ['Super admin cannot have a department'],
          });
        }
        if (createUserDto.totalSalary) {
          dbErrors.push({
            field: 'totalSalary',
            errors: ['Super admin cannot have a salary'],
          });
        }
        if (createUserDto.contractStartDate) {
          dbErrors.push({
            field: 'contractStartDate',
            errors: ['Super admin cannot have a contract start date'],
          });
        }
        if (createUserDto.remoteWorkDate) {
          dbErrors.push({
            field: 'remoteWorkDate',
            errors: ['Super admin cannot have a remote work date'],
          });
        }
      } else {
        // For non-SUPER_ADMIN roles, subRoleId should not be provided
        if (createUserDto.subRoleId) {
          dbErrors.push({
            field: 'subRoleId',
            errors: [
              'SubRole ID should not be provided for non-SUPER_ADMIN roles',
            ],
          });
        }

        // For non-SUPER_ADMIN roles, companyId and employeeRolesId are required
        if (!createUserDto.companyId) {
          dbErrors.push({
            field: 'companyId',
            errors: ['Company ID is required for non-super admin users'],
          });
        }
        if (!createUserDto.employeeRolesId) {
          dbErrors.push({
            field: 'employeeRolesId',
            errors: ['Employee role ID is required for non-super admin users'],
          });
        }
        if (!createUserDto.department) {
          dbErrors.push({
            field: 'department',
            errors: ['Department is required for non-super admin users'],
          });
        }
        if (!createUserDto.totalSalary) {
          dbErrors.push({
            field: 'totalSalary',
            errors: ['Total salary is required for non-super admin users'],
          });
        }
        if (!createUserDto.contractStartDate) {
          dbErrors.push({
            field: 'contractStartDate',
            errors: [
              'Contract start date is required for non-super admin users',
            ],
          });
        }
        if (!createUserDto.remoteWorkDate) {
          dbErrors.push({
            field: 'remoteWorkDate',
            errors: ['Remote work date is required for non-super admin users'],
          });
        }

        // For EMPLOYEE role, directManager is required
        if (role === Role.EMPLOYEE && !createUserDto.directManager) {
          dbErrors.push({
            field: 'directManager',
            errors: ['Direct manager is required for employee users'],
          });
        }
      }

      // Check if company exists (only if companyId is provided)
      if (createUserDto.companyId) {
        const existingCompany = await this.prisma.company.findUnique({
          where: { id: createUserDto.companyId },
        });
        if (!existingCompany) {
          dbErrors.push({
            field: 'companyId',
            errors: ['Company not found'],
          });
        }
      }

      // Check if employeeRole exists (only if employeeRolesId is provided)
      if (createUserDto.employeeRolesId) {
        const existingEmployeeRole = await this.prisma.employeeRoles.findUnique(
          {
            where: { id: createUserDto.employeeRolesId },
          },
        );
        if (!existingEmployeeRole) {
          dbErrors.push({
            field: 'employeeRolesId',
            errors: ['Employee role not found'],
          });
        }
      }

      // Check if subRole exists (only if subRoleId is provided)
      if (createUserDto.subRoleId) {
        const existingSubRole = await this.prisma.subRole.findUnique({
          where: { id: createUserDto.subRoleId },
        });
        if (!existingSubRole) {
          dbErrors.push({
            field: 'subRoleId',
            errors: ['SubRole not found'],
          });
        }
      }

      // Check for unique constraints before creating
      if (createUserDto.nationalId) {
        const existingNationalId = await this.prisma.user.findUnique({
          where: { nationalId: createUserDto.nationalId },
        });
        if (existingNationalId) {
          dbErrors.push({
            field: 'nationalId',
            errors: ['National ID is already taken'],
          });
        }
      }

      if (createUserDto.personalEmail) {
        const existingPersonalEmail = await this.prisma.user.findFirst({
          where: { personalEmail: createUserDto.personalEmail },
        });
        if (existingPersonalEmail) {
          dbErrors.push({
            field: 'personalEmail',
            errors: ['Personal email is already taken'],
          });
        }
      }

      if (createUserDto.email) {
        const existingEmail = await this.prisma.user.findFirst({
          where: { email: createUserDto.email },
        });
        if (existingEmail) {
          dbErrors.push({
            field: 'email',
            errors: ['Email is already taken'],
          });
        }
      }

      if (createUserDto.absherMobile) {
        const formattedAbsherMobile = formatMobileNumber(
          createUserDto.absherMobile,
        );
        const existingAbsherMobile = await this.prisma.user.findFirst({
          where: { absherMobile: formattedAbsherMobile },
        });
        if (existingAbsherMobile) {
          dbErrors.push({
            field: 'absherMobile',
            errors: ['Absher mobile number is already taken'],
          });
        }
      }

      if (createUserDto.contactMobile) {
        const formattedContactMobile = formatMobileNumber(
          createUserDto.contactMobile,
        );
        const existingContactMobile = await this.prisma.user.findFirst({
          where: { contactMobile: formattedContactMobile },
        });
        if (existingContactMobile) {
          dbErrors.push({
            field: 'contactMobile',
            errors: ['Contact mobile number is already taken'],
          });
        }
      }

      if (dbErrors.length > 0) {
        throw new BadRequestException({
          message: 'Database validation failed',
          error: 'Bad Request',
          statusCode: 400,
          errors: dbErrors,
        });
      }
      // Prepare user data with new fields
      const userData: any = {
        // Basic fields
        name: createUserDto.name,
        email: createUserDto.email, // Use personalEmail as default email
        password: hashedPassword,
        role: role,
        timezone: createUserDto.timezone || 'Asia/Riyadh',

        // Personal Information
        nationalId: createUserDto.nationalId,
        hijriBirthDate: createUserDto.hijriBirthDate,
        gregorianBirthDate: createUserDto.gregorianBirthDate || null,
        gender: createUserDto.gender,
        address: createUserDto.address,
        absherMobile: formatMobileNumber(createUserDto.absherMobile),
        contactMobile: formatMobileNumber(createUserDto.contactMobile),
        personalEmail: createUserDto.personalEmail,
      };

      // Add company-related fields only for non-SUPER_ADMIN users
      if (role !== Role.SUPER_ADMIN) {
        userData.companyId = createUserDto.companyId;
        userData.employeeRolesId = createUserDto.employeeRolesId || 1;
        userData.department = createUserDto.department;
        userData.totalSalary = createUserDto.totalSalary;
        userData.contractStartDate = createUserDto.contractStartDate || null;
        userData.remoteWorkDate = createUserDto.remoteWorkDate || null;

        // Add directManager for EMPLOYEE role
        if (role === Role.EMPLOYEE) {
          userData.directManager = createUserDto.directManager;
        }
      } else {
        // For SUPER_ADMIN, explicitly set these to null/undefined and set subRoleId
        userData.companyId = null;
        userData.employeeRolesId = null; // SUPER_ADMIN should not have employee role
        userData.department = null;
        userData.totalSalary = null;
        userData.contractStartDate = null;
        userData.remoteWorkDate = null;
        userData.directManager = null;
        userData.subRoleId = createUserDto.subRoleId; // SUPER_ADMIN should have subRoleId
      }

      const includeOptions = {
        company: role !== Role.SUPER_ADMIN,
        employeeRoles: role !== Role.SUPER_ADMIN,
      };

      const user = await this.prisma.user.create({
        data: userData,
        include: includeOptions,
      });

      return successResponse(user, 'User created successfully', 201);
    } catch (error) {
      // Handle Prisma errors for any missed unique constraints

      handlePrismaError(error);
    }
  }

  async createBulk(createBulkUsersDto: CreateBulkUsersDto) {
    try {
      const results: Array<{
        index: number;
        user: any;
        status: string;
      }> = [];

      const errors: Array<{
        index: number;
        user: string;
        errors?: Array<{ field: string; errors: string[] }>;
        error?: string;
        status?: string;
      }> = [];

      // Process each user in the batch
      for (let i = 0; i < createBulkUsersDto.users.length; i++) {
        const userDto = createBulkUsersDto.users[i];
        try {
          // Set default password to email if password is not provided
          const password = userDto.password || userDto.email;

          if (!password) {
            throw new Error('Either password or email must be provided');
          }

          const hashedPassword = await bcrypt.hash(password, 10);

          // Set default role to EMPLOYEE if not provided
          const role = userDto.role || Role.EMPLOYEE;

          // Database validation errors for this user
          const dbErrors: { field: string; errors: string[] }[] = [];

          // Check role-specific requirements
          if (role === Role.SUPER_ADMIN) {
            // For SUPER_ADMIN, subRoleId is required
            if (!userDto.subRoleId) {
              dbErrors.push({
                field: 'subRoleId',
                errors: ['SubRole ID is required for SUPER_ADMIN role'],
              });
            }

            // For SUPER_ADMIN, company-related fields should be null
            if (userDto.companyId) {
              dbErrors.push({
                field: 'companyId',
                errors: ['Super admin cannot have a company'],
              });
            }
            if (userDto.directManager) {
              dbErrors.push({
                field: 'directManager',
                errors: ['Super admin cannot have a direct manager'],
              });
            }
            if (userDto.employeeRolesId) {
              dbErrors.push({
                field: 'employeeRolesId',
                errors: ['Super admin cannot have an employee role assignment'],
              });
            }
            if (userDto.department) {
              dbErrors.push({
                field: 'department',
                errors: ['Super admin cannot have a department assignment'],
              });
            }
            if (userDto.totalSalary) {
              dbErrors.push({
                field: 'totalSalary',
                errors: ['Super admin cannot have salary information'],
              });
            }
            if (userDto.contractStartDate) {
              dbErrors.push({
                field: 'contractStartDate',
                errors: ['Super admin cannot have contract information'],
              });
            }
            if (userDto.remoteWorkDate) {
              dbErrors.push({
                field: 'remoteWorkDate',
                errors: ['Super admin cannot have remote work information'],
              });
            }
          } else {
            // For non-SUPER_ADMIN roles, subRoleId should not be provided
            if (userDto.subRoleId) {
              dbErrors.push({
                field: 'subRoleId',
                errors: [
                  'SubRole ID should not be provided for non-SUPER_ADMIN roles',
                ],
              });
            }

            // For non-SUPER_ADMIN roles, companyId and employeeRolesId are required
            if (!userDto.companyId) {
              dbErrors.push({
                field: 'companyId',
                errors: ['Company ID is required for non-super admin users'],
              });
            }
            if (!userDto.employeeRolesId) {
              dbErrors.push({
                field: 'employeeRolesId',
                errors: [
                  'Employee role ID is required for non-super admin users',
                ],
              });
            }
            if (!userDto.department) {
              dbErrors.push({
                field: 'department',
                errors: ['Department is required for non-super admin users'],
              });
            }
            if (!userDto.totalSalary) {
              dbErrors.push({
                field: 'totalSalary',
                errors: ['Total salary is required for non-super admin users'],
              });
            }
            if (!userDto.contractStartDate) {
              dbErrors.push({
                field: 'contractStartDate',
                errors: [
                  'Contract start date is required for non-super admin users',
                ],
              });
            }
            if (!userDto.remoteWorkDate) {
              dbErrors.push({
                field: 'remoteWorkDate',
                errors: [
                  'Remote work date is required for non-super admin users',
                ],
              });
            }

            // For EMPLOYEE role, directManager is required
            if (!userDto.directManager) {
              dbErrors.push({
                field: 'directManager',
                errors: ['Direct manager is required for employee users'],
              });
            }
          }

          // Check if company exists (only if companyId is provided)
          if (userDto.companyId) {
            const existingCompany = await this.prisma.company.findUnique({
              where: { id: userDto.companyId },
            });
            if (!existingCompany) {
              dbErrors.push({
                field: 'companyId',
                errors: ['Company not found'],
              });
            }
          }

          // Check if employeeRole exists (only if employeeRolesId is provided)
          if (userDto.employeeRolesId) {
            const existingEmployeeRole =
              await this.prisma.employeeRoles.findUnique({
                where: { id: userDto.employeeRolesId },
              });
            if (!existingEmployeeRole) {
              dbErrors.push({
                field: 'employeeRolesId',
                errors: ['Employee role not found'],
              });
            }
          }

          // Check if subRole exists (only if subRoleId is provided)
          if (userDto.subRoleId) {
            const existingSubRole = await this.prisma.subRole.findUnique({
              where: { id: userDto.subRoleId },
            });
            if (!existingSubRole) {
              dbErrors.push({
                field: 'subRoleId',
                errors: ['SubRole not found'],
              });
            }
          }

          // Check for unique constraints before creating
          if (userDto.nationalId) {
            const existingNationalId = await this.prisma.user.findUnique({
              where: { nationalId: userDto.nationalId },
            });
            if (existingNationalId) {
              dbErrors.push({
                field: 'nationalId',
                errors: ['National ID is already taken'],
              });
            }
          }

          if (userDto.personalEmail) {
            const existingPersonalEmail = await this.prisma.user.findFirst({
              where: { personalEmail: userDto.personalEmail },
            });
            if (existingPersonalEmail) {
              dbErrors.push({
                field: 'personalEmail',
                errors: ['Personal email is already taken'],
              });
            }
          }

          if (userDto.email) {
            const existingEmail = await this.prisma.user.findFirst({
              where: { email: userDto.email },
            });
            if (existingEmail) {
              dbErrors.push({
                field: 'email',
                errors: ['Email is already taken'],
              });
            }
          }

          if (userDto.absherMobile) {
            const formattedAbsherMobile = formatMobileNumber(
              userDto.absherMobile,
            );
            const existingAbsherMobile = await this.prisma.user.findFirst({
              where: { absherMobile: formattedAbsherMobile },
            });
            if (existingAbsherMobile) {
              dbErrors.push({
                field: 'absherMobile',
                errors: ['Absher mobile number is already taken'],
              });
            }
          }

          if (userDto.contactMobile) {
            const formattedContactMobile = formatMobileNumber(
              userDto.contactMobile,
            );
            const existingContactMobile = await this.prisma.user.findFirst({
              where: { contactMobile: formattedContactMobile },
            });
            if (existingContactMobile) {
              dbErrors.push({
                field: 'contactMobile',
                errors: ['Contact mobile number is already taken'],
              });
            }
          }

          if (dbErrors.length > 0) {
            errors.push({
              index: i,
              user: userDto.name || `User at index ${i}`,
              errors: dbErrors,
            });
            continue;
          }

          // Prepare user data
          const userData: any = {
            // Basic fields
            name: userDto.name,
            email: userDto.email,
            password: hashedPassword,
            role: role,
            timezone: userDto.timezone || 'Asia/Riyadh',

            // Personal Information
            nationalId: userDto.nationalId,
            hijriBirthDate: userDto.hijriBirthDate,
            gregorianBirthDate: userDto.gregorianBirthDate || null,
            gender: userDto.gender,
            address: userDto.address,
            absherMobile: formatMobileNumber(userDto.absherMobile),
            contactMobile: formatMobileNumber(userDto.contactMobile),
            personalEmail: userDto.personalEmail,
          };

          // Add company-related fields only for non-SUPER_ADMIN users
          if (role !== Role.SUPER_ADMIN) {
            userData.companyId = userDto.companyId;
            userData.employeeRolesId = userDto.employeeRolesId || 1;
            userData.department = userDto.department;
            userData.totalSalary = userDto.totalSalary;
            userData.contractStartDate = userDto.contractStartDate || null;
            userData.remoteWorkDate = userDto.remoteWorkDate || null;

            // Add directManager for EMPLOYEE role
            if (role === Role.EMPLOYEE) {
              userData.directManager = userDto.directManager;
            }
          } else {
            // For SUPER_ADMIN, explicitly set these to null/undefined and set subRoleId
            userData.companyId = null;
            userData.employeeRolesId = null; // SUPER_ADMIN should not have employee role
            userData.department = null;
            userData.totalSalary = null;
            userData.contractStartDate = null;
            userData.remoteWorkDate = null;
            userData.directManager = null;
            userData.subRoleId = userDto.subRoleId; // SUPER_ADMIN should have subRoleId
          }

          const includeOptions = {
            company: role !== Role.SUPER_ADMIN,
            employeeRoles: role !== Role.SUPER_ADMIN,
          };

          const user = await this.prisma.user.create({
            data: userData,
            include: includeOptions,
          });

          results.push({
            index: i,
            user: user,
            status: 'success',
          });
        } catch (error) {
          errors.push({
            index: i,
            user: userDto.name || `User at index ${i}`,
            error: error.message,
            status: 'failed',
          });
        }
      }

      const response = {
        totalProcessed: createBulkUsersDto.users.length,
        successful: results.length,
        failed: errors.length,
        results: results,
        errors: errors,
      };

      return successResponse(
        response,
        `Bulk user creation completed. ${results.length} successful, ${errors.length} failed.`,
        201,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    companyId?: number,
    currentUser?: User,
  ) {
    try {
      // If companyId is provided and user is not SUPER_ADMIN, validate access using policy
      if (companyId && currentUser && currentUser.role !== Role.SUPER_ADMIN) {
        // Check if the current user can access the specified company
        const accessibleCompanyIds =
          await this.employeeAccessPolicy.getAccessibleCompanyIds(currentUser);

        if (
          !accessibleCompanyIds ||
          !accessibleCompanyIds.includes(companyId)
        ) {
          throw new ForbiddenException(
            'Access denied to the specified company',
          );
        }
      }

      // Normalize pagination parameters
      const { page: normalizedPage, limit: normalizedLimit } =
        normalizePaginationParams(page, limit);
      const skip = calculateSkip(normalizedPage, normalizedLimit);

      // Build where condition with search and companyId
      const whereCondition: {
        name?: {
          contains: string;
        };
        companyId?: number;
      } = {};

      // Add search condition if search term is provided
      if (search && search.trim()) {
        whereCondition.name = {
          contains: search.trim(),
        };
      }

      // Add companyId filter if provided
      if (companyId) {
        whereCondition.companyId = companyId;
      }

      // Get total count of users (with search and companyId filters)
      const totalUsers = await this.prisma.user.count({
        where: whereCondition,
      });

      const [companyAdminCount, employeeCount, superAdminCount] =
        await Promise.all([
          this.prisma.user.count({
            where: { ...whereCondition, role: Role.COMPANY_ADMIN },
          }),
          this.prisma.user.count({
            where: { ...whereCondition, role: Role.EMPLOYEE },
          }),
          this.prisma.user.count({
            where: { ...whereCondition, role: Role.SUPER_ADMIN },
          }),
        ]);

      // Get paginated users (with search and companyId filters)
      const users = await this.prisma.user.findMany({
        where: whereCondition,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              location: true,
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
        users,
        normalizedPage,
        normalizedLimit,
        totalUsers,
      );

      const usersData = {
        totalUsers: totalUsers,
        companyAdminCount: companyAdminCount,
        employeeCount: employeeCount,
        superAdminCount: superAdminCount,
        users: paginatedResult.data,
        pagination: paginatedResult.pagination,
      };

      return successResponse(usersData, 'Users retrieved successfully', 200);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findOne(id: number, currentUser: User) {
    try {
      const user = await this.employeeAccessPolicy.ensureUserCanAccessEmployee(
        currentUser,
        id,
      );

      if (!user) return successResponse(null, 'User not found', 404);

      const formatDate = (date?: Date | null) => {
        if (!date) return null;
        const d = new Date(date);
        const yy = String(d.getFullYear());
        const mm = String(d.getMonth() + 1).padStart(2, '0'); // months are 0-based
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yy}-${mm}-${dd}`;
      };

      const formattedUser = {
        ...user,
        contractStartDate: formatDate(user.contractStartDate),
        remoteWorkDate: formatDate(user.remoteWorkDate),
        gregorianBirthDate: formatDate(user.gregorianBirthDate),
        hijriBirthDate: formatDate(user.hijriBirthDate),
        contactMobile: normalizeKsaMobile(user.contactMobile),
        absherMobile: normalizeKsaMobile(user.absherMobile),
      };

      return successResponse(formattedUser, 'User retrieved successfully', 200);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getEmployeeStatistics(
    currentUser: User,
    filterType?: string,
    filterValue?: string,
    companyId?: number,
    search?: string,
  ) {
    try {
      let targetCompanyIds: number[] | undefined;

      // Determine which companies to get statistics for
      if (currentUser.role === Role.SUPER_ADMIN) {
        if (!companyId) {
          throw new ForbiddenException(
            'Super admin must specify companyId parameter',
          );
        }
        targetCompanyIds = [companyId];
      } else if (currentUser.role === Role.COMPANY_ADMIN) {
        // Use policy to get accessible company IDs (own company + subcompanies)
        targetCompanyIds = companyId
          ? [companyId]
          : await this.employeeAccessPolicy.getAccessibleCompanyIds(
              currentUser,
            );
        if (!targetCompanyIds || targetCompanyIds.length === 0) {
          throw new Error('User is not associated with any company');
        }
      } else {
        throw new ForbiddenException(
          'Only company admins and super admins can access employee statistics',
        );
      }

      // Calculate date ranges based on filter
      const dateRanges = calculateDateRanges(filterType, filterValue);
      const { currentPeriodStart, currentPeriodEnd } = dateRanges;

      let userIds: number[] | undefined = undefined;
      if (search && search.trim()) {
        // Find users matching search and company
        const matchedUsers = await this.prisma.user.findMany({
          where: {
            companyId: targetCompanyIds ? { in: targetCompanyIds } : undefined,
            name: { contains: search.trim() },
          },
          select: { id: true },
        });
        userIds = matchedUsers.map((u) => u.id);
        if (userIds.length === 0) {
          // No users match, return zero statistics
          return successResponse(
            {
              companyIds: targetCompanyIds,
              totalHours: 0,
              totalTasks: 0,
            },
            'Employee statistics retrieved successfully',
            200,
          );
        }
      }

      // Get only current period data since we don't need comparisons
      const [currentPeriodAttendance, currentPeriodTasks] = await Promise.all([
        // Current period attendance
        this.prisma.attendanceRecord.findMany({
          where: {
            ...(userIds
              ? { userId: { in: userIds } }
              : {
                  user: {
                    companyId: targetCompanyIds
                      ? { in: targetCompanyIds }
                      : undefined,
                  },
                }),
            date: {
              gte: currentPeriodStart,
              lte: currentPeriodEnd,
            },
            clockInAt: { not: null },
            clockOutAt: { not: null },
          },
        }),
        // Current period tasks
        this.prisma.task.findMany({
          where: {
            attendanceTasks: {
              some: {
                attendanceRecord: userIds
                  ? { userId: { in: userIds } }
                  : {
                      user: {
                        companyId: targetCompanyIds
                          ? { in: targetCompanyIds }
                          : undefined,
                      },
                    },
              },
            },
            date: {
              gte: currentPeriodStart,
              lte: currentPeriodEnd,
            },
          },
        }),
      ]);

      // Calculate current period total hours
      const currentPeriodHours = currentPeriodAttendance.reduce(
        (total, record) => {
          if (record.clockInAt && record.clockOutAt) {
            const hours =
              (record.clockOutAt.getTime() - record.clockInAt.getTime()) /
              (1000 * 60 * 60);
            return total + hours;
          }
          return total;
        },
        0,
      );

      // Simple statistics with only total hours and total tasks
      const statistics = {
        companyIds: targetCompanyIds,
        totalHours: Math.round(currentPeriodHours * 100) / 100,
        totalTasks: currentPeriodTasks.length,
      };

      return successResponse(
        statistics,
        'Employee statistics retrieved successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto, currentUser: User) {
    try {
      console.log('===================');

      // Use ensure method which already fetches and validates access
      const existingUser =
        await this.employeeAccessPolicy.ensureUserCanAccessEmployee(
          currentUser,
          id,
        );
      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      // Validate that COMPANY_ADMIN cannot change the user's company
      if (
        currentUser.role === Role.COMPANY_ADMIN &&
        updateUserDto.companyId &&
        updateUserDto.companyId !== existingUser.companyId
      ) {
        throw new ForbiddenException(
          'Company admin cannot change user company',
        );
      }

      // Pre-validation checks for unique fields
      const dbErrors: { field: string; errors: string[] }[] = [];

      // Check for unique constraints before updating
      if (updateUserDto.nationalId) {
        const existingNationalId = await this.prisma.user.findFirst({
          where: {
            nationalId: updateUserDto.nationalId,
            NOT: { id }, // Exclude current user
          },
        });
        if (existingNationalId) {
          dbErrors.push({
            field: 'nationalId',
            errors: ['National ID is already taken'],
          });
        }
      }

      if (updateUserDto.personalEmail) {
        const existingPersonalEmail = await this.prisma.user.findFirst({
          where: {
            personalEmail: updateUserDto.personalEmail,
            NOT: { id }, // Exclude current user
          },
        });
        if (existingPersonalEmail) {
          dbErrors.push({
            field: 'personalEmail',
            errors: ['Personal email is already taken'],
          });
        }
      }

      if (updateUserDto.email) {
        const existingEmail = await this.prisma.user.findFirst({
          where: {
            email: updateUserDto.email,
            NOT: { id }, // Exclude current user
          },
        });
        if (existingEmail) {
          dbErrors.push({
            field: 'email',
            errors: ['Email is already taken'],
          });
        }
      }

      if (updateUserDto.absherMobile) {
        const formattedAbsherMobile = formatMobileNumber(
          updateUserDto.absherMobile,
        );
        const existingAbsherMobile = await this.prisma.user.findFirst({
          where: {
            absherMobile: formattedAbsherMobile,
            NOT: { id }, // Exclude current user
          },
        });
        if (existingAbsherMobile) {
          dbErrors.push({
            field: 'absherMobile',
            errors: ['Absher mobile number is already taken'],
          });
        }
      }

      if (updateUserDto.contactMobile) {
        const formattedContactMobile = formatMobileNumber(
          updateUserDto.contactMobile,
        );
        const existingContactMobile = await this.prisma.user.findFirst({
          where: {
            contactMobile: formattedContactMobile,
            NOT: { id }, // Exclude current user
          },
        });
        if (existingContactMobile) {
          dbErrors.push({
            field: 'contactMobile',
            errors: ['Contact mobile number is already taken'],
          });
        }
      }

      // Validate role-specific requirements
      if (updateUserDto.role === Role.SUPER_ADMIN) {
        console.log('----------------', dbErrors);

        // For SUPER_ADMIN, subRoleId is required
        if (!updateUserDto.subRoleId) {
          dbErrors.push({
            field: 'subRoleId',
            errors: ['SubRole ID is required for SUPER_ADMIN role'],
          });
        }

        // For SUPER_ADMIN, company-related fields should be null
        if (updateUserDto.companyId) {
          dbErrors.push({
            field: 'companyId',
            errors: ['Super admin cannot have a company'],
          });
        }
        if (updateUserDto.directManager) {
          dbErrors.push({
            field: 'directManager',
            errors: ['Super admin cannot have a direct manager'],
          });
        }
        if (updateUserDto.employeeRolesId) {
          dbErrors.push({
            field: 'employeeRolesId',
            errors: ['Super admin cannot have an employee role assignment'],
          });
        }
        if (updateUserDto.department) {
          dbErrors.push({
            field: 'department',
            errors: ['Super admin cannot have a department assignment'],
          });
        }
        if (updateUserDto.totalSalary) {
          dbErrors.push({
            field: 'totalSalary',
            errors: ['Super admin cannot have salary information'],
          });
        }
        if (updateUserDto.contractStartDate) {
          dbErrors.push({
            field: 'contractStartDate',
            errors: ['Super admin cannot have contract information'],
          });
        }
        if (updateUserDto.remoteWorkDate) {
          dbErrors.push({
            field: 'remoteWorkDate',
            errors: ['Super admin cannot have remote work information'],
          });
        }
      } else {
        // For non-SUPER_ADMIN roles, subRoleId should not be provided
        if (updateUserDto.subRoleId) {
          dbErrors.push({
            field: 'subRoleId',
            errors: [
              'SubRole ID should not be provided for non-SUPER_ADMIN roles',
            ],
          });
        }

        // For non-SUPER_ADMIN roles, companyId and employeeRolesId are required
        if (updateUserDto.companyId === undefined) {
          dbErrors.push({
            field: 'companyId',
            errors: ['Company ID is required for non-super admin users'],
          });
        }
        if (updateUserDto.employeeRolesId === undefined) {
          dbErrors.push({
            field: 'employeeRolesId',
            errors: ['Employee role ID is required for non-super admin users'],
          });
        }
        if (!updateUserDto.department) {
          dbErrors.push({
            field: 'department',
            errors: ['Department is required for non-super admin users'],
          });
        }
        if (!updateUserDto.totalSalary) {
          dbErrors.push({
            field: 'totalSalary',
            errors: ['Total salary is required for non-super admin users'],
          });
        }
        if (!updateUserDto.contractStartDate) {
          dbErrors.push({
            field: 'contractStartDate',
            errors: [
              'Contract start date is required for non-super admin users',
            ],
          });
        }
        if (!updateUserDto.remoteWorkDate) {
          dbErrors.push({
            field: 'remoteWorkDate',
            errors: ['Remote work date is required for non-super admin users'],
          });
        }

        if (!updateUserDto.directManager) {
          dbErrors.push({
            field: 'directManager',
            errors: ['Direct manager is required for employee users'],
          });
        }
      }

      // Return validation errors if any
      if (dbErrors.length > 0) {
        throw new BadRequestException({
          message: 'Database validation failed',
          error: 'Bad Request',
          statusCode: 400,
          errors: dbErrors,
        });
      }

      // Prepare update data
      const updateData: any = {
        name: updateUserDto.name,
        email: updateUserDto.email,
        role: updateUserDto.role,
        timezone: updateUserDto.timezone,
        nationalId: updateUserDto.nationalId,
        hijriBirthDate: updateUserDto.hijriBirthDate,
        gregorianBirthDate: updateUserDto.gregorianBirthDate,
        gender: updateUserDto.gender,
        address: updateUserDto.address,
        personalEmail: updateUserDto.personalEmail,
        absherMobile: updateUserDto.absherMobile
          ? formatMobileNumber(updateUserDto.absherMobile)
          : undefined,
        contactMobile: updateUserDto.contactMobile
          ? formatMobileNumber(updateUserDto.contactMobile)
          : undefined,
      };

      // Handle role-specific fields
      if (updateUserDto.role !== Role.SUPER_ADMIN) {
        // Add all company-related fields for non-SUPER_ADMIN users
        updateData.companyId = updateUserDto.companyId;
        updateData.employeeRolesId = updateUserDto.employeeRolesId;
        updateData.department = updateUserDto.department;
        updateData.totalSalary = updateUserDto.totalSalary;
        updateData.contractStartDate = updateUserDto.contractStartDate;
        updateData.remoteWorkDate = updateUserDto.remoteWorkDate;

        // Add directManager for EMPLOYEE role
        if (updateUserDto.role === Role.EMPLOYEE) {
          updateData.directManager = updateUserDto.directManager;
        } else {
          updateData.directManager = null;
        }
      } else {
        // For SUPER_ADMIN, explicitly set company-related fields to null
        updateData.companyId = null;
        updateData.employeeRolesId = null; // SUPER_ADMIN should not have employee role
        updateData.department = null;
        updateData.totalSalary = null;
        updateData.contractStartDate = null;
        updateData.remoteWorkDate = null;
        updateData.directManager = null;
        updateData.subRoleId = updateUserDto.subRoleId; // SUPER_ADMIN should have subRoleId
      }

      // Handle password hashing if provided
      if (updateUserDto.password) {
        updateData.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      const includeOptions = {
        company: updateUserDto.role !== Role.SUPER_ADMIN,
        employeeRoles: updateUserDto.role !== Role.SUPER_ADMIN,
      };

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateData,
        include: includeOptions,
      });

      return successResponse(updatedUser, 'User updated successfully', 200);
    } catch (error) {
      // Handle Prisma errors for any missed unique constraints

      handlePrismaError(error);
    }
  }

  async remove(id: number, currentUser: User) {
    try {
      // Use ensure method which already fetches and validates access
      const user = await this.employeeAccessPolicy.ensureUserCanAccessEmployee(
        currentUser,
        id,
      );
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const deletedUser = await this.prisma.user.delete({
        where: { id },
        include: {
          company: true,
        },
      });

      return successResponse(deletedUser, 'User deleted successfully', 200);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findByCompany(companyId: number, currentUser: User) {
    try {
      // Validate access to company data first
      if (currentUser.role === Role.COMPANY_ADMIN) {
        // Use policy to check if company admin can access this company
        const accessibleCompanyIds =
          await this.employeeAccessPolicy.getAccessibleCompanyIds(currentUser);
        if (
          !accessibleCompanyIds ||
          !accessibleCompanyIds.includes(companyId)
        ) {
          throw new ForbiddenException('Access denied to company data');
        }
      } else if (currentUser.role !== Role.SUPER_ADMIN) {
        throw new ForbiddenException('Access denied');
      }

      const users = await this.prisma.user.findMany({
        where: { companyId },
        include: {
          company: true,
        },
      });

      return successResponse(
        users,
        'Company users retrieved successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getProfile(userId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
          employeeRoles: true,
          subRole: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Remove password from response
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...profile } = user;
      profile.contactMobile = normalizeKsaMobile(user.contactMobile);
      profile.absherMobile = normalizeKsaMobile(user.absherMobile);
      return successResponse(profile, 'Profile retrieved successfully', 200);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async updateProfile(userId: number, updateUserDto: UpdateUserDto) {
    try {
      // Pre-validation checks for unique fields
      const dbErrors: { field: string; errors: string[] }[] = [];

      // Check for unique constraints before updating
      if (updateUserDto.nationalId) {
        const existingNationalId = await this.prisma.user.findFirst({
          where: {
            nationalId: updateUserDto.nationalId,
            NOT: { id: userId }, // Exclude current user
          },
        });
        if (existingNationalId) {
          dbErrors.push({
            field: 'nationalId',
            errors: ['National ID is already taken'],
          });
        }
      }

      if (updateUserDto.personalEmail) {
        const existingPersonalEmail = await this.prisma.user.findFirst({
          where: {
            personalEmail: updateUserDto.personalEmail,
            NOT: { id: userId }, // Exclude current user
          },
        });
        if (existingPersonalEmail) {
          dbErrors.push({
            field: 'personalEmail',
            errors: ['Personal email is already taken'],
          });
        }
      }

      if (updateUserDto.email) {
        const existingEmail = await this.prisma.user.findFirst({
          where: {
            email: updateUserDto.email,
            NOT: { id: userId }, // Exclude current user
          },
        });
        if (existingEmail) {
          dbErrors.push({
            field: 'email',
            errors: ['Email is already taken'],
          });
        }
      }

      if (updateUserDto.absherMobile) {
        const formattedAbsherMobile = formatMobileNumber(
          updateUserDto.absherMobile,
        );
        const existingAbsherMobile = await this.prisma.user.findFirst({
          where: {
            absherMobile: formattedAbsherMobile,
            NOT: { id: userId }, // Exclude current user
          },
        });
        if (existingAbsherMobile) {
          dbErrors.push({
            field: 'absherMobile',
            errors: ['Absher mobile number is already taken'],
          });
        }
      }

      if (updateUserDto.contactMobile) {
        const formattedContactMobile = formatMobileNumber(
          updateUserDto.contactMobile,
        );
        const existingContactMobile = await this.prisma.user.findFirst({
          where: {
            contactMobile: formattedContactMobile,
            NOT: { id: userId }, // Exclude current user
          },
        });
        if (existingContactMobile) {
          dbErrors.push({
            field: 'contactMobile',
            errors: ['Contact mobile number is already taken'],
          });
        }
      }

      // Return validation errors if any
      if (dbErrors.length > 0) {
        throw new BadRequestException({
          message: 'Database validation failed',
          error: 'Bad Request',
          statusCode: 400,
          errors: dbErrors,
        });
      }

      // Validate role-specific requirements
      if (updateUserDto.role === Role.SUPER_ADMIN) {
        // For SUPER_ADMIN, company-related fields should be null
        if (updateUserDto.companyId) {
          dbErrors.push({
            field: 'companyId',
            errors: ['Super admin cannot have a company'],
          });
        }
        if (updateUserDto.directManager) {
          dbErrors.push({
            field: 'directManager',
            errors: ['Super admin cannot have a direct manager'],
          });
        }
        if (updateUserDto.employeeRolesId) {
          dbErrors.push({
            field: 'employeeRolesId',
            errors: ['Super admin cannot have an employee role assignment'],
          });
        }
        if (updateUserDto.department) {
          dbErrors.push({
            field: 'department',
            errors: ['Super admin cannot have a department assignment'],
          });
        }
        if (updateUserDto.totalSalary) {
          dbErrors.push({
            field: 'totalSalary',
            errors: ['Super admin cannot have salary information'],
          });
        }
        if (updateUserDto.contractStartDate) {
          dbErrors.push({
            field: 'contractStartDate',
            errors: ['Super admin cannot have contract information'],
          });
        }
        if (updateUserDto.remoteWorkDate) {
          dbErrors.push({
            field: 'remoteWorkDate',
            errors: ['Super admin cannot have remote work information'],
          });
        }
      } else if (updateUserDto.role) {
        // For non-SUPER_ADMIN roles, validate required fields only if role is being changed
        if (updateUserDto.companyId === undefined) {
          dbErrors.push({
            field: 'companyId',
            errors: ['Company ID is required for non-super admin users'],
          });
        }
        if (updateUserDto.employeeRolesId === undefined) {
          dbErrors.push({
            field: 'employeeRolesId',
            errors: ['Employee role ID is required for non-super admin users'],
          });
        }
        if (!updateUserDto.department) {
          dbErrors.push({
            field: 'department',
            errors: ['Department is required for non-super admin users'],
          });
        }
        if (!updateUserDto.totalSalary) {
          dbErrors.push({
            field: 'totalSalary',
            errors: ['Total salary is required for non-super admin users'],
          });
        }
        if (!updateUserDto.contractStartDate) {
          dbErrors.push({
            field: 'contractStartDate',
            errors: [
              'Contract start date is required for non-super admin users',
            ],
          });
        }
        if (!updateUserDto.remoteWorkDate) {
          dbErrors.push({
            field: 'remoteWorkDate',
            errors: ['Remote work date is required for non-super admin users'],
          });
        }

        if (!updateUserDto.directManager) {
          dbErrors.push({
            field: 'directManager',
            errors: ['Direct manager is required for employee users'],
          });
        }
      }

      // Return validation errors if any (second check after role validation)
      if (dbErrors.length > 0) {
        throw new BadRequestException({
          message: 'Database validation failed',
          error: 'Bad Request',
          statusCode: 400,
          errors: dbErrors,
        });
      }

      // Prepare update data
      const updateData: any = {
        name: updateUserDto.name,
        email: updateUserDto.email,
        role: updateUserDto.role,
        timezone: updateUserDto.timezone,
        nationalId: updateUserDto.nationalId,
        hijriBirthDate: updateUserDto.hijriBirthDate,
        gregorianBirthDate: updateUserDto.gregorianBirthDate,
        gender: updateUserDto.gender,
        address: updateUserDto.address,
        personalEmail: updateUserDto.personalEmail,
        absherMobile: updateUserDto.absherMobile
          ? formatMobileNumber(updateUserDto.absherMobile)
          : undefined,
        contactMobile: updateUserDto.contactMobile
          ? formatMobileNumber(updateUserDto.contactMobile)
          : undefined,
      };

      // Handle role-specific fields
      if (updateUserDto.role !== Role.SUPER_ADMIN) {
        // Add all company-related fields for non-SUPER_ADMIN users
        updateData.companyId = updateUserDto.companyId;
        updateData.employeeRolesId = updateUserDto.employeeRolesId;
        updateData.department = updateUserDto.department;
        updateData.totalSalary = updateUserDto.totalSalary;
        updateData.contractStartDate = updateUserDto.contractStartDate;
        updateData.remoteWorkDate = updateUserDto.remoteWorkDate;

        // Add directManager for EMPLOYEE role
        if (updateUserDto.role === Role.EMPLOYEE) {
          updateData.directManager = updateUserDto.directManager;
        } else {
          updateData.directManager = null;
        }
      } else {
        // For SUPER_ADMIN, explicitly set company-related fields to null
        updateData.companyId = null;
        updateData.employeeRolesId = null; // SUPER_ADMIN should not have employee role
        updateData.department = null;
        updateData.totalSalary = null;
        updateData.contractStartDate = null;
        updateData.remoteWorkDate = null;
        updateData.directManager = null;
      }

      // Hash password if provided
      if (updateUserDto.password) {
        updateData.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      const includeOptions = {
        company: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        employeeRoles: updateUserDto.role !== Role.SUPER_ADMIN,
      };

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: includeOptions,
      });

      // Remove password from response
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...profile } = updatedUser;

      return successResponse(profile, 'Profile updated successfully', 200);
    } catch (error) {
      // Handle Prisma errors for any missed unique constraints

      handlePrismaError(error);
    }
  }
}
