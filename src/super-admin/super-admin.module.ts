import { Module } from '@nestjs/common';
import { SuperAdminController } from './super-admin.controller';
import { CompaniesModule } from '../companies/companies.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [CompaniesModule, UsersModule],
  controllers: [SuperAdminController],
})
export class SuperAdminModule {}
