import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';

@Controller('companies')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.companiesService.findAll(pageNumber, limitNumber, search);
  }

  @Get('my-company')
  @Roles(Role.COMPANY_ADMIN)
  getMyCompany(@CurrentUser() user: User) {
    return this.companiesService.getMyCompany(user);
  }

  @Get('my-company/employees')
  @Roles(Role.COMPANY_ADMIN)
  getMyCompanyEmployees(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const pageLimit = limit ? parseInt(limit, 10) : 10;
    return this.companiesService.getMyCompanyEmployees(
      user,
      pageNumber,
      pageLimit,
      search,
    );
  }

  @Get('my-company/user-reports')
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  getMyCompanyUserReports(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('filterType') filterType?: string,
    @Query('filterValue') filterValue?: string,
    @Query('search') search?: string,
    @Query('companyId') companyId?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const companyIdNumber = companyId ? parseInt(companyId, 10) : undefined;
    return this.companiesService.getMyCompanyUserReports(
      user,
      pageNumber,
      filterType,
      filterValue,
      search,
      companyIdNumber,
    );
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  async findOne(@Param('id') id: number, @CurrentUser() user: User) {
    return this.companiesService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  async update(
    @Param('id') id: number,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: number, @CurrentUser() user: User) {
    return this.companiesService.remove(id, user);
  }

  @Get(':id/report/daily')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  getDailyReport(
    @Param('id') id: number,
    @Query('date') date: string,
    @CurrentUser() user: User,
  ) {
    const reportDate = date ? new Date(date) : new Date();
    return this.companiesService.generateDailyReport(id, reportDate, user);
  }
}
