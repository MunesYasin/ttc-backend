import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AttendanceAccessPolicy } from '../policies/attendance-access.policy';

@Module({
  imports: [PrismaModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceAccessPolicy],
  exports: [AttendanceService],
})
export class AttendanceModule {}
