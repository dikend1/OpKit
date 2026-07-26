import { useEffect, useState, useCallback } from 'react';
import type { Task, TaskEvent } from '../types';
import { fetchTasks, createTask, updateTask, deleteTask } from '../api/tasks';
import { connectSocket, disconnectSocket } from '../socket';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';

const COLUMNS = [
  { key: 'TODO', label: 'To Do' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'DONE', label: 'Done' },
] as const;

export default function TaskList({ token }: { token: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wsConnected, setWsConnected] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    const socket = connectSocket(token);

    setWsConnected(socket.connected);
    socket.on('connect', () => setWsConnected(true));
    socket.on('disconnect', () => setWsConnected(false));
    socket.on('connect_error', () => setWsConnected(false));

    socket.on('task.created', (event: TaskEvent) => {
      setTasks((prev) => {
        if (prev.some((t) => t.id === event.id)) return prev;
        return [
          ...prev,
          {
            id: event.id,
            title: event.title,
            description: event.description ?? null,
            status: event.status,
            userId: event.userId,
            createdAt: event.createdAt ?? new Date().toISOString(),
            updatedAt: event.updatedAt ?? new Date().toISOString(),
          },
        ];
      });
    });

    socket.on('task.updated', (event: TaskEvent) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === event.id
            ? {
                ...t,
                title: event.title ?? t.title,
                description: event.description ?? t.description,
                status: event.status ?? t.status,
                updatedAt: event.updatedAt ?? t.updatedAt,
              }
            : t,
        ),
      );
    });

    socket.on('task.deleted', (event: TaskEvent) => {
      setTasks((prev) => prev.filter((t) => t.id !== event.id));
    });

    return () => {
      disconnectSocket();
    };
  }, [token, loadTasks]);

  const handleCreate = async (title: string, description: string) => {
    await createTask(title, description || undefined);
  };

  const handleStatusChange = async (task: Task, newStatus: Task['status']) => {
    await updateTask(task.id, { status: newStatus });
  };

  const handleEdit = async (
    task: Task,
    data: { title: string; description: string },
  ) => {
    await updateTask(task.id, {
      title: data.title,
      description: data.description || null,
    });
  };

  const handleDelete = async (id: string) => {
    await deleteTask(id);
  };

  return (
    <div className="task-list">
      <div className="task-list-header">
        <h2>Tasks</h2>
        <span className={`ws-status ${wsConnected ? 'connected' : 'disconnected'}`}>
          {wsConnected ? '● Connected' : '○ Disconnected'}
        </span>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <TaskForm onSubmit={handleCreate} />

      {loading ? (
        <div className="kanban-loading" role="status">
          <div className="spinner" />
          <span>Loading tasks...</span>
        </div>
      ) : (
        <div className="kanban">
          {COLUMNS.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="kanban-column">
                <div className="kanban-column-header">
                  <h3>{col.label}</h3>
                  <span className="kanban-count">{columnTasks.length}</span>
                </div>
                <div className="kanban-column-body">
                  {columnTasks.length === 0 && (
                    <p className="empty">No tasks</p>
                  )}
                  {columnTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onStatusChange={handleStatusChange}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}