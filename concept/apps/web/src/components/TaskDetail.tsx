import { useState, useEffect } from 'react';
import type { Task, User, Comment as CommentType } from '../types';
import { getComments, updateTask, assignTask, deleteTask } from '../api';
import Comments from './Comments';

interface Props {
  task: Task;
  currentUser: User;
  users: User[];
  onClose: () => void;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
};

export default function TaskDetail({
  task,
  currentUser,
  users,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}: Props) {
  const [localTask, setLocalTask] = useState<Task>(task);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description ?? '');
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState<CommentType[]>([]);

  useEffect(() => {
    getComments(task.id).then(setComments).catch(console.error);
  }, [task.id]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateTask(localTask.id, editTitle, editDesc || undefined);
      setLocalTask(updated);
      onTaskUpdated(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleAssignChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    const userId = val === '' ? null : val;
    try {
      const updated = await assignTask(localTask.id, userId);
      setLocalTask(updated);
      onTaskUpdated(updated);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(localTask.id);
      onTaskDeleted(localTask.id);
      onClose();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between p-5 border-b">
          <div className="flex-1 pr-4">
            {editing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-semibold text-lg"
              />
            ) : (
              <h2 className="text-lg font-semibold text-gray-800">{localTask.title}</h2>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg font-bold flex-shrink-0"
          >
            x
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Status</span>
            <p className="text-sm text-gray-700 mt-0.5">
              {STATUS_LABELS[localTask.status] ?? localTask.status}
            </p>
          </div>

          {editing ? (
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">
                Description
              </label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          ) : localTask.description ? (
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wide">Description</span>
              <p className="text-sm text-gray-700 mt-0.5">{localTask.description}</p>
            </div>
          ) : null}

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">
              Assignee
            </label>
            <select
              value={localTask.assigned_user_id ?? ''}
              onChange={handleAssignChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            {editing ? (
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                Save
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditTitle(localTask.title);
                  setEditDesc(localTask.description ?? '');
                  setEditing(true);
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm"
              >
                Edit Task
              </button>
            )}
            <button
              onClick={handleDelete}
              className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-md text-sm ml-auto"
            >
              Delete Task
            </button>
          </div>

          <hr />

          <Comments
            taskId={localTask.id}
            currentUser={currentUser}
            comments={comments}
            onCommentsChange={setComments}
          />
        </div>
      </div>
    </div>
  );
}
