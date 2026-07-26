import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { TaskGateway } from './task.gateway';

@Module({
  imports: [AuthModule, RedisModule],
  controllers: [TaskController],
  providers: [TaskService, TaskGateway],
})
export class TaskModule {}
