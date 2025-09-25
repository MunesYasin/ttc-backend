import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { AttendanceModule } from './attendance/attendance.module';
import { TasksModule } from './tasks/tasks.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EmployeeRolesModule } from './employee-roles/employee-roles.module';
import { PermissionModule } from './permissions/permission.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    AttendanceModule,
    TasksModule,
    SuperAdminModule,
    DashboardModule,
    NotificationsModule,
    EmployeeRolesModule,
    PermissionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
