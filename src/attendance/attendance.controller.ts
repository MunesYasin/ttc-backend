import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceAccessPolicy } from '../policies/attendance-access.policy';
import {
  ClockInDto,
  ClockOutDto,
  CreateAttendanceDto,
  CreateBulkAttendanceDto,
  BulkAttendanceResponse,
  SingleAttendanceResponse,
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
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly attendanceAccessPolicy: AttendanceAccessPolicy,
  ) {}

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
  @Roles(Role.SUPER_ADMIN)
  createAttendance(
    @Body() createAttendanceDto: CreateAttendanceDto,
  ): Promise<SingleAttendanceResponse> {
    return this.attendanceService.create(createAttendanceDto);
  }

  @Post('bulk-create')
  @Roles(Role.SUPER_ADMIN)
  createBulkAttendance(
    @Body() createBulkAttendanceDto: CreateBulkAttendanceDto,
  ): Promise<BulkAttendanceResponse> {
    return this.attendanceService.createBulk(createBulkAttendanceDto);
  }

  @Get('employee-hours')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  getEmployeeHours(
    @CurrentUser() user: User,
    @Query('companyId') companyId?: string,
    @Query('page') page?: string,
    @Query('filterType') filterType?: string,
    @Query('filterValue') filterValue?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const companyIdNumber = companyId ? parseInt(companyId, 10) : undefined;

    return this.attendanceService.getEmployeeHoursByDateRangeWithAccess(
      user,
      companyIdNumber,
      pageNum,
      filterType,
      filterValue,
      search,
    );
  }
}
