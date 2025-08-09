import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { EmployeeRolesService } from './employee-roles.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employee-roles')
export class EmployeeRolesController {
  constructor(private readonly employeeRolesService: EmployeeRolesService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  async getAllEmployeeRoles() {
    return this.employeeRolesService.getAllEmployeeRoles();
  }

  @Get('tasks/all')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  async getAllRoleTasks() {
    return this.employeeRolesService.getAllRoleTasks();
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  async getEmployeeRoleById(@Param('id', ParseIntPipe) id: number) {
    return this.employeeRolesService.getEmployeeRoleById(id);
  }

  @Get(':id/tasks')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  async getRoleTasksByEmployeeRoleId(
    @Param('id', ParseIntPipe) employeeRoleId: number,
  ) {
    return this.employeeRolesService.getRoleTasksByEmployeeRoleId(
      employeeRoleId,
    );
  }
}
