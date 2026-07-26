import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TaskStatus } from './task-status.enum';
import { TaskService } from './task.service';
import { TaskGateway } from './task.gateway';
import { DatabaseService } from '../database/database.service';

describe('TaskService', () => {
  let service: TaskService;
  let db: DatabaseService;

  const mockDb = {
    task: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockGateway = {
    emitTaskCreated: jest.fn(),
    emitTaskUpdated: jest.fn(),
    emitTaskDeleted: jest.fn(),
  };

  const userId = 'user-1';
  const taskId = 'task-1';

  const sampleTask = {
    id: taskId,
    title: 'Test task',
    description: 'Test description',
    status: 'TODO' as const,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: TaskGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    db = module.get<DatabaseService>(DatabaseService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return tasks for the user', async () => {
      mockDb.task.findMany.mockResolvedValue([sampleTask]);
      const tasks = await service.findAll(userId);
      expect(tasks).toEqual([sampleTask]);
      expect(mockDb.task.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no tasks', async () => {
      mockDb.task.findMany.mockResolvedValue([]);
      const tasks = await service.findAll(userId);
      expect(tasks).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a task by id and userId', async () => {
      mockDb.task.findFirst.mockResolvedValue(sampleTask);
      const task = await service.findOne(taskId, userId);
      expect(task).toEqual(sampleTask);
    });

    it('should throw NotFoundException when task not found', async () => {
      mockDb.task.findFirst.mockResolvedValue(null);
      await expect(service.findOne(taskId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should not return a task belonging to another user', async () => {
      mockDb.task.findFirst.mockResolvedValue(null);
      await expect(service.findOne(taskId, 'other-user')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a task and emit WS event', async () => {
      const dto = { title: 'New task', description: 'New desc' };
      mockDb.task.create.mockResolvedValue({ ...sampleTask, title: 'New task', description: 'New desc' });

      const result = await service.create(userId, dto);
      expect(result.title).toBe('New task');
      expect(mockDb.task.create).toHaveBeenCalledWith({
        data: { userId, title: 'New task', description: 'New desc' },
      });
      expect(mockGateway.emitTaskCreated).toHaveBeenCalled();
    });

    it('should create task without description', async () => {
      const dto = { title: 'Minimal task', description: undefined };
      mockDb.task.create.mockResolvedValue({ ...sampleTask, title: 'Minimal task', description: null });

      const result = await service.create(userId, dto);
      expect(result.title).toBe('Minimal task');
      expect(mockDb.task.create).toHaveBeenCalledWith({
        data: { userId, title: 'Minimal task', description: null },
      });
    });
  });

  describe('update', () => {
    it('should update task title and emit WS event', async () => {
      mockDb.task.findFirst.mockResolvedValue(sampleTask);
      const updated = { ...sampleTask, title: 'Updated title' };
      mockDb.task.update.mockResolvedValue(updated);

      const result = await service.update(taskId, userId, { title: 'Updated title' });
      expect(result.title).toBe('Updated title');
      expect(mockGateway.emitTaskUpdated).toHaveBeenCalledWith(updated);
    });

    it('should update task status', async () => {
      mockDb.task.findFirst.mockResolvedValue(sampleTask);
      const updated = { ...sampleTask, status: 'DONE' as const };
      mockDb.task.update.mockResolvedValue(updated);

      const result = await service.update(taskId, userId, { status: TaskStatus.DONE });
      expect(result.status).toBe('DONE');
    });

    it('should throw when task not found', async () => {
      mockDb.task.findFirst.mockResolvedValue(null);
      await expect(service.update(taskId, userId, { title: 'New' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete task and emit WS event', async () => {
      mockDb.task.deleteMany.mockResolvedValue({ count: 1 });
      await service.remove(taskId, userId);
      expect(mockDb.task.deleteMany).toHaveBeenCalledWith({
        where: { id: taskId, userId },
      });
      expect(mockGateway.emitTaskDeleted).toHaveBeenCalledWith({ id: taskId, userId });
    });

    it('should throw NotFoundException when task not found', async () => {
      mockDb.task.deleteMany.mockResolvedValue({ count: 0 });
      await expect(service.remove(taskId, userId)).rejects.toThrow(NotFoundException);
    });
  });
});
