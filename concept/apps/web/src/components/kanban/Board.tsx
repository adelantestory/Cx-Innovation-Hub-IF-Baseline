// =============================================================================
// Board.tsx — Kanban Board with drag-and-drop, new task form, and task detail
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import Column from "./Column";
import TaskDetail from "./TaskDetail";
import type { Project, User, Task, TaskStatus } from "../../api/types";
import { STATUS_COLUMNS } from "../../api/types";
import {
  fetchTasks,
  fetchUsers,
  createTask,
  updateTaskStatus,
} from "../../api/client";

interface BoardProps {
  project: Project;
  currentUser: User;
  onBack: () => void;
}

export default function Board({ project, currentUser, onBack }: BoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const loadTasks = useCallback(() => {
    fetchTasks(project.id).then(setTasks).catch(console.error);
  }, [project.id]);

  useEffect(() => {
    loadTasks();
    fetchUsers().then(setUsers).catch(console.error);
  }, [loadTasks]);

  const tasksByColumn = (status: TaskStatus) =>
    tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.position - b.position);

  async function handleDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const newStatus = destination.droppableId as TaskStatus;
    const newPosition = destination.index;

    // Optimistic update
    const prevTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) =>
        t.id === draggableId
          ? { ...t, status: newStatus, position: newPosition }
          : t
      )
    );

    try {
      await updateTaskStatus(draggableId, newStatus, newPosition);
      loadTasks(); // refresh from server
    } catch {
      setTasks(prevTasks); // rollback on error
    }
  }

  async function handleNewTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await createTask(project.id, { title: newTaskTitle.trim() });
    setNewTaskTitle("");
    setShowNewTaskForm(false);
    loadTasks();
  }

  function handleTaskUpdated(updated: Task) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTask(updated);
  }

  function handleTaskDeleted(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTask(null);
  }

  return (
    <div style={{ backgroundColor: "#F8FAFC" }} className="min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Projects
          </button>
          <h2 className="text-xl font-bold text-gray-900">{project.name}</h2>
        </div>
        <button
          onClick={() => setShowNewTaskForm(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          + New Task
        </button>
      </div>

      {/* New Task Form */}
      {showNewTaskForm && (
        <form onSubmit={handleNewTask} className="mb-4 flex items-center gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Task title…"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setShowNewTaskForm(false);
              setNewTaskTitle("");
            }}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Kanban Columns */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div
          className="grid grid-cols-4"
          style={{ gap: "16px" }}
        >
          {STATUS_COLUMNS.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={tasksByColumn(status)}
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
