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

@Controller('attendance')
@UseGuards(RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  @Roles(Role.EMPLOYEE)
  clockIn(@CurrentUser() user: User, @Body() clockInDto: ClockInDto) {
    return this.attendanceService.clockIn(user.id, clockInDto);
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
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.attendanceService.getUserAttendance(user, start, end);
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
