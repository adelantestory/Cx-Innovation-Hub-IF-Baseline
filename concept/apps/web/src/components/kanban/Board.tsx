import { useEffect, useState } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import type { Project, Task, User, TaskStatus } from "../../api/types";
import {
  fetchTasks,
  fetchUsers,
  createTask,
  updateTaskStatus,
} from "../../api/client";
import Column from "./Column";
import TaskDetail from "./TaskDetail";

const STATUSES: TaskStatus[] = ["todo", "in_progress", "in_review", "done"];

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
  const [taskError, setTaskError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  function loadData() {
    setLoading(true);
    setError(null);
    Promise.all([fetchTasks(project.id), fetchUsers()])
      .then(([taskData, userData]) => {
        setTasks(taskData.sort((a, b) => a.position - b.position));
        setUsers(userData);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadData();
  }, [project.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreateTask() {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setTaskError(null);
    try {
      const task = await createTask(project.id, { title: trimmed });
      setTasks((prev) => [...prev, task]);
      setNewTitle("");
      setShowForm(false);
    } catch (err) {
      setTaskError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  }

  function handleDragEnd(result: DropResult) {
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
    const previousTasks = tasks;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === draggableId ? { ...t, status: newStatus, position: newPosition } : t
      )
    );

    updateTaskStatus(draggableId, newStatus, newPosition)
      .then((updated) => {
        setTasks((prev) =>
          prev.map((t) => (t.id === draggableId ? updated : t))
        );
      })
      .catch(() => {
        // Roll back on failure
        setTasks(previousTasks);
      });
  }

  function getTasksForStatus(status: TaskStatus): Task[] {
    return tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.position - b.position);
  }

  if (loading) {
    return <div>Loading board...</div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <p>{error}</p>
        <button onClick={loadData} className="mt-2 text-blue-600 underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={onBack} className="text-blue-600 hover:underline text-sm">
          Projects
        </button>
        <h1 className="text-xl font-bold">{project.name}</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="ml-auto bg-blue-600 text-white px-3 py-1.5 rounded text-sm"
        >
          New Task
        </button>
      </div>

      {taskError && (
        <div className="mb-3 text-red-600 text-sm">{taskError}</div>
      )}

      {showForm && (
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            placeholder="Task title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="border rounded px-3 py-1.5 flex-1 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newTitle.trim() && !submitting) {
                void handleCreateTask();
              }
            }}
          />
          <button
            onClick={() => void handleCreateTask()}
            disabled={!newTitle.trim() || submitting}
            className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
          >
            {submitting ? "Adding..." : "Add Task"}
          </button>
          <button
            onClick={() => {
              setShowForm(false);
              setNewTitle("");
            }}
            className="border px-3 py-1.5 rounded text-sm"
          >
            Cancel
          </button>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={getTasksForStatus(status)}
              onCardClick={(task) => setSelectedTask(task)}
            />
          ))}
        </div>
      </DragDropContext>

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          currentUser={currentUser}
          users={users}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={(updated) => {
            setTasks((prev) =>
              prev.map((t) => (t.id === updated.id ? updated : t))
            );
            setSelectedTask(updated);
          }}
          onTaskDeleted={(taskId) => {
            setTasks((prev) => prev.filter((t) => t.id !== taskId));
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
