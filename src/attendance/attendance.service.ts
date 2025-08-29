import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ClockInDto,
  ClockOutDto,
  CreateAttendanceDto,
} from './dto/attendance.dto';
import type { User } from '@prisma/client';
import { Role } from 'src/common';
import { successResponse } from '../../utilies/response';
import { handlePrismaError } from '../../utilies/error-handler';
import {
  calculateDateRanges,
  getUserLocalDateString,
} from '../common/helpers/date.helper';
import {
  calculateSkip,
  createPaginatedResult,
  normalizePaginationParams,
} from '../common/helpers/pagination.helper';
import { CompanyAccessPolicy } from 'src/policies/company-access.policy';
import { WorkHoursPerDayEnum } from 'src/common/work-hours.enum';
import { MinWorkHoursPerDayEnum } from 'src/common/min-work-hours.enum';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private companyAccessPolicy: CompanyAccessPolicy,
  ) {}

  async clockIn(user: User, clockInDto: ClockInDto) {
    try {
      const userId = user.id;
      const todayDateOnly = getUserLocalDateString(user.timezone);

      const existingRecord = await this.prisma.attendanceRecord.findUnique({
        where: {
          userId_date: {
            userId,
            date: new Date(todayDateOnly),
          },
        },
      });

      if (existingRecord && existingRecord.clockInAt) {
        throw new BadRequestException('Already clocked in today');
      }

      const clockInTime = new Date();
      let attendanceRecord;

      if (existingRecord) {
        attendanceRecord = await this.prisma.attendanceRecord.update({
          where: { id: existingRecord.id },
          data: {
            clockInAt: clockInTime,
            note: clockInDto.note,
          },
          include: {
            user: true,
          },
        });
      } else {
        attendanceRecord = await this.prisma.attendanceRecord.create({
          data: {
            userId,
            date: new Date(todayDateOnly),
            clockInAt: clockInTime,
            note: clockInDto.note,
          },
          include: {
            user: true,
          },
        });
      }

      return successResponse(attendanceRecord, 'Clock in successful', 200);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async clockOut(currentUser: User, clockOutDto: ClockOutDto) {
    try {
      const todayDateOnly = getUserLocalDateString(currentUser.timezone);

      const existingRecord = await this.prisma.attendanceRecord.findUnique({
        where: {
          userId_date: {
            userId: currentUser.id,
            date: new Date(todayDateOnly),
          },
        },
      });

      if (!existingRecord || !existingRecord.clockInAt) {
        throw new BadRequestException('Must clock in before clocking out');
      }

      if (existingRecord.clockOutAt) {
        throw new BadRequestException('Already clocked out today');
      }

      const clockOutTime = new Date();

      const attendanceRecord = await this.prisma.attendanceRecord.update({
        where: { id: existingRecord.id },
        data: {
          clockOutAt: clockOutTime,
          note: clockOutDto.note || existingRecord.note,
        },
        include: {
          user: {
            include: {
              employeeRoles: true,
            },
          },
        },
      });

      // Create random tasks based on employee role after clock out
      await this.createRandomTasksForAttendance(attendanceRecord);

      return successResponse(attendanceRecord, 'Clock out successful', 200);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getTodayAttendance(currentUser: User) {
    try {
      const today = new Date();

      // Use local date for determining "today" to avoid timezone issues
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayDateOnly = `${year}-${month}-${day}`;

      let attendanceRecords;

      if (currentUser.role === Role.SUPER_ADMIN) {
        attendanceRecords = await this.prisma.attendanceRecord.findMany({
          where: {
            date: new Date(todayDateOnly),
          },
          include: {
            user: true,
          },
        });
      } else {
        attendanceRecords = await this.prisma.attendanceRecord.findMany({
          where: {
            user: { companyId: currentUser.companyId },
            date: new Date(todayDateOnly),
          },
          include: {
            user: true,
          },
        });
      }

      return successResponse(
        attendanceRecords,
        'Today attendance retrieved successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getUserAttendance(
    currentUser: User,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) {
    try {
      // Normalize pagination parameters
      const { page: normalizedPage, limit: normalizedLimit } =
        normalizePaginationParams(page, limit);

      const where: any = { userId: currentUser.id };
      if (startDate || endDate) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        where.date = {};
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (startDate) where.date.gte = startDate;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (endDate) where.date.lte = endDate;
      }

      // Add search functionality by note
      if (search && search.trim()) {
        where.note = {
          contains: search.trim(),
        };
      }

      // Calculate pagination skip
      const skip = calculateSkip(normalizedPage, normalizedLimit);

      // Get total count for pagination info
      const totalRecords = await this.prisma.attendanceRecord.count({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where,
      });

      // Debug logging to help identify the issue
      console.log('getUserAttendance Debug:', {
        userId: currentUser.id,
        normalizedPage,
        normalizedLimit,
        skip,
        totalRecords,
        where: JSON.stringify(where),
      });

      const attendanceRecords = await this.prisma.attendanceRecord.findMany({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where,
        include: {
          user: true,
        },
        orderBy: {
          date: 'desc',
        },
        skip,
        take: normalizedLimit,
      });

      console.log('Query returned records:', attendanceRecords.length);
      if (attendanceRecords.length === 0 && totalRecords > 0) {
        console.log(
          'WARNING: Empty result but totalRecords > 0. Possible pagination issue.',
        );
      }

      // Add hoursWorked to each record and calculate total work hours
      const recordsWithHours = attendanceRecords.map((record) => {
        const hoursWorked =
          record.clockInAt && record.clockOutAt
            ? Math.round(
                ((record.clockOutAt.getTime() - record.clockInAt.getTime()) /
                  (1000 * 60 * 60)) *
                  100,
              ) / 100
            : null;

        return {
          ...record,
          hoursWorked,
        };
      });

      // Create paginated result
      const paginatedResult = createPaginatedResult(
        recordsWithHours,
        normalizedPage,
        normalizedLimit,
        totalRecords,
      );

      return successResponse(
        {
          records: paginatedResult.data,
          pagination: paginatedResult.pagination,
        },
        'User attendance retrieved successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async create(createAttendanceDto: CreateAttendanceDto) {
    try {
      const { userId, startDate, endDate, duration, note, minDailyHours } =
        createAttendanceDto;
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Validation: start date must be before end date
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestException('Invalid startDate or endDate');
      }
      if (start.getTime() > end.getTime()) {
        throw new BadRequestException('Start date must be before end date');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { company: { select: { isSaturdayWork: true } } },
      });

      const totalDuration = parseFloat(duration);
      const minHoursPerDay = minDailyHours
        ? parseFloat(minDailyHours)
        : MinWorkHoursPerDayEnum.ONE;

      const msPerDay = 24 * 60 * 60 * 1000;
      const numDays =
        Math.ceil((end.getTime() - start.getTime()) / msPerDay) + 1;
      const maxHoursPerDay = WorkHoursPerDayEnum.EIGHT;
      const workDays: Date[] = [];
      // Validation: minDailyHours must be at least the enum value
      if (minHoursPerDay < MinWorkHoursPerDayEnum.ONE) {
        throw new BadRequestException(
          `Minimum daily hours must be at least ${MinWorkHoursPerDayEnum.ONE}`,
        );
      }

      for (let i = 0; i < numDays; i++) {
        const dayDate = new Date(start.getTime() + i * msPerDay);
        const dayOfWeek = dayDate.getDay();
        // Skip Friday (5) and Saturday (6) if not isSaturdayWork
        if (
          dayOfWeek === 5 ||
          (dayOfWeek === 6 && !user?.company?.isSaturdayWork)
        ) {
          continue;
        }
        workDays.push(dayDate);
      }

      // Validation: minHoursPerDay * workDays.length must not exceed totalDuration
      if (minHoursPerDay * workDays.length > totalDuration) {
        throw new BadRequestException(
          `Total duration (${totalDuration}) is too low for ${workDays.length} days with minimum ${minHoursPerDay} hours per day.`,
        );
      }

      // Generate random daily work hours, max per day = maxHoursPerDay
      const dailyHours = this.generateRandomDailyHours(
        totalDuration,
        workDays.length,
        maxHoursPerDay,
        minHoursPerDay,
      );

      /**
       * Randomly distribute totalDuration across n days, max per day = maxHoursPerDay
       */

      const createdRecords: any[] = [];
      for (let i = 0; i < workDays.length; i++) {
        const dayDate = workDays[i];
        const dayDuration = dailyHours[i];
        if (dayDuration < 0.01) continue;
        const attendanceRecord = await this.prisma.attendanceRecord.create({
          data: {
            userId,
            date: dayDate,
            clockInAt: new Date(dayDate.getTime() + 5 * 60 * 60 * 1000), // 5:00 AM UTC
            clockOutAt: new Date(
              dayDate.getTime() +
                dayDuration * 60 * 60 * 1000 +
                5 * 60 * 60 * 1000,
            ),
            note,
          },
          include: {
            user: {
              include: {
                employeeRoles: true,
              },
            },
          },
        });
        await this.createRandomTasksForAttendance(attendanceRecord);
        createdRecords.push(attendanceRecord);
      }

      return successResponse(
        createdRecords,
        'Attendance records and tasks created successfully',
        201,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getAttendanceStats(userId: number) {
    try {
      const thisYear = new Date();
      thisYear.setMonth(0, 1); // January 1st
      thisYear.setHours(0, 0, 0, 0);

      // Get monthly and yearly records
      const [yearlyRecords] = await Promise.all([
        this.prisma.attendanceRecord.findMany({
          where: {
            userId,
            date: {
              gte: thisYear,
            },
          },
        }),
      ]);

      // Yearly calculations
      const yearlyTotalDays = yearlyRecords.length;
      const yearlyPresentDays = yearlyRecords.filter((r) => r.clockInAt).length;
      const yearlyCompleteDays = yearlyRecords.filter(
        (r) => r.clockInAt && r.clockOutAt,
      ).length;

      const yearlyTotalHours = yearlyRecords.reduce((sum, record) => {
        if (record.clockInAt && record.clockOutAt) {
          const hours =
            (record.clockOutAt.getTime() - record.clockInAt.getTime()) /
            (1000 * 60 * 60);
          return sum + hours;
        }
        return sum;
      }, 0);

      // Calculate working days in current month and year
      const currentDate = new Date();

      // Calculate working days (assuming 5-day work week, excluding weekends)
      const getWorkingDays = (startDate: Date, endDate: Date) => {
        let workingDays = 0;
        const current = new Date(startDate);

        while (current <= endDate) {
          const dayOfWeek = current.getDay();
          // Count Monday (1) to Friday (5) as working days
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            workingDays++;
          }
          current.setDate(current.getDate() + 1);
        }
        return workingDays;
      };

      const yearlyWorkingDays = getWorkingDays(thisYear, currentDate);

      // Calculate absence days
      const yearlyAbsenceDays = yearlyWorkingDays - yearlyPresentDays;

      const stats = {
        thisYear: {
          totalDays: yearlyTotalDays,
          presentDays: yearlyPresentDays,
          completeDays: yearlyCompleteDays,
          absenceDays: Math.max(0, yearlyAbsenceDays),
          workingDays: yearlyWorkingDays,
          totalHours: Math.round(yearlyTotalHours * 100) / 100,
          averageHours:
            yearlyCompleteDays > 0
              ? Math.round((yearlyTotalHours / yearlyCompleteDays) * 100) / 100
              : 0,
          attendanceRate:
            yearlyWorkingDays > 0
              ? Math.round((yearlyPresentDays / yearlyWorkingDays) * 100)
              : 0,
          absenceRate:
            yearlyWorkingDays > 0
              ? Math.round(
                  (Math.max(0, yearlyAbsenceDays) / yearlyWorkingDays) * 100,
                )
              : 0,
          averageHoursPerMonth:
            yearlyCompleteDays > 0
              ? Math.round(
                  (yearlyTotalHours / (currentDate.getMonth() + 1)) * 100,
                ) / 100
              : 0,
        },
      };

      return successResponse(
        stats,
        'Attendance statistics retrieved successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getTodayAttendanceForUser(userId: number) {
    try {
      const today = new Date();

      // Use local date for determining "today" to avoid timezone issues
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayDateOnly = `${year}-${month}-${day}`;

      const attendanceRecord = await this.prisma.attendanceRecord.findUnique({
        where: {
          userId_date: {
            userId: userId,
            date: new Date(todayDateOnly),
          },
        },
      });

      const response = {
        date: new Date(todayDateOnly),
        clockInAt: attendanceRecord?.clockInAt || null,
        clockOutAt: attendanceRecord?.clockOutAt || null,
        note: attendanceRecord?.note || null,
        isClocked:
          !!attendanceRecord?.clockInAt && !attendanceRecord?.clockOutAt,
        hoursWorked:
          attendanceRecord?.clockInAt && attendanceRecord?.clockOutAt
            ? Math.round(
                ((attendanceRecord.clockOutAt.getTime() -
                  attendanceRecord.clockInAt.getTime()) /
                  (1000 * 60 * 60)) *
                  100,
              ) / 100
            : null,
      };

      return successResponse(
        response,
        'Today attendance retrieved successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

  private generateRandomDailyHours(
    totalDuration: number,
    numDays: number,
    maxHoursPerDay: number,
    minHoursPerDay: number,
  ): number[] {
    // Step 1: assign minHoursPerDay to each day
    const dailyHours = Array(numDays).fill(minHoursPerDay);
    let remaining = totalDuration - minHoursPerDay * numDays;

    // Step 2: for each day, assign a random value between 0 and max possible
    for (let i = 0; i < numDays; i++) {
      if (remaining <= 0) break;
      const maxAdd = Math.min(maxHoursPerDay - minHoursPerDay, remaining);
      // For last day, assign all remaining
      const add = i === numDays - 1 ? maxAdd : Math.random() * maxAdd;
      dailyHours[i] += add;
      remaining -= add;
    }
    // Round all days to 2 decimals
    for (let i = 0; i < numDays; i++) {
      dailyHours[i] = Math.round(dailyHours[i] * 100) / 100;
      // Clamp to max
      if (dailyHours[i] > maxHoursPerDay) dailyHours[i] = maxHoursPerDay;
      if (dailyHours[i] < minHoursPerDay) dailyHours[i] = minHoursPerDay;
    }
    // Final adjustment for floating point drift
    let total = dailyHours.reduce((a, b) => a + b, 0);
    let drift = Math.round((totalDuration - total) * 100) / 100;
    if (Math.abs(drift) > 0.01) {
      // Try to adjust the last day, but clamp to max
      let lastIdx = numDays - 1;
      let newVal = dailyHours[lastIdx] + drift;
      if (newVal > maxHoursPerDay) {
        drift = newVal - maxHoursPerDay;
        dailyHours[lastIdx] = maxHoursPerDay;
        // Subtract drift from previous days below max
        for (let i = numDays - 2; i >= 0 && drift > 0.01; i--) {
          const room = maxHoursPerDay - dailyHours[i];
          const take = Math.min(room, drift);
          dailyHours[i] += take;
          drift -= take;
        }
      } else if (newVal < minHoursPerDay) {
        drift = minHoursPerDay - newVal;
        dailyHours[lastIdx] = minHoursPerDay;
        // Add drift to previous days above min
        for (let i = numDays - 2; i >= 0 && drift > 0.01; i--) {
          const room = dailyHours[i] - minHoursPerDay;
          const take = Math.min(room, drift);
          dailyHours[i] -= take;
          drift -= take;
        }
      } else {
        dailyHours[lastIdx] = Math.round(newVal * 100) / 100;
      }
    }
    // Final clamp and round
    for (let i = 0; i < numDays; i++) {
      dailyHours[i] = Math.round(dailyHours[i] * 100) / 100;
      if (dailyHours[i] > maxHoursPerDay) dailyHours[i] = maxHoursPerDay;
      if (dailyHours[i] < minHoursPerDay) dailyHours[i] = minHoursPerDay;
    }
    return dailyHours;
  }

  private async createRandomTasksForAttendance(
    attendanceRecord: any,
  ): Promise<any[] | undefined> {
    try {
      // Get tasks available for this employee role
      const roleTasks = await this.prisma.roleTasks.findMany({
        where: {
          employeeRolesId: attendanceRecord.user.employeeRolesId,
        },
      });

      if (roleTasks.length === 0) {
        console.log(
          'No tasks found for employee role:',
          attendanceRecord.user.employeeRolesId,
        );
        return;
      }

      const workHours =
        attendanceRecord.clockInAt && attendanceRecord.clockOutAt
          ? (attendanceRecord.clockOutAt.getTime() -
              attendanceRecord.clockInAt.getTime()) /
            (1000 * 60 * 60)
          : 8; // Default to 8 hours if times are missing

      // Generate 2-5 random tasks
      const numberOfTasks = Math.floor(Math.random() * 4) + 2; // Random number between 2-5
      const selectedTasks = this.getRandomTasks(roleTasks, numberOfTasks);

      const createdTasks: any[] = [];

      const minDuration = 1; // 1 hour minimum
      const maxDuration = 3; // 3 hours maximum
      let remainingHours = workHours;

      for (let i = 0; i < selectedTasks.length; i++) {
        const tasksLeft = selectedTasks.length - i;
        let taskDuration;

        if (i === selectedTasks.length - 1) {
          // Last task takes all remaining hours but clamp to maxDuration
          taskDuration = Math.min(
            Math.max(remainingHours, minDuration),
            maxDuration,
          );
        } else {
          // Maximum this task can take
          let maxPossible = Math.min(
            maxDuration,
            remainingHours - (tasksLeft - 1) * minDuration,
          );
          maxPossible = Math.max(maxPossible, minDuration); // Ensure at least minDuration

          taskDuration =
            Math.random() * (maxPossible - minDuration) + minDuration;
          taskDuration = Math.round(taskDuration * 100) / 100;

          remainingHours -= taskDuration;
        }

        // Create the task
        const task = await this.prisma.task.create({
          data: {
            roleTasksId: selectedTasks[i].id,
            duration: taskDuration,
            date: attendanceRecord.date,
          },
        });

        // Link task to attendance record through pivot table
        await this.prisma.attendanceTask.create({
          data: {
            attendanceRecordId: attendanceRecord.id,
            taskId: task.id,
          },
        });

        createdTasks.push({
          task: selectedTasks[i],
          duration: taskDuration,
        });
      }

      return createdTasks;
    } catch (error) {
      console.error('Error creating random tasks:', error);
      // Don't throw error to avoid breaking clock out process
    }
  }

  private getRandomTasks(roleTasks: any[], count: number): any[] {
    // Shuffle array and take first 'count' items
    const shuffled = [...roleTasks].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, roleTasks.length));
  }

  async requestTimeOff(
    userId: number,
    timeOffDto: {
      startDate: string;
      endDate: string;
      type: string;
      reason: string;
    },
  ) {
    try {
      // Mock implementation since there's no TimeOff model in the schema
      const timeOffRequest = {
        id: Date.now(),
        userId,
        startDate: new Date(timeOffDto.startDate),
        endDate: new Date(timeOffDto.endDate),
        type: timeOffDto.type,
        reason: timeOffDto.reason,
        status: 'pending',
        createdAt: new Date(),
      };

      return successResponse(
        timeOffRequest,
        'Time off request submitted successfully',
        201,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getTimeOffRequests(userId: number) {
    try {
      // Mock implementation since there's no TimeOff model in the schema
      const timeOffRequests = [
        {
          id: 1,
          userId,
          startDate: new Date('2025-08-10'),
          endDate: new Date('2025-08-12'),
          type: 'vacation',
          reason: 'Family vacation',
          status: 'approved',
          createdAt: new Date('2025-08-01'),
        },
        {
          id: 2,
          userId,
          startDate: new Date('2025-08-20'),
          endDate: new Date('2025-08-20'),
          type: 'sick_leave',
          reason: 'Doctor appointment',
          status: 'pending',
          createdAt: new Date('2025-08-15'),
        },
      ];

      return successResponse(
        timeOffRequests,
        'Time off requests retrieved successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getEmployeeHoursByDateRangeWithAccess(
    user: User,
    companyId?: number,
    page?: number,
    filterType?: string,
    filterValue?: string,
    search?: string,
  ) {
    let targetCompanyIds: number[] | undefined;
    if (companyId) {
      // Validate access to the specified companyId
      await this.companyAccessPolicy.ensureUserCanAccessCompany(
        user,
        companyId,
      );
    }

    // Determine which companies to get attendance for
    if (user.role === Role.SUPER_ADMIN) {
      if (!companyId) {
        throw new ForbiddenException(
          'Super admin must specify companyId parameter',
        );
      }
      targetCompanyIds = [companyId];
    } else if (user.role === Role.COMPANY_ADMIN) {
      targetCompanyIds = companyId
        ? [companyId]
        : await this.companyAccessPolicy.getAccessibleCompanyIds(user);
      if (!targetCompanyIds || targetCompanyIds.length === 0) {
        throw new Error('User is not associated with any company');
      }
    } else {
      throw new ForbiddenException(
        'Only company admins and super admins can access attendance',
      );
    }

    // Normalize pagination parameters
    const { page: normalizedPage, limit: normalizedLimit } =
      normalizePaginationParams(page, 10); // Default limit of 10
    const skip = calculateSkip(normalizedPage, normalizedLimit);

    // Build user where condition
    let userWhereCondition: any = {
      companyId:
        targetCompanyIds.length === 1
          ? targetCompanyIds[0]
          : { in: targetCompanyIds },
    };
    if (search && search.trim()) {
      userWhereCondition.name = { contains: search.trim() };
    }

    // Get total count of users matching criteria
    const totalUsers = await this.prisma.user.count({
      where: userWhereCondition,
    });

    const dateRanges = calculateDateRanges(filterType, filterValue);
    const { currentPeriodStart, currentPeriodEnd } = dateRanges;

    // Get users and their attendance records in the date range
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

    // Helper to generate all dates in the range
    function getDatesInRange(start: Date, end: Date): Date[] {
      const dates: Date[] = [];
      let current = new Date(start);
      while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      return dates;
    }

    const allDatesInRange = getDatesInRange(
      currentPeriodStart,
      currentPeriodEnd,
    );

    // Calculate attendance data for each user, including daily breakdown
    const attendanceReports = users.map((userData) => {
      const attendanceRecords = userData.attendances;
      // Map attendance records by date string for quick lookup
      const attendanceByDate: Record<string, (typeof attendanceRecords)[0]> =
        {};
      attendanceRecords.forEach((record) => {
        const dateStr = record.date.toISOString().slice(0, 10);
        attendanceByDate[dateStr] = record;
      });

      let workDays = 0;
      // For each day in the range, get total work hours for that user
      const dailyAttendance = allDatesInRange.map((date) => {
        const isSaturdayWork = userData.company.isSaturdayWork;
        workDays +=
          (isSaturdayWork || date.getDay() !== 5) && date.getDay() !== 6
            ? 1
            : 0;
        const dateStr = date.toISOString().slice(0, 10);
        const record = attendanceByDate[dateStr];
        let hoursWorked = 0;
        if (record && record.clockInAt && record.clockOutAt) {
          hoursWorked =
            Math.round(
              ((record.clockOutAt.getTime() - record.clockInAt.getTime()) /
                (1000 * 60 * 60)) *
                100,
            ) / 100;
        }
        return {
          date: dateStr,
          hoursWorked,
          clockInAt: record?.clockInAt || null,
          clockOutAt: record?.clockOutAt || null,
          note: record?.note || null,
        };
      });

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
      // Calculate present days
      const presentDays = attendanceRecords.filter(
        (record) => record.clockInAt,
      ).length;
      // Calculate attendance rate (present days / total work days in range)

      const attendanceRate = workDays > 0 ? (presentDays / workDays) * 100 : 0;
      return {
        id: userData.id.toString(),
        userId: userData.id.toString(),
        userName: userData.name,
        companyName: userData.company.name,
        email: userData.email,
        employeeRole: userData.employeeRoles.name,
        role: userData.role as 'EMPLOYEE' | 'COMPANY_ADMIN',
        totalHours: Math.round(totalHours * 100) / 100,
        presentDays,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        dailyAttendance,
        workDays,
      };
    });

    // Create paginated result
    const paginatedResult = createPaginatedResult(
      attendanceReports,
      normalizedPage,
      normalizedLimit,
      totalUsers,
    );

    const reportData = {
      companyIds: targetCompanyIds,
      totalUsers,
      attendanceReports: paginatedResult.data,
      pagination: paginatedResult.pagination,
    };

    return successResponse(
      reportData,
      'Company user attendance retrieved successfully',
      200,
    );
  }
}
