import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ClockInDto,
  ClockOutDto,
  CreateAttendanceDto,
} from './dto/attendance.dto';
import type { AttendanceRecord, User } from '@prisma/client';
import { AttendanceAccessPolicy } from '../policies/attendance-access.policy';
import { Role } from 'src/common';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private attendanceAccessPolicy: AttendanceAccessPolicy,
  ) {}

  async clockIn(
    userId: string,
    clockInDto: ClockInDto,
  ): Promise<AttendanceRecord> {
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

    if (existingRecord) {
      return this.prisma.attendanceRecord.update({
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
      return this.prisma.attendanceRecord.create({
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
  }

  async clockOut(
    currentUser: User,
    clockOutDto: ClockOutDto,
  ): Promise<AttendanceRecord> {
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

    return this.prisma.attendanceRecord.update({
      where: { id: existingRecord.id },
      data: {
        clockOutAt: clockOutTime,
        note: clockOutDto.note || existingRecord.note,
      },
      include: {
        user: true,
      },
    });
  }

  async getTodayAttendance(
    currentUser: User,
  ): Promise<AttendanceRecord[] | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (currentUser.role === Role.SUPER_ADMIN) {
      return this.prisma.attendanceRecord.findMany({
        where: {
          date: today,
        },
        include: {
          user: true,
        },
      });
    }

    return this.prisma.attendanceRecord.findMany({
      where: {
        user: { companyId: currentUser.companyId },
        date: today,
      },
      include: {
        user: true,
      },
    });
  }

  async getUserAttendance(
    currentUser: User,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AttendanceRecord[]> {
    const where: any = { userId: currentUser.id };
    if (startDate || endDate) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where.date = {};
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (startDate) where.date.gte = startDate;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (endDate) where.date.lte = endDate;
    }

    return this.prisma.attendanceRecord.findMany({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where,
      include: {
        user: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async create(
    currentUser: User,
    createAttendanceDto: CreateAttendanceDto,
  ): Promise<AttendanceRecord> {
    await this.attendanceAccessPolicy.canCreate(
      currentUser,
      createAttendanceDto.userId,
    );

    return this.prisma.attendanceRecord.create({
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
  }
}
