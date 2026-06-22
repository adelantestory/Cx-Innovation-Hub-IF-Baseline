// =============================================================================
// Task Detail Modal
// =============================================================================
// Full-screen overlay showing task details: title, description, status,
// assigned user, and threaded comments. Supports editing task fields,
// assigning users, CRUD operations on comments, and task decomposition.
// =============================================================================

import { useEffect, useState, useCallback, useRef } from "react";
import CommentList from "../comments/CommentList";
import {
  fetchComments,
  createComment,
  updateComment,
  deleteComment,
  updateTask,
  assignTask,
  deleteTask,
  decomposeTask,
  fetchSubtasks,
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
  onRefresh?: () => void;
  onTaskSelected?: (task: Task) => void;
}

export default function TaskDetail({
  task,
  currentUser,
  users,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
  onRefresh,
  onTaskSelected,
}: TaskDetailProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [decomposing, setDecomposing] = useState(false);
  const [subtasks, setSubtasks] = useState<Task[]>([]);

  // Drag state
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  const loadComments = useCallback(() => {
    setLoadingComments(true);
    fetchComments(task.id)
      .then(setComments)
      .catch((err: Error) => console.error("Failed to load comments:", err.message))
      .finally(() => setLoadingComments(false));
  }, [task.id]);

  const loadSubtasks = useCallback(() => {
    fetchSubtasks(task.id)
      .then(setSubtasks)
      .catch((err: Error) => console.error("Failed to load subtasks:", err.message));
  }, [task.id]);

  useEffect(() => {
    loadComments();
    loadSubtasks();
  }, [loadComments, loadSubtasks]);

  // Drag handlers
  useEffect(() => {
    if (!isDragging) return;

    function handleMouseMove(e: MouseEvent) {
      setDragOffset({
        x: e.clientX - dragStartRef.current.x + dragStartRef.current.offsetX,
        y: e.clientY - dragStartRef.current.y + dragStartRef.current.offsetY,
      });
    }

    function handleMouseUp() {
      setIsDragging(false);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  function handleHeaderMouseDown(e: React.MouseEvent) {
    // Don't drag if clicking the close button
    if ((e.target as HTMLElement).closest("button")) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: dragOffset.x,
      offsetY: dragOffset.y,
    };
  }

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

  async function handleDecompose() {
    setDecomposing(true);
    try {
      await decomposeTask(task.id);
      // Wait for agent to process
      await new Promise((r) => setTimeout(r, 5000));
      onRefresh?.();
      onClose();
    } catch (err) {
      console.error("Decompose failed:", err);
      setDecomposing(false);
    }
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

  const STATUS_DOTS: Record<string, string> = {
    todo: "bg-gray-400",
    in_progress: "bg-blue-400",
    in_review: "bg-yellow-400",
    done: "bg-green-400",
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        style={{ transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` }}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b border-gray-200 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          onMouseDown={handleHeaderMouseDown}
        >
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
              onClick={handleDecompose}
              disabled={decomposing || !task.assigned_user_id}
              title={!task.assigned_user_id ? "Assign a user before decomposing" : "Break this task into subtasks"}
              className="text-xs px-2.5 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {decomposing ? "🤖 Agent working..." : "✨ Break Down"}
            </button>
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

          {/* Subtasks */}
          {subtasks.length > 0 && (
            <div className="pt-3 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Subtasks ({subtasks.length})
              </h4>
              <div className="space-y-1">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => onTaskSelected?.(st)}
                    className="flex items-center gap-2 p-2 rounded border border-transparent hover:border-purple-200 hover:bg-purple-50 cursor-pointer transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full ${STATUS_DOTS[st.status] || "bg-gray-400"}`} />
                    <span className="text-sm text-gray-700 flex-1">{st.title}</span>
                    <span className="text-[10px] text-gray-400 uppercase">
                      {STATUS_LABELS[st.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
