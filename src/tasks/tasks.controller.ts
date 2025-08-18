import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, TaskQueryDto } from './dto/task.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';

@Controller('tasks')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles(Role.EMPLOYEE, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  create(@Body() createTaskDto: CreateTaskDto) {
    // Note: attendanceRecordId must be provided in the request body
    // The service will validate that the user has access to that attendance record
    return this.tasksService.create(createTaskDto);
  }

  @Get('my-tasks')
  @Roles(Role.EMPLOYEE, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  getMyTasks(@CurrentUser() user: User, @Query() query: TaskQueryDto) {
    const start = query.startDate ? new Date(query.startDate) : undefined;
    const end = query.endDate ? new Date(query.endDate) : undefined;
    const pageNum = query.page || 1;
    const limitNum = query.limit || 10;
    return this.tasksService.findByUser(
      user,
      start,
      end,
      pageNum,
      limitNum,
      query.search,
    );
  }

  @Get('my-tasks/stats')
  @Roles(Role.EMPLOYEE, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  getMyTaskStats(@CurrentUser() user: User) {
    return this.tasksService.getTaskStats(user.id);
  }

  @Get(':id')
  @Roles(Role.EMPLOYEE, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.tasksService.findOne(user, id);
  }

  @Patch(':id')
  @Roles(Role.EMPLOYEE, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.update(user, id, updateTaskDto);
  }

  @Put(':id/status')
  @Roles(Role.EMPLOYEE, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  updateTaskStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() statusDto: { status: string },
    @CurrentUser() user: User,
  ) {
    return this.tasksService.updateTaskStatus(user, id, statusDto.status);
  }

  @Delete(':id')
  @Roles(Role.EMPLOYEE, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.tasksService.remove(user, id);
  }
}
