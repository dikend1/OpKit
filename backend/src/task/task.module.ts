import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { TaskGateway } from './task.gateway';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'opkit-dev-secret',
    }),
  ],
  controllers: [TaskController],
  providers: [TaskService, TaskGateway],
})
export class TaskModule {}
