export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage', // Full control over a module
}

export enum PermissionModule {
  USERS = 'users',
  COMPANIES = 'companies',
  ATTENDANCE = 'attendance',
  REPORTS = 'reports',
  TASKS = 'tasks',
  EMPLOYEE_ROLES = 'employee_roles',
  PERMISSIONS = 'permissions',
  SYSTEM = 'system',
}

export interface PermissionDefinition {
  name: string;
  description: string;
  module: PermissionModule;
  action: PermissionAction;
}

// Define all available permissions in the system
export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // User Management Permissions
  {
    name: 'users.create',
    description: 'Create new users',
    module: PermissionModule.USERS,
    action: PermissionAction.CREATE,
  },
  {
    name: 'users.read',
    description: 'View users and user details',
    module: PermissionModule.USERS,
    action: PermissionAction.READ,
  },
  {
    name: 'users.update',
    description: 'Update user information',
    module: PermissionModule.USERS,
    action: PermissionAction.UPDATE,
  },
  {
    name: 'users.delete',
    description: 'Delete users',
    module: PermissionModule.USERS,
    action: PermissionAction.DELETE,
  },
  {
    name: 'users.manage',
    description: 'Full control over user management',
    module: PermissionModule.USERS,
    action: PermissionAction.MANAGE,
  },

  // Company Management Permissions
  {
    name: 'companies.create',
    description: 'Create new companies',
    module: PermissionModule.COMPANIES,
    action: PermissionAction.CREATE,
  },
  {
    name: 'companies.read',
    description: 'View companies and company details',
    module: PermissionModule.COMPANIES,
    action: PermissionAction.READ,
  },
  {
    name: 'companies.update',
    description: 'Update company information',
    module: PermissionModule.COMPANIES,
    action: PermissionAction.UPDATE,
  },
  {
    name: 'companies.delete',
    description: 'Delete companies',
    module: PermissionModule.COMPANIES,
    action: PermissionAction.DELETE,
  },
  {
    name: 'companies.manage',
    description: 'Full control over company management',
    module: PermissionModule.COMPANIES,
    action: PermissionAction.MANAGE,
  },

  // Attendance Management Permissions
  {
    name: 'attendance.create',
    description: 'Create attendance records',
    module: PermissionModule.ATTENDANCE,
    action: PermissionAction.CREATE,
  },
  {
    name: 'attendance.read',
    description: 'View attendance records',
    module: PermissionModule.ATTENDANCE,
    action: PermissionAction.READ,
  },
  {
    name: 'attendance.update',
    description: 'Update attendance records',
    module: PermissionModule.ATTENDANCE,
    action: PermissionAction.UPDATE,
  },
  {
    name: 'attendance.delete',
    description: 'Delete attendance records',
    module: PermissionModule.ATTENDANCE,
    action: PermissionAction.DELETE,
  },
  {
    name: 'attendance.manage',
    description: 'Full control over attendance management',
    module: PermissionModule.ATTENDANCE,
    action: PermissionAction.MANAGE,
  },

  // Reports Permissions
  {
    name: 'reports.create',
    description: 'Generate reports',
    module: PermissionModule.REPORTS,
    action: PermissionAction.CREATE,
  },
  {
    name: 'reports.read',
    description: 'View reports',
    module: PermissionModule.REPORTS,
    action: PermissionAction.READ,
  },
  {
    name: 'reports.update',
    description: 'Update report settings',
    module: PermissionModule.REPORTS,
    action: PermissionAction.UPDATE,
  },
  {
    name: 'reports.delete',
    description: 'Delete reports',
    module: PermissionModule.REPORTS,
    action: PermissionAction.DELETE,
  },

  // Task Management Permissions
  {
    name: 'tasks.create',
    description: 'Create tasks',
    module: PermissionModule.TASKS,
    action: PermissionAction.CREATE,
  },
  {
    name: 'tasks.read',
    description: 'View tasks',
    module: PermissionModule.TASKS,
    action: PermissionAction.READ,
  },
  {
    name: 'tasks.update',
    description: 'Update tasks',
    module: PermissionModule.TASKS,
    action: PermissionAction.UPDATE,
  },
  {
    name: 'tasks.delete',
    description: 'Delete tasks',
    module: PermissionModule.TASKS,
    action: PermissionAction.DELETE,
  },

  // Employee Roles Permissions
  {
    name: 'employee_roles.create',
    description: 'Create employee roles',
    module: PermissionModule.EMPLOYEE_ROLES,
    action: PermissionAction.CREATE,
  },
  {
    name: 'employee_roles.read',
    description: 'View employee roles',
    module: PermissionModule.EMPLOYEE_ROLES,
    action: PermissionAction.READ,
  },
  {
    name: 'employee_roles.update',
    description: 'Update employee roles',
    module: PermissionModule.EMPLOYEE_ROLES,
    action: PermissionAction.UPDATE,
  },
  {
    name: 'employee_roles.delete',
    description: 'Delete employee roles',
    module: PermissionModule.EMPLOYEE_ROLES,
    action: PermissionAction.DELETE,
  },

  // Permission Management (Admin only)
  {
    name: 'permissions.create',
    description: 'Create permissions',
    module: PermissionModule.PERMISSIONS,
    action: PermissionAction.CREATE,
  },
  {
    name: 'permissions.read',
    description: 'View permissions',
    module: PermissionModule.PERMISSIONS,
    action: PermissionAction.READ,
  },
  {
    name: 'permissions.update',
    description: 'Update permissions',
    module: PermissionModule.PERMISSIONS,
    action: PermissionAction.UPDATE,
  },
  {
    name: 'permissions.delete',
    description: 'Delete permissions',
    module: PermissionModule.PERMISSIONS,
    action: PermissionAction.DELETE,
  },
  {
    name: 'permissions.manage',
    description: 'Full control over permission system',
    module: PermissionModule.PERMISSIONS,
    action: PermissionAction.MANAGE,
  },

  // System Administration
  {
    name: 'system.manage',
    description: 'Full system administration access',
    module: PermissionModule.SYSTEM,
    action: PermissionAction.MANAGE,
  },
];

// Default permissions for each role
export const DEFAULT_ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    'system.manage',
    'users.manage',
    'companies.manage',
    'attendance.manage',
    'reports.create',
    'reports.read',
    'reports.update',
    'reports.delete',
    'tasks.create',
    'tasks.read',
    'tasks.update',
    'tasks.delete',
    'employee_roles.create',
    'employee_roles.read',
    'employee_roles.update',
    'employee_roles.delete',
    'permissions.manage',
  ],
  COMPANY_ADMIN: [
    'users.create',
    'users.read',
    'users.update',
    'users.delete',
    'companies.read',
    'companies.update',
    'attendance.create',
    'attendance.read',
    'attendance.update',
    'attendance.delete',
    'reports.create',
    'reports.read',
    'tasks.create',
    'tasks.read',
    'tasks.update',
    'tasks.delete',
    'employee_roles.read',
  ],
  EMPLOYEE: [
    'attendance.create',
    'attendance.read',
    'attendance.update',
    'tasks.create',
    'tasks.read',
    'tasks.update',
    'reports.read',
  ],
};
