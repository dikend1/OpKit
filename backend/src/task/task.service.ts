import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  findAll(userId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id, userId } });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  create(userId: string, dto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepository.create({
      userId,
      title: dto.title,
      description: dto.description ?? null,
    });
    return this.taskRepository.save(task);
  }

  async update(id: string, userId: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id, userId);
    Object.assign(task, dto);
    return this.taskRepository.save(task);
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.taskRepository.delete({ id, userId });
    if (result.affected === 0) throw new NotFoundException('Task not found');
  }
}
