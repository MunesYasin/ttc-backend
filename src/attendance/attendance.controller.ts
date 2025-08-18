import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import {
  ClockInDto,
  ClockOutDto,
  CreateAttendanceDto,
} from './dto/attendance.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { normalizePaginationParams } from '../common/helpers/pagination.helper';

@Controller('attendance')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  @Roles(Role.EMPLOYEE)
  clockIn(@CurrentUser() user: User, @Body() clockInDto: ClockInDto) {
    return this.attendanceService.clockIn(user, clockInDto);
  }

  @Post('clock-out')
  @Roles(Role.EMPLOYEE)
  clockOut(@CurrentUser() user: User, @Body() clockOutDto: ClockOutDto) {
    return this.attendanceService.clockOut(user, clockOutDto);
  }

  @Get('today')
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  getTodayAttendance(@CurrentUser() user: User) {
    return this.attendanceService.getTodayAttendance(user);
  }

  @Get('my-records')
  @Roles(Role.EMPLOYEE)
  getMyAttendance(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    // Use pagination helper to normalize parameters
    const { page: normalizedPage, limit: normalizedLimit } =
      normalizePaginationParams(page, limit);

    return this.attendanceService.getUserAttendance(
      user,
      start,
      end,
      normalizedPage,
      normalizedLimit,
      search,
    );
  }

  @Get('my-stats')
  @Roles(Role.EMPLOYEE)
  getMyAttendanceStats(@CurrentUser() user: User) {
    return this.attendanceService.getAttendanceStats(user.id);
  }

  @Get('my-today')
  @Roles(Role.EMPLOYEE)
  getMyTodayAttendance(@CurrentUser() user: User) {
    return this.attendanceService.getTodayAttendanceForUser(user.id);
  }

  @Post('time-off')
  @Roles(Role.EMPLOYEE)
  requestTimeOff(
    @CurrentUser() user: User,
    @Body()
    timeOffDto: {
      startDate: string;
      endDate: string;
      type: string;
      reason: string;
    },
  ) {
    return this.attendanceService.requestTimeOff(user.id, timeOffDto);
  }

  @Get('time-off')
  @Roles(Role.EMPLOYEE)
  getTimeOffRequests(@CurrentUser() user: User) {
    return this.attendanceService.getTimeOffRequests(user.id);
  }

  @Post('create')
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  createAttendance(
    @CurrentUser() user: User,
    @Body() createAttendanceDto: CreateAttendanceDto,
  ) {
    return this.attendanceService.create(user, createAttendanceDto);
  }
}
