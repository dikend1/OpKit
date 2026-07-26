import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { TaskGateway } from './task.gateway';

@Module({
  imports: [AuthModule],
  controllers: [TaskController],
  providers: [TaskService, TaskGateway],
})
export class TaskModule {}
