export class EmployeeRoleDto {
  id: number;
  name: string;
}

export class RoleTaskDto {
  id: number;
  name: string;
  employeeRolesId: number;
}

export class EmployeeRoleWithTasksDto extends EmployeeRoleDto {
  roleTasks: RoleTaskDto[];
}
