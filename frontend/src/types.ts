export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  access_token: string;
}

export interface TaskEvent {
  id: string;
  title: string;
  description?: string | null;
  status: Task['status'];
  userId: string;
  createdAt?: string;
  updatedAt?: string;
  timestamp: string;
}
