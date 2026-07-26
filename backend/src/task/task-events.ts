import { TaskStatus } from '@prisma/client';

export interface TaskCreatedEvent {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  userId: string;
  createdAt: string;
  updatedAt: string;
  timestamp: string;
}

export interface TaskUpdatedEvent extends TaskCreatedEvent {}

export interface TaskDeletedEvent {
  id: string;
  userId: string;
  timestamp: string;
}