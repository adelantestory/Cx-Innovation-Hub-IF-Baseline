import { useEffect, useState } from "react";
import type { Task, User, Comment } from "../../api/types";
import {
  fetchComments,
  updateTask,
  assignTask,
  deleteTask,
  createComment,
  updateComment,
  deleteComment,
} from "../../api/client";
import CommentList from "../comments/CommentList";

const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

interface TaskDetailProps {
  task: Task;
  currentUser: User;
  users: User[];
  onClose: () => void;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
}

export default function TaskDetail({
  task,
  currentUser,
  users,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}: TaskDetailProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description ?? "");

  useEffect(() => {
    fetchComments(task.id)
      .then((data) => {
        setComments(data);
        setLoadingComments(false);
      })
      .catch((err: Error) => {
        console.error("Failed to load comments:", err.message);
        setLoadingComments(false);
      });
  }, [task.id]);

  async function handleSave() {
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) return;
    const updated = await updateTask(task.id, {
      title: trimmedTitle,
      description: editDescription.trim(),
    });
    onTaskUpdated(updated);
    setEditing(false);
  }

  async function handleAssign(userId: string) {
    const updated = await assignTask(task.id, userId || null);
    onTaskUpdated(updated);
  }

  async function handleDelete() {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    await deleteTask(task.id);
    onTaskDeleted(task.id);
    onClose();
  }

  async function handleAddComment(content: string, parentId?: string) {
    const comment = await createComment(task.id, currentUser.id, {
      content,
      parent_comment_id: parentId,
    });
    setComments((prev) => [...prev, comment]);
  }

  async function handleEditComment(id: string, content: string) {
    const updated = await updateComment(id, currentUser.id, content);
    setComments((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }

  async function handleDeleteComment(id: string) {
    await deleteComment(id, currentUser.id);
    setComments((prev) => prev.filter((c) => c.id !== id));
  }

  function enterEditMode() {
    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
    setEditing(true);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {editing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-xl font-bold w-full border-b pb-1 mb-2"
                autoFocus
              />
            ) : (
              <h2
                className="text-xl font-bold cursor-pointer hover:underline"
                onClick={enterEditMode}
              >
                {task.title}
              </h2>
            )}
          </div>
          <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600 text-lg">
            x
          </button>
        </div>

        <div className="mb-4">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {STATUS_LABELS[task.status] ?? task.status}
          </span>
        </div>

        <div className="mb-4">
          {editing ? (
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              rows={4}
            />
          ) : (
            <p
              className="text-sm text-gray-700 cursor-pointer hover:underline"
              onClick={enterEditMode}
            >
              {task.description ?? "Click to add description..."}
            </p>
          )}
        </div>

        {editing && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => void handleSave()}
              disabled={!editTitle.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="border px-4 py-2 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        )}

        {!editing && (
          <div className="flex gap-2 mb-4">
            <button onClick={enterEditMode} className="text-sm text-blue-600 hover:underline">
              Edit Task
            </button>
            <button onClick={() => void handleDelete()} className="text-sm text-red-600 hover:underline">
              Delete Task
            </button>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Assigned to:
          </label>
          <select
            value={task.assigned_user_id ?? ""}
            onChange={(e) => void handleAssign(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm w-full"
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          {loadingComments ? (
            <p className="text-sm text-gray-400">Loading comments...</p>
          ) : (
            <CommentList
              comments={comments}
              currentUserId={currentUser.id}
              onAddComment={handleAddComment}
              onEditComment={handleEditComment}
              onDeleteComment={handleDeleteComment}
            />
          )}
        </div>
      </div>
    </div>
  );
}
