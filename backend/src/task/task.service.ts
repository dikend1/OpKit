import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskCreatedEvent, TaskDeletedEvent, TaskUpdatedEvent } from './task-events';

@Injectable()
export class TaskService {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  findAll(userId: string) {
    return this.db.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const task = await this.db.task.findFirst({ where: { id, userId } });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async create(userId: string, dto: CreateTaskDto) {
    const task = await this.db.task.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description ?? null,
      },
    });

    const event: TaskCreatedEvent = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      userId: task.userId,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      timestamp: new Date().toISOString(),
    };

    await this.redis.publish('task.created', event);
    return task;
  }

  async update(id: string, userId: string, dto: UpdateTaskDto) {
    await this.findOne(id, userId);
    const task = await this.db.task.update({
      where: { id },
      data: dto,
    });

    const event: TaskUpdatedEvent = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      userId: task.userId,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      timestamp: new Date().toISOString(),
    };

    await this.redis.publish('task.updated', event);
    return task;
  }

  async remove(id: string, userId: string) {
    const result = await this.db.task.deleteMany({ where: { id, userId } });

    if (result.count === 0) {
      throw new NotFoundException('Task not found');
    }

    const event: TaskDeletedEvent = {
      id,
      userId,
      timestamp: new Date().toISOString(),
    };

    await this.redis.publish('task.deleted', event);
  }
}
