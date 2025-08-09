import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ClockInDto,
  ClockOutDto,
  CreateAttendanceDto,
} from './dto/attendance.dto';
import type { User } from '@prisma/client';
import { AttendanceAccessPolicy } from '../policies/attendance-access.policy';
import { Role } from 'src/common';
import { successResponse } from '../../utilies/response';
import { handlePrismaError } from '../../utilies/error-handler';
import { getUserLocalDateString } from '../common/helpers/date.helper';
import {
  calculateSkip,
  createPaginatedResult,
  normalizePaginationParams,
} from '../common/helpers/pagination.helper';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private attendanceAccessPolicy: AttendanceAccessPolicy,
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

  async create(currentUser: User, createAttendanceDto: CreateAttendanceDto) {
    try {
      await this.attendanceAccessPolicy.canCreate(
        currentUser,
        createAttendanceDto.userId,
      );

      const attendanceRecord = await this.prisma.attendanceRecord.create({
        data: {
          userId: createAttendanceDto.userId,
          date: new Date(createAttendanceDto.date),
          clockInAt: createAttendanceDto.clockInAt
            ? new Date(createAttendanceDto.clockInAt)
            : null,
          clockOutAt: createAttendanceDto.clockOutAt
            ? new Date(createAttendanceDto.clockOutAt)
            : null,
          note: createAttendanceDto.note,
        },
        include: {
          user: true,
        },
      });

      return successResponse(
        attendanceRecord,
        'Attendance record created successfully',
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

      // Calculate total work hours for this attendance record
      const workHours =
        attendanceRecord.clockInAt && attendanceRecord.clockOutAt
          ? (attendanceRecord.clockOutAt.getTime() -
              attendanceRecord.clockInAt.getTime()) /
            (1000 * 60 * 60)
          : 8; // Default to 8 hours if times are missing

      // Generate 2-5 random tasks
      const numberOfTasks = Math.floor(Math.random() * 4) + 2; // Random number between 2-5
      const selectedTasks = this.getRandomTasks(roleTasks, numberOfTasks);

      // Calculate remaining hours to distribute
      // Each task has a minimum duration of 1 hour and maximum of 3 hours
      const minDurationHours = 1; // 1 hour minimum
      const maxDurationHours = 3; // 3 hours maximum

      const createdTasks: any[] = [];

      for (let i = 0; i < selectedTasks.length; i++) {
        // Generate random duration between 1 and 3 hours
        const randomDuration =
          minDurationHours +
          Math.random() * (maxDurationHours - minDurationHours);
        const taskDuration = Math.round(randomDuration * 100) / 100; // Round to 2 decimal places

        // Create the task
        const task = await this.prisma.task.create({
          data: {
            title: selectedTasks[i].name,
            description: `Completed task: ${selectedTasks[i].name}`,
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

        createdTasks.push(task);
        
        console.log(
          `Task ${i + 1}: ${selectedTasks[i].name} - ${taskDuration} hours`,
        );
      }

      console.log(
        `Created ${createdTasks.length} tasks for attendance record ${attendanceRecord.id}`,
      );
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
}
