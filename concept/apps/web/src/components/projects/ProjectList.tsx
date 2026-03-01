// =============================================================================
// Project List Component
// =============================================================================
// Displays all projects as cards with task counts. Includes a form to create
// new projects. Clicking a project navigates to its Kanban board.
// =============================================================================

import { useEffect, useState } from "react";
import { fetchProjects, createProject } from "../../api/client";
import type { Project } from "../../api/types";

interface ProjectListProps {
  onSelectProject: (project: Project) => void;
}

export default function ProjectList({ onSelectProject }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  function loadProjects() {
    setLoading(true);
    fetchProjects()
      .then(setProjects)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    try {
      const project = await createProject({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
      });
      setProjects((prev) => [{ ...project, task_count: 0, done_count: 0 }, ...prev]);
      setNewName("");
      setNewDesc("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Loading projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={loadProjects}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
        >
          {showForm ? "Cancel" : "New Project"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6"
        >
          <input
            type="text"
            placeholder="Project name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <textarea
            placeholder="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Project"}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => onSelectProject(project)}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all text-left"
          >
            <h3 className="font-semibold text-gray-900 mb-1">{project.name}</h3>
            {project.description && (
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                {project.description}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{project.task_count} tasks</span>
              <span>-</span>
              <span>{project.done_count} done</span>
            </div>
          </button>
        ))}
      </div>

      {projects.length === 0 && (
        <p className="text-center text-gray-500 py-10">
          No projects yet. Create one to get started.
        </p>
      )}
    </div>
  );
}
