import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { TaskGateway } from './task.gateway';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskService {
  constructor(
    private readonly db: DatabaseService,
    private readonly taskGateway: TaskGateway,
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
    this.taskGateway.emitTaskCreated(task);
    return task;
  }

  async update(id: string, userId: string, dto: UpdateTaskDto) {
    await this.findOne(id, userId);
    const task = await this.db.task.update({
      where: { id },
      data: dto,
    });
    this.taskGateway.emitTaskUpdated(task);
    return task;
  }

  async remove(id: string, userId: string) {
    const result = await this.db.task.deleteMany({ where: { id, userId } });

    if (result.count === 0) {
      throw new NotFoundException('Task not found');
    }

    this.taskGateway.emitTaskDeleted({ id, userId });
  }
}
