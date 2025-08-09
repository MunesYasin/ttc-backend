import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  findAll(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    if (user.role === Role.SUPER_ADMIN) {
      const pageNumber = page ? parseInt(page, 10) : 1;
      const limitNumber = limit ? parseInt(limit, 10) : 10;
      return this.usersService.findAll(pageNumber, limitNumber, search);
    } else {
      return this.usersService.findByCompany(user.companyId, user);
    }
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.usersService.findOne(id, user);
  }

  @Get('company-reports/statistics')
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  async getEmployeeStatistics(
    @CurrentUser() user: User,
    @Query('filterType') filterType?: string,
    @Query('filterValue') filterValue?: string,
    @Query('companyId') companyId?: string,
  ) {
    const companyIdNumber = companyId ? parseInt(companyId, 10) : undefined;
    return this.usersService.getEmployeeStatistics(
      user,
      filterType,
      filterValue,
      companyIdNumber,
    );
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: User,
  ) {
    return this.usersService.update(id, updateUserDto, user);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.usersService.remove(id, user);
  }

  @Get('get/profile')
  @Roles(Role.EMPLOYEE, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  getProfile(@CurrentUser() user: User) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('update/profile')
  @Roles(Role.EMPLOYEE, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  updateProfile(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(user.id, updateUserDto);
  }
}
