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

@Controller('companies')
@UseGuards(RolesGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  findAll() {
    return this.companiesService.findAll();
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  async findOne(@Param('id') id: number, @CurrentUser() user: User) {
    return this.companiesService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  async update(
    @Param('id') id: number,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @CurrentUser() user: User,
  ) {
    return this.companiesService.update(id, updateCompanyDto, user);
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
