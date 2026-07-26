import { useEffect, useState } from 'react';
import type { Task } from '../types';

interface Props {
  task: Task;
  onStatusChange: (task: Task, status: Task['status']) => Promise<void>;
  onEdit: (
    task: Task,
    data: { title: string; description: string },
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function TaskItem({ task, onStatusChange, onEdit, onDelete }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description ?? '');
  }, [task.title, task.description]);

  const handleSave = async () => {
    const nextTitle = title.trim();
    if (!nextTitle) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onEdit(task, {
        title: nextTitle,
        description: description.trim(),
      });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setTitle(task.title);
    setDescription(task.description ?? '');
    setError('');
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setError('');
    try {
      await onDelete(task.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
    setConfirmDelete(false);
  };

  return (
    <div className={`task-item status-${task.status.toLowerCase()}`}>
      {isEditing ? (
        <div className="task-content task-editing">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            aria-label="Edit task title"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            aria-label="Edit task description"
          />
          {error && <p className="error" role="alert">{error}</p>}
        </div>
      ) : (
        <div className="task-content">
          <strong>{task.title}</strong>
          {task.description && <p>{task.description}</p>}
        </div>
      )}
      {error && !isEditing && <p className="error" role="alert">{error}</p>}
      <div className="task-actions">
        {!isEditing && !confirmDelete && (
          <button onClick={() => setIsEditing(true)} className="btn-status" aria-label={`Edit ${task.title}`}>
            Edit
          </button>
        )}
        {isEditing && (
          <>
            <button onClick={handleSave} className="btn-status done" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={handleCancel} className="btn-status back" disabled={saving}>
              Cancel
            </button>
          </>
        )}
        {!isEditing && !confirmDelete && task.status !== 'TODO' && (
          <button onClick={() => onStatusChange(task, 'TODO')} className="btn-status back">
            ← TODO
          </button>
        )}
        {!isEditing && !confirmDelete && task.status === 'TODO' && (
          <button onClick={() => onStatusChange(task, 'IN_PROGRESS')} className="btn-status">
            Start →
          </button>
        )}
        {!isEditing && !confirmDelete && task.status === 'IN_PROGRESS' && (
          <button onClick={() => onStatusChange(task, 'DONE')} className="btn-status done">
            Complete →
          </button>
        )}
        {!isEditing && !confirmDelete && task.status === 'DONE' && (
          <button onClick={() => onStatusChange(task, 'IN_PROGRESS')} className="btn-status back">
            Reopen →
          </button>
        )}
        {!isEditing && !confirmDelete && (
          <button onClick={() => setConfirmDelete(true)} className="btn-delete" aria-label={`Delete ${task.title}`}>
            Delete
          </button>
        )}
        {confirmDelete && (
          <span className="confirm-delete">
            <button onClick={handleDelete} className="btn-status" aria-label="Confirm delete">
              Confirm
            </button>
            <button onClick={() => setConfirmDelete(false)} className="btn-status back">
              Cancel
            </button>
          </span>
        )}
      </div>
    </div>
  );
}