import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import {
  RequireSystemManagement,
  RequirePermissions,
} from '../common/decorators/permissions.decorator';
import {
  PermissionModule,
  PermissionAction,
} from '../common/enums/permission.enum';
import { successResponse } from '../../utilies/response';
import { handlePrismaError } from '../../utilies/error-handler';

export class GrantPermissionDto {
  userId: number;
  permissionName: string;
}

export class RevokePermissionDto {
  userId: number;
  permissionName: string;
}

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionController {
  constructor(private permissionService: PermissionService) {}

  @Get()
  @RequirePermissions({
    module: PermissionModule.PERMISSIONS,
    action: PermissionAction.READ,
  })
  async getAllPermissions() {
    try {
      const permissions = await this.permissionService.getAllPermissions();
      return successResponse(
        permissions,
        'Permissions retrieved successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

 

  @Post('initialize')
  @RequireSystemManagement()
  async initializePermissions() {
    try {
      await this.permissionService.initializePermissions();
      return successResponse(null, 'Permissions initialized successfully', 200);
    } catch (error) {
      handlePrismaError(error);
    }
  }
}
