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

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private attendanceAccessPolicy: AttendanceAccessPolicy,
  ) {}

  async clockIn(userId: number, clockInDto: ClockInDto) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const existingRecord = await this.prisma.attendanceRecord.findUnique({
        where: {
          userId_date: {
            userId,
            date: today,
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
            date: today,
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
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const existingRecord = await this.prisma.attendanceRecord.findUnique({
        where: {
          userId_date: {
            userId: currentUser.id,
            date: today,
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
      today.setHours(0, 0, 0, 0);

      let attendanceRecords;

      if (currentUser.role === Role.SUPER_ADMIN) {
        attendanceRecords = await this.prisma.attendanceRecord.findMany({
          where: {
            date: today,
          },
          include: {
            user: true,
          },
        });
      } else {
        attendanceRecords = await this.prisma.attendanceRecord.findMany({
          where: {
            user: { companyId: currentUser.companyId },
            date: today,
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
}
