import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionModule } from '../permissions/permission.module';
import { EmployeeAccessPolicy } from 'src/policies/employee-access.policy';

@Module({
  imports: [PrismaModule, PermissionModule],
  controllers: [UsersController],
  providers: [UsersService, EmployeeAccessPolicy],
  exports: [UsersService],
})
export class UsersModule {}
