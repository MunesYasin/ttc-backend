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
          user: true,
        },
      });

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

  async getUserAttendance(currentUser: User, startDate?: Date, endDate?: Date) {
    try {
      const where: any = { userId: currentUser.id };
      if (startDate || endDate) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        where.date = {};
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (startDate) where.date.gte = startDate;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (endDate) where.date.lte = endDate;
      }

      const attendanceRecords = await this.prisma.attendanceRecord.findMany({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where,
        include: {
          user: true,
        },
        orderBy: {
          date: 'desc',
        },
      });

      return successResponse(
        attendanceRecords,
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
      const thisMonth = new Date();
      thisMonth.setDate(1);

      const records = await this.prisma.attendanceRecord.findMany({
        where: {
          userId,
          date: {
            gte: thisMonth,
          },
        },
      });

      const totalDays = records.length;
      const presentDays = records.filter((r) => r.clockInAt).length;
      const completeDays = records.filter(
        (r) => r.clockInAt && r.clockOutAt,
      ).length;

      const totalHours = records.reduce((sum, record) => {
        if (record.clockInAt && record.clockOutAt) {
          const hours =
            (record.clockOutAt.getTime() - record.clockInAt.getTime()) /
            (1000 * 60 * 60);
          return sum + hours;
        }
        return sum;
      }, 0);

      const stats = {
        thisMonth: {
          totalDays,
          presentDays,
          completeDays,
          totalHours: Math.round(totalHours * 100) / 100,
          averageHours:
            completeDays > 0
              ? Math.round((totalHours / completeDays) * 100) / 100
              : 0,
          attendanceRate:
            totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
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
