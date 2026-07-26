import { beforeEach, afterEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TaskStatus } from './task-status.enum';
import { TaskService } from './task.service';
import { RedisService } from '../redis/redis.service';
import { DatabaseService } from '../database/database.service';

function makeTask(overrides: Partial<{
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  return {
    id: 'task-1',
    title: 'Test task',
    description: 'Test description',
    status: TaskStatus.TODO,
    userId: 'user-1',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('TaskService', () => {
  let service: TaskService;
  // Mock objects are plain JS — Prisma delegate types are too complex to mock directly
  let db: any;
  let redis: any;

  beforeEach(async () => {
    const mockDb = {
      task: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const mockRedis = {
      publish: jest.fn(),
      subscribe: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get(TaskService);
    db = mockDb;
    redis = mockRedis;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns tasks scoped to the given user', async () => {
      const task = makeTask();
      db.task.findMany.mockResolvedValue([task]);

      const result = await service.findAll('user-1');

      expect(result).toStrictEqual([task]);
      expect(db.task.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('returns an empty array when the user has no tasks', async () => {
      db.task.findMany.mockResolvedValue([]);

      const result = await service.findAll('user-1');

      expect(result).toStrictEqual([]);
    });
  });

  describe('findOne', () => {
    it('returns a task that belongs to the user', async () => {
      const task = makeTask();
      db.task.findFirst.mockResolvedValue(task);

      const result = await service.findOne('task-1', 'user-1');

      expect(result).toStrictEqual(task);
      expect(db.task.findFirst).toHaveBeenCalledWith({
        where: { id: 'task-1', userId: 'user-1' },
      });
    });

    it('throws NotFoundException when the task does not exist', async () => {
      db.task.findFirst.mockResolvedValue(null);

      await expect(service.findOne('task-1', 'user-1')).rejects.toThrow(
        new NotFoundException('Task not found'),
      );
    });

    it('throws NotFoundException when the task belongs to another user', async () => {
      db.task.findFirst.mockResolvedValue(null);

      await expect(service.findOne('task-1', 'other-user')).rejects.toThrow(
        new NotFoundException('Task not found'),
      );
    });
  });

  describe('create', () => {
    it('creates a task with title and description and emits a WS event', async () => {
      const dto = { title: 'New task', description: 'New desc' };
      const created = makeTask({ title: 'New task', description: 'New desc' });
      db.task.create.mockResolvedValue(created);

      const result = await service.create('user-1', dto);

      expect(result).toStrictEqual(created);
      expect(db.task.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', title: 'New task', description: 'New desc' },
      });
      expect(redis.publish).toHaveBeenCalledWith('task.created', {
        id: 'task-1',
        title: 'New task',
        description: 'New desc',
        status: TaskStatus.TODO,
        userId: 'user-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        timestamp: expect.any(String),
      });
    });

    it('stores null description when none is provided', async () => {
      const dto = { title: 'Minimal' };
      const created = makeTask({ title: 'Minimal', description: null });
      db.task.create.mockResolvedValue(created);

      const result = await service.create('user-1', dto);

      expect(result.description).toBeNull();
      expect(db.task.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', title: 'Minimal', description: null },
      });
    });
  });

  describe('update', () => {
    it('updates the title and emits a WS event', async () => {
      db.task.findFirst.mockResolvedValue(makeTask());
      const updated = makeTask({ title: 'Updated' });
      db.task.update.mockResolvedValue(updated);

      const result = await service.update('task-1', 'user-1', { title: 'Updated' });

      expect(result).toStrictEqual(updated);
      expect(redis.publish).toHaveBeenCalledWith('task.updated', {
        id: 'task-1',
        title: 'Updated',
        description: 'Test description',
        status: TaskStatus.TODO,
        userId: 'user-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        timestamp: expect.any(String),
      });
    });

    it('updates the status', async () => {
      db.task.findFirst.mockResolvedValue(makeTask());
      const updated = makeTask({ status: TaskStatus.DONE });
      db.task.update.mockResolvedValue(updated);

      const result = await service.update('task-1', 'user-1', { status: TaskStatus.DONE });

      expect(result.status).toBe(TaskStatus.DONE);
    });

    it('throws NotFoundException when the task does not exist', async () => {
      db.task.findFirst.mockResolvedValue(null);

      await expect(
        service.update('task-1', 'user-1', { title: 'New' }),
      ).rejects.toThrow(new NotFoundException('Task not found'));
    });
  });

  describe('remove', () => {
    it('deletes the task and emits a WS event', async () => {
      db.task.deleteMany.mockResolvedValue({ count: 1 });

      await service.remove('task-1', 'user-1');

      expect(db.task.deleteMany).toHaveBeenCalledWith({
        where: { id: 'task-1', userId: 'user-1' },
      });
      expect(redis.publish).toHaveBeenCalledWith('task.deleted', {
        id: 'task-1',
        userId: 'user-1',
        timestamp: expect.any(String),
      });
    });

    it('throws NotFoundException when the task does not exist', async () => {
      db.task.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.remove('task-1', 'user-1')).rejects.toThrow(
        new NotFoundException('Task not found'),
      );
    });
  });
});
