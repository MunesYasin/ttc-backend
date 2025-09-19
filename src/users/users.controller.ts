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
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  CreateBulkUsersDto,
} from './dto/user.dto';
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

  @Post('bulk')
  @Roles(Role.SUPER_ADMIN)
  createBulk(@Body() createBulkUsersDto: CreateBulkUsersDto) {
    return this.usersService.createBulk(createBulkUsersDto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  findAll(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('companyId') companyId?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    const companyIdNumber = companyId ? parseInt(companyId, 10) : undefined;
    
    // Both SUPER_ADMIN and COMPANY_ADMIN can use findAll with proper access control
    if (companyIdNumber || user.role === Role.SUPER_ADMIN) {
      return this.usersService.findAll(pageNumber, limitNumber, search, companyIdNumber, user);
    } else {
      // If no companyId specified and user is COMPANY_ADMIN, use their own company
      if (user.companyId) {
        return this.usersService.findByCompany(user.companyId, user);
      } else {
        throw new ForbiddenException('User has no company associated');
      }
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
    @Query('search') search?: string,
  ) {
    const companyIdNumber = companyId ? parseInt(companyId, 10) : undefined;
    return this.usersService.getEmployeeStatistics(
      user,
      filterType,
      filterValue,
      companyIdNumber,
      search,
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
