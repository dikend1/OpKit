import { api } from './http';
import type { Task } from '../types';

export async function fetchTasks(): Promise<Task[]> {
  return api.get<Task[]>('/tasks');
}

export async function createTask(title: string, description?: string): Promise<Task> {
  return api.post<Task>('/tasks', { title, description });
}

export async function updateTask(
  id: string,
  data: { title?: string; description?: string | null; status?: Task['status'] },
): Promise<Task> {
  return api.patch<Task>(`/tasks/${id}`, data);
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`);
}
