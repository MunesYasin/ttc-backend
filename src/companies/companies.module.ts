import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CompanyAccessPolicy } from '../policies/company-access.policy';
import { PermissionModule } from 'src/permissions/permission.module';

@Module({
  imports: [PrismaModule, PermissionModule],
  controllers: [CompaniesController],
  providers: [CompaniesService, CompanyAccessPolicy],
  exports: [CompaniesService],
})
export class CompaniesModule {}
