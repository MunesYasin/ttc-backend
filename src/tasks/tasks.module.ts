import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TaskAccessPolicy } from '../policies/task-access.policy';

@Module({
  imports: [PrismaModule],
  controllers: [TasksController],
  providers: [TasksService, TaskAccessPolicy],
  exports: [TasksService],
})
export class TasksModule {}
