import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import { Role } from '../common/enums/role.enum';
import { EmployeeAccessPolicy } from '../policies/employee-access.policy';
import { errorResponse, successResponse } from '../../utilies/response';
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
      const notionalIDExist = await this.prisma.user.findUnique({
        where: { nationalId: createUserDto.nationalId },
      });
      if (notionalIDExist) {
        dbErrors.push({
          field: 'nationalId',
          errors: ['National ID is already taken'],
        });
      }

      if (dbErrors.length > 0) {
        return errorResponse(dbErrors, 'Database validation failed', 400);
      }
      // Prepare user data with new fields
      const userData = {
        // Basic fields
        name: createUserDto.name,
        email: createUserDto.personalEmail || createUserDto.email, // Use personalEmail as default email
        password: hashedPassword,
        role: role,
        timezone: createUserDto.timezone || 'Asia/Riyadh',
        companyId: createUserDto.companyId,
        employeeRolesId: createUserDto.employeeRolesId, // Use jobTitleId as employeeRolesId, default to 1

        // Personal Information
        nationalId: createUserDto.nationalId,
        hijriBirthDate: createUserDto.hijriBirthDate,
        gregorianBirthDate: createUserDto.gregorianBirthDate || null,
        gender: createUserDto.gender,
        address: createUserDto.address,
        absherMobile: formatMobileNumber(createUserDto.absherMobile),
        contactMobile: formatMobileNumber(createUserDto.contactMobile),
        personalEmail: createUserDto.personalEmail,

        // Job Information
        department: createUserDto.department,
        totalSalary: createUserDto.totalSalary,
        contractStartDate: createUserDto.contractStartDate || null,
        remoteWorkDate: createUserDto.remoteWorkDate || null,
        directManager: createUserDto.directManager,
      };

      const user = await this.prisma.user.create({
        data: userData,
        include: {
          company: true,
          employeeRoles: true,
        },
      });

      return successResponse(user, 'User created successfully', 201);
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

      // Get total count of users (with search filter)
      const totalUsers = await this.prisma.user.count({
        where: whereCondition,
      });

      // Get counts by role
      const [companyAdminCount, employeeCount, superAdminCount] = await Promise.all([
        this.prisma.user.count({
          where: { role: Role.COMPANY_ADMIN },
        }),
        this.prisma.user.count({
          where: { role: Role.EMPLOYEE },
        }),
        this.prisma.user.count({
          where: { role: Role.SUPER_ADMIN },
        }),
      ]);

      // Get paginated users (with search filter)
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
  ) {
    try {
      let targetCompanyId: number;

      // Determine which company to get statistics for
      if (currentUser.role === Role.SUPER_ADMIN) {
        if (!companyId) {
          throw new ForbiddenException(
            'Super admin must specify companyId parameter',
          );
        }
        targetCompanyId = companyId;
      } else if (currentUser.role === Role.COMPANY_ADMIN) {
        // Company admin should not provide companyId, they use their own company
        if (companyId) {
          throw new ForbiddenException(
            'Company admin should not specify companyId parameter',
          );
        }
        if (!currentUser.companyId) {
          throw new Error('User is not associated with any company');
        }
        targetCompanyId = currentUser.companyId;
      } else {
        throw new ForbiddenException(
          'Only company admins and super admins can access employee statistics',
        );
      }

      // Calculate date ranges based on filter
      const dateRanges = calculateDateRanges(filterType, filterValue);
      const { currentPeriodStart, currentPeriodEnd } = dateRanges;

      // Get only current period data since we don't need comparisons
      const [currentPeriodAttendance, currentPeriodTasks] = await Promise.all([
        // Current period attendance
        this.prisma.attendanceRecord.findMany({
          where: {
            user: { companyId: targetCompanyId },
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
                attendanceRecord: {
                  user: { companyId: targetCompanyId },
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
        companyId: targetCompanyId,
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

      // Prepare update data
      const updateData = {
        ...updateUserDto,
        absherMobile: formatMobileNumber(updateUserDto.absherMobile),
        contactMobile: formatMobileNumber(updateUserDto.contactMobile),
      };

      // Handle password hashing if provided
      if (updateUserDto.password) {
        updateData.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      // Date fields are already handled by class-transformer, no conversion needed

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateData,
        include: {
          company: true,
          employeeRoles: true,
        },
      });

      return successResponse(updatedUser, 'User updated successfully', 200);
    } catch (error) {
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
        if (currentUser.companyId !== companyId) {
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
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Remove password from response
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...profile } = user;

      return successResponse(profile, 'Profile retrieved successfully', 200);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async updateProfile(userId: number, updateUserDto: UpdateUserDto) {
    try {
      const updateData = { ...updateUserDto };

      // Hash password if provided
      if (updateUserDto.password) {
        updateData.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
        },
      });

      // Remove password from response
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...profile } = updatedUser;

      return successResponse(profile, 'Profile updated successfully', 200);
    } catch (error) {
      handlePrismaError(error);
    }
  }
}
