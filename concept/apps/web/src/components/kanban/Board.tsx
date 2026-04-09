// =============================================================================
// Kanban Board Component
// =============================================================================
// Main board view with 4 columns (To Do, In Progress, In Review, Done).
// Supports drag-and-drop reordering via @hello-pangea/dnd, new task creation,
// and opening task detail modals. Uses optimistic UI updates for drag events.
// =============================================================================

import { useEffect, useState, useCallback } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import Column from "./Column";
import TaskDetail from "./TaskDetail";
import {
  fetchTasks,
  fetchUsers,
  createTask,
  updateTaskStatus,
} from "../../api/client";
import type { Task, TaskStatus, User, Project } from "../../api/types";
import { STATUS_COLUMNS } from "../../api/types";

interface BoardProps {
  project: Project;
  currentUser: User;
  onBack: () => void;
}

export default function Board({ project, currentUser, onBack }: BoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([fetchTasks(project.id), fetchUsers()])
      .then(([taskData, userData]) => {
        setTasks(taskData);
        setUsers(userData);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [project.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Groups tasks by status column, maintaining position order.
   */
  function getColumnTasks(status: TaskStatus): Task[] {
    return tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.position - b.position);
  }

  /**
   * Handles drag-and-drop: optimistically updates local state, then
   * persists via API. Rolls back on failure.
   */
  async function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;
    const newPosition = destination.index;

    // Optimistic update
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) =>
        t.id === draggableId
          ? { ...t, status: newStatus, position: newPosition }
          : t
      )
    );

    try {
      await updateTaskStatus(draggableId, newStatus, newPosition);
    } catch {
      // Rollback on failure
      setTasks(previousTasks);
    }
  }

  /**
   * Creates a new task in the "todo" column.
   */
  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim() || creating) return;

    setCreating(true);
    try {
      const task = await createTask(project.id, { title: newTaskTitle.trim() });
      setTasks((prev) => [...prev, task]);
      setNewTaskTitle("");
      setShowNewTask(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setCreating(false);
    }
  }

  function handleTaskUpdated(updated: Task) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTask(updated);
  }

  function handleTaskDeleted(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTask(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Loading board...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      {/* Board Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; Projects
          </button>
          <h2 className="text-xl font-bold text-gray-900">{project.name}</h2>
        </div>
        <button
          onClick={() => setShowNewTask(!showNewTask)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
        >
          {showNewTask ? "Cancel" : "+ New Task"}
        </button>
      </div>

      {/* New Task Form */}
      {showNewTask && (
        <form
          onSubmit={handleCreateTask}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4 flex gap-2"
        >
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Task title…"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            type="submit"
            disabled={creating || !newTaskTitle.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {creating ? "Adding…" : "Add"}
          </button>
        </form>
      )}

      {/* Kanban Columns */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-4">
          {STATUS_COLUMNS.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={getColumnTasks(status)}
              currentUserId={currentUser.id}
              onCardClick={setSelectedTask}
            />
          ))}
        </div>
      </DragDropContext>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          currentUser={currentUser}
          users={users}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
        />
      )}
    </div>
  );
}
