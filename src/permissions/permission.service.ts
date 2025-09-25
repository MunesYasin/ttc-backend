import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import {
  PERMISSION_DEFINITIONS,
  DEFAULT_ROLE_PERMISSIONS,
  PermissionAction,
  PermissionModule,
} from '../common/enums/permission.enum';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  // Initialize permissions in the database
  async initializePermissions() {
    console.log('Initializing permissions...');

    // Create all permissions
    for (const permDef of PERMISSION_DEFINITIONS) {
      await this.prisma.permission.upsert({
        where: { name: permDef.name },
        update: {
          description: permDef.description,
          module: permDef.module,
          action: permDef.action,
        },
        create: {
          name: permDef.name,
          description: permDef.description,
          module: permDef.module,
          action: permDef.action,
        },
      });
    }

    // Create default role permissions
    for (const [roleName, permissionNames] of Object.entries(
      DEFAULT_ROLE_PERMISSIONS,
    )) {
      for (const permissionName of permissionNames) {
        const permission = await this.prisma.permission.findUnique({
          where: { name: permissionName },
        });
      }
    }

    console.log('Permissions initialized successfully!');
  }

  // Get all permissions for a user (from role + individual permissions)
  async getUserPermissions(userId: number): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subRole: {
          include: {
            subRolePermission: { include: { permission: true } },
          },
        },
      },
    });

    if (!user) {
      return [];
    }

    const permissions = new Set<string>();

    // Add/remove individual user permissions
    user.subRole?.subRolePermission.forEach((up) => {
      if (up.granted) {
        permissions.add(up.permission.name);
      } else {
        permissions.delete(up.permission.name);
      }
    });
console.log(permissions , "---------------");

    return Array.from(permissions);
  }

  // Check if user has permission for a module and action
  async hasModulePermission(
    userId: number,
    module: PermissionModule,
    action: PermissionAction,
  ): Promise<boolean> {
    const permissionName = `${module}.${action}`;
    const managePermissionName = `${module}.manage`;
console.log("-==============================================");

    const userPermissions = await this.getUserPermissions(userId);

    // Check for specific permission or manage permission
    return (
      userPermissions.includes(permissionName) ||
      userPermissions.includes(managePermissionName)
    );
  }

  // Get all available permissions
  async getAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
  }
}
