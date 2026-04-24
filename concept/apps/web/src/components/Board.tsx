import { useEffect, useState } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import type { Project, Task, User } from '../types';
import { getProjectTasks, createTask, updateTaskStatus, getUsers } from '../api';
import Column from './Column';
import TaskDetail from './TaskDetail';

interface Props {
  project: Project;
  currentUser: User;
  onBack: () => void;
}

const STATUSES = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'in_review', label: 'In Review' },
  { id: 'done', label: 'Done' },
];

export default function Board({ project, currentUser, onBack }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showNewTask, setShowNewTask] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  function loadTasks() {
    return getProjectTasks(project.id).then((data) => {
      setTasks(data.sort((a, b) => a.position - b.position));
    });
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([loadTasks(), getUsers().then(setUsers)]).finally(() => setLoading(false));
  }, [project.id]);

  function getColumnTasks(status: string): Task[] {
    return tasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position);
  }

  async function handleDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index)
      return;

    const newStatus = destination.droppableId;
    const position = destination.index;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === draggableId ? { ...t, status: newStatus, position } : t
      )
    );

    try {
      const updated = await updateTaskStatus(draggableId, newStatus, position);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      console.error(err);
      loadTasks();
    }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setAddingTask(true);
    try {
      await createTask(project.id, newTaskTitle.trim());
      setNewTaskTitle('');
      setShowNewTask(false);
      await loadTasks();
    } finally {
      setAddingTask(false);
    }
  }

  function handleTaskUpdated(updated: Task) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    if (selectedTask?.id === updated.id) {
      setSelectedTask(updated);
    }
  }

  function handleTaskDeleted(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTask(null);
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            ← Projects
          </button>
          <h1 className="text-xl font-bold text-gray-800">{project.name}</h1>
        </div>
        <button
          onClick={() => setShowNewTask(!showNewTask)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + New Task
        </button>
      </div>

      {showNewTask && (
        <form
          onSubmit={handleAddTask}
          className="bg-white rounded-lg shadow p-3 mb-6 flex gap-2"
        >
          <input
            type="text"
            placeholder="Task title…"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoFocus
          />
          <button
            type="submit"
            disabled={addingTask}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setShowNewTask(false)}
            className="text-gray-500 hover:text-gray-700 px-2"
          >
            ✕
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400">Loading board...</p>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STATUSES.map((col) => (
              <Column
                key={col.id}
                id={col.id}
                title={col.label}
                tasks={getColumnTasks(col.id)}
                currentUser={currentUser}
                onCardClick={setSelectedTask}
              />
            ))}
          </div>
        </DragDropContext>
      )}

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
    </main>
  );
}
