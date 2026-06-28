// =============================================================================
// SubtaskList Component — Smart Task Decomposition
// =============================================================================
// Renders the checklist of subtasks for a parent task. Supports creating,
// toggling, editing, and deleting individual subtask items.
// =============================================================================

import { useState } from "react";
import type { Subtask } from "../../api/types";
import { createSubtask, updateSubtask, deleteSubtask } from "../../api/client";

interface SubtaskListProps {
  taskId: string;
  subtasks: Subtask[];
  onSubtasksChanged: (subtasks: Subtask[]) => void;
}

export default function SubtaskList({
  taskId,
  subtasks,
  onSubtasksChanged,
}: SubtaskListProps) {
  const [newTitle, setNewTitle] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const completedCount = subtasks.filter((s) => s.is_completed).length;

  async function handleToggle(subtask: Subtask) {
    const updated = await updateSubtask(subtask.id, {
      is_completed: !subtask.is_completed,
    });
    onSubtasksChanged(
      subtasks.map((s) => (s.id === updated.id ? updated : s))
    );
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    const created = await createSubtask(taskId, newTitle.trim());
    onSubtasksChanged([...subtasks, created]);
    setNewTitle("");
    setAddingNew(false);
  }

  function startEdit(subtask: Subtask) {
    setEditingId(subtask.id);
    setEditTitle(subtask.title);
  }

  async function handleEditSave(id: string) {
    if (!editTitle.trim()) return;
    const updated = await updateSubtask(id, { title: editTitle.trim() });
    onSubtasksChanged(subtasks.map((s) => (s.id === updated.id ? updated : s)));
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    await deleteSubtask(id);
    onSubtasksChanged(subtasks.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          Subtasks
          {subtasks.length > 0 && (
            <span className="ml-1.5 text-xs font-normal text-gray-400">
              {completedCount}/{subtasks.length}
            </span>
          )}
        </h3>
        <button
          onClick={() => setAddingNew(true)}
          className="text-xs text-blue-500 hover:text-blue-700"
        >
          + Add subtask
        </button>
      </div>

      {/* Progress bar */}
      {subtasks.length > 0 && (
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{
              width: `${Math.round((completedCount / subtasks.length) * 100)}%`,
            }}
          />
        </div>
      )}

      {/* Subtask items */}
      <ul className="space-y-1">
        {subtasks.map((subtask) => (
          <li key={subtask.id} className="flex items-start gap-2 group">
            <input
              type="checkbox"
              checked={subtask.is_completed}
              onChange={() => handleToggle(subtask)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-400 cursor-pointer"
            />
            {editingId === subtask.id ? (
              <div className="flex-1 flex gap-1">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEditSave(subtask.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="flex-1 text-sm border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  autoFocus
                />
                <button
                  onClick={() => handleEditSave(subtask.id)}
                  className="text-xs text-blue-500 hover:text-blue-700 px-1"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 px-1"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span
                  className={`text-sm truncate cursor-pointer ${
                    subtask.is_completed
                      ? "line-through text-gray-400"
                      : "text-gray-700"
                  }`}
                  onClick={() => startEdit(subtask)}
                >
                  {subtask.title}
                </span>
                <button
                  onClick={() => handleDelete(subtask.id)}
                  className="ml-2 text-xs text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  aria-label="Delete subtask"
                >
                  ×
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* New subtask input */}
      {addingNew && (
        <div className="flex gap-1 mt-1">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") {
                setAddingNew(false);
                setNewTitle("");
              }
            }}
            placeholder="Subtask title..."
            className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoFocus
          />
          <button
            onClick={handleCreate}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add
          </button>
          <button
            onClick={() => {
              setAddingNew(false);
              setNewTitle("");
            }}
            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
