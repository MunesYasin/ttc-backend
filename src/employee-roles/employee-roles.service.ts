import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { successResponse } from '../../utilies/response';
import {
  EmployeeRoleDto,
  RoleTaskDto,
  EmployeeRoleWithTasksDto,
} from './dto/employee-roles.dto';

@Injectable()
export class EmployeeRolesService {
  constructor(private prisma: PrismaService) {}

  async getAllEmployeeRoles() {
    const employeeRoles = await this.prisma.employeeRoles.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return successResponse(
      employeeRoles,
      'Employee roles retrieved successfully',
      200,
    );
  }

  async getEmployeeRoleById(id: number) {
    const employeeRole = await this.prisma.employeeRoles.findUnique({
      where: { id },
      include: {
        roleTasks: {
          orderBy: {
            name: 'asc',
          },
        },
      },
    });

    if (!employeeRole) {
      return successResponse(null, 'Employee role not found', 404);
    }

    return successResponse(
      employeeRole,
      'Employee role retrieved successfully',
      200,
    );
  }

  async getAllRoleTasks() {
    const roleTasks = await this.prisma.roleTasks.findMany({
      orderBy: [
        {
          employeeRolesId: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });

    return successResponse(roleTasks, 'Role tasks retrieved successfully', 200);
  }

  async getRoleTasksByEmployeeRoleId(employeeRoleId: number) {
    const roleTasks = await this.prisma.roleTasks.findMany({
      where: {
        employeeRolesId: employeeRoleId,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return successResponse(
      roleTasks,
      'Employee role tasks retrieved successfully',
      200,
    );
  }
}
