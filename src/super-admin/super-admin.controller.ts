import { Controller, Get, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CompaniesService } from '../companies/companies.service';
import { UsersService } from '../users/users.service';

@Controller('super-admin')
@UseGuards(RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class SuperAdminController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly usersService: UsersService,
  ) {}

  @Get('companies')
  getAllCompanies() {
    return this.companiesService.findAll();
  }

  @Get('users')
  getAllUsers() {
    return this.usersService.findAll();
  }

  @Get('dashboard')
  async getDashboard() {
    const companiesResponse = await this.companiesService.findAll();
    const usersResponse = await this.usersService.findAll();

    const companies = companiesResponse.data;
    const users = usersResponse.data;

    return {
      totalCompanies: companies.length,
      totalUsers: users.length,
      companiesWithUserCounts: companies.map((company) => ({
        id: company.id,
        name: company.name,
        userCount: users.filter((user) => user.companyId === company.id).length,
      })),
      usersByRole: {
        superAdmins: users.filter((user) => user.role === Role.SUPER_ADMIN)
          .length,
        companyAdmins: users.filter((user) => user.role === Role.COMPANY_ADMIN)
          .length,
        employees: users.filter((user) => user.role === Role.EMPLOYEE).length,
      },
    };
  }
}
