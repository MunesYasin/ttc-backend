import { SetMetadata } from '@nestjs/common';
import { PermissionModule, PermissionAction } from '../enums/permission.enum';

export const PERMISSIONS_KEY = 'permissions';

export interface RequiredPermission {
  module: PermissionModule;
  action: PermissionAction;
}

export const RequirePermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// Convenience decorators for common permission patterns
export const RequireUserManagement = () =>
  RequirePermissions({
    module: PermissionModule.USERS,
    action: PermissionAction.MANAGE,
  });

export const RequireUserRead = () =>
  RequirePermissions({
    module: PermissionModule.USERS,
    action: PermissionAction.READ,
  });

export const RequireUserCreate = () =>
  RequirePermissions({
    module: PermissionModule.USERS,
    action: PermissionAction.CREATE,
  });

export const RequireUserUpdate = () =>
  RequirePermissions({
    module: PermissionModule.USERS,
    action: PermissionAction.UPDATE,
  });

export const RequireUserDelete = () =>
  RequirePermissions({
    module: PermissionModule.USERS,
    action: PermissionAction.DELETE,
  });

export const RequireCompanyManagement = () =>
  RequirePermissions({
    module: PermissionModule.COMPANIES,
    action: PermissionAction.MANAGE,
  });

export const RequireCompanyRead = () =>
  RequirePermissions({
    module: PermissionModule.COMPANIES,
    action: PermissionAction.READ,
  });

export const RequireCompanyCreate = () =>
  RequirePermissions({
    module: PermissionModule.COMPANIES,
    action: PermissionAction.CREATE,
  });

export const RequireAttendanceManagement = () =>
  RequirePermissions({
    module: PermissionModule.ATTENDANCE,
    action: PermissionAction.MANAGE,
  });

export const RequireAttendanceRead = () =>
  RequirePermissions({
    module: PermissionModule.ATTENDANCE,
    action: PermissionAction.READ,
  });

export const RequireReportsRead = () =>
  RequirePermissions({
    module: PermissionModule.REPORTS,
    action: PermissionAction.READ,
  });

export const RequireSystemManagement = () =>
  RequirePermissions({
    module: PermissionModule.SYSTEM,
    action: PermissionAction.MANAGE,
  });
