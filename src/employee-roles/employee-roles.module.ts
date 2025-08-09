import { Module } from '@nestjs/common';
import { EmployeeRolesController } from './employee-roles.controller';
import { EmployeeRolesService } from './employee-roles.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EmployeeRolesController],
  providers: [EmployeeRolesService],
  exports: [EmployeeRolesService],
})
export class EmployeeRolesModule {}
