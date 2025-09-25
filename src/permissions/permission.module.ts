import { Module } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { PermissionController } from './permission.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [PermissionService, PrismaService],
  controllers: [PermissionController],
  exports: [PermissionService],
})
export class PermissionModule {}
