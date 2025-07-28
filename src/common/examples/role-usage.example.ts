/**
 * Centralized Role Enum Usage Examples
 *
 * This file demonstrates how to properly import and use the centralized Role enum
 * across different parts of the TTC System.
 */

// Example 1: Importing in a DTO
// or alternatively: import { Role } from '../common';

// Example 2: Using in validation decorators
import { IsEnum } from 'class-validator';
import { Role } from '../enums';
import { RolesGuard } from 'src/auth/guards/roles.guard';

export class ExampleDto {
  @IsEnum(Role)
  role: RolesGuard;
}

// Example 3: Using in service logic
export class ExampleService {
  checkUserPermissions(userRole: Role) {
    switch (userRole) {
      case Role.SUPER_ADMIN:
        return 'Full access to all resources';
      case Role.COMPANY_ADMIN:
        return 'Access to company resources only';
      case Role.EMPLOYEE:
        return 'Access to own resources only';
      default:
        return 'No access';
    }
  }
}

// Example 4: Using in guards and decorators

// In a controller method:
// @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
// @Get('some-endpoint')
// someMethod() { ... }

/**
 * Benefits of centralized Role enum:
 *
 * 1. Single source of truth for role definitions
 * 2. Consistent imports across the application
 * 3. Easy to maintain and update roles
 * 4. Type safety throughout the application
 * 5. Better IDE support with autocomplete
 */
