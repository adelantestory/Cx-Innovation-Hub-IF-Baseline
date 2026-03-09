// =============================================================================
// Task Detail Modal
// =============================================================================
// Full-screen overlay showing task details: title, description, status,
// assigned user, and threaded comments. Supports editing task fields,
// assigning users, and CRUD operations on comments.
// =============================================================================

import { useEffect, useState, useCallback } from "react";
import CommentList from "../comments/CommentList";
import {
  fetchComments,
  createComment,
  updateComment,
  deleteComment,
  updateTask,
  assignTask,
  deleteTask,
} from "../../api/client";
import type { Task, Comment, User } from "../../api/types";
import { STATUS_LABELS } from "../../api/types";

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
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");

  const loadComments = useCallback(() => {
    setLoadingComments(true);
    fetchComments(task.id)
      .then(setComments)
      .catch((err: Error) => console.error("Failed to load comments:", err.message))
      .finally(() => setLoadingComments(false));
  }, [task.id]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  async function handleSave() {
    if (!title.trim()) return;
    const updated = await updateTask(task.id, {
      title: title.trim(),
      description: description.trim() || undefined,
    });
    onTaskUpdated(updated);
    setEditing(false);
  }

  async function handleAssign(userId: string | null) {
    const updated = await assignTask(task.id, userId);
    onTaskUpdated(updated);
  }

  async function handleDelete() {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    await deleteTask(task.id);
    onTaskDeleted(task.id);
    onClose();
  }

  async function handleAddComment(content: string, parentCommentId?: string) {
    const comment = await createComment(task.id, currentUser.id, {
      content,
      parent_comment_id: parentCommentId,
    });
    setComments((prev) => [...prev, comment]);
  }

  async function handleEditComment(id: string, content: string) {
    const updated = await updateComment(id, currentUser.id, content);
    setComments((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }

  async function handleDeleteComment(id: string) {
    await deleteComment(id, currentUser.id);
    setComments((prev) => prev.filter((c) => c.id !== id && c.parent_comment_id !== id));
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <span className="text-xs font-medium text-gray-500 uppercase">
            {STATUS_LABELS[task.status]}
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg"
          >
            x
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Title & Description */}
          {editing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-lg font-semibold border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setTitle(task.title);
                    setDescription(task.description || "");
                  }}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2
                className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                onClick={() => setEditing(true)}
              >
                {task.title}
              </h2>
              {task.description ? (
                <p
                  className="text-sm text-gray-600 mt-1 cursor-pointer hover:text-blue-600"
                  onClick={() => setEditing(true)}
                >
                  {task.description}
                </p>
              ) : (
                <p
                  className="text-sm text-gray-400 mt-1 cursor-pointer hover:text-blue-600 italic"
                  onClick={() => setEditing(true)}
                >
                  Click to add description...
                </p>
              )}
            </div>
          )}

          {/* Assigned User */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Assigned to:</span>
            <select
              value={task.assigned_user_id || ""}
              onChange={(e) => handleAssign(e.target.value || null)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-gray-500 hover:text-blue-500"
            >
              Edit Task
            </button>
            <button
              onClick={handleDelete}
              className="text-xs text-gray-500 hover:text-red-500"
            >
              Delete Task
            </button>
          </div>

          {/* Comments */}
          <div className="pt-4 border-t border-gray-200">
            {loadingComments ? (
              <p className="text-xs text-gray-400">Loading comments...</p>
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
    </div>
  );
}
