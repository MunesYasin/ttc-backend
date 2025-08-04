import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('employee')
  @Roles(Role.EMPLOYEE)
  getEmployeeDashboard(@CurrentUser() user: User) {
    return this.dashboardService.getEmployeeDashboard(user);
  }

  @Get('company-admin')
  @Roles(Role.COMPANY_ADMIN)
  getCompanyAdminDashboard(@CurrentUser() user: User) {
    return this.dashboardService.getCompanyAdminDashboard(user);
  }

  @Get('company-admin/top-performers')
  @Roles(Role.COMPANY_ADMIN)
  getTopPerformersToday(@CurrentUser() user: User) {
    return this.dashboardService.getTopPerformersToday(user);
  }

  @Get('company-admin/recent-tasks')
  @Roles(Role.COMPANY_ADMIN)
  getRecentCompanyTasks(@CurrentUser() user: User) {
    return this.dashboardService.getRecentCompanyTasks(user);
  }

  @Get('employee/quick-stats')
  @Roles(Role.EMPLOYEE)
  getEmployeeQuickStats(@CurrentUser() user: User) {
    return this.dashboardService.getQuickStats(user.id);
  }

  @Get('employee/analytics/performance')
  @Roles(Role.EMPLOYEE)
  getPerformanceAnalytics(@CurrentUser() user: User) {
    return this.dashboardService.getPerformanceAnalytics(user.id);
  }
}
