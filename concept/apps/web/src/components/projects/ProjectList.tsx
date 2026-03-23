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
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  function loadProjects() {
    setLoading(true);
    setError(null);
    fetchProjects()
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function handleCreate() {
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) return;
    const trimmedDesc = newDesc.trim();
    setSubmitting(true);
    setCreateError(null);
    try {
      const project = await createProject({
        name: trimmedTitle,
        description: trimmedDesc || undefined,
      });
      setProjects((prev) => [...prev, project]);
      setNewTitle("");
      setNewDesc("");
      setShowForm(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div>Loading projects...</div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <p>{error}</p>
        <button onClick={loadProjects} className="mt-2 text-blue-600 underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          New Project
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 border rounded bg-gray-50">
          {createError && (
            <p className="text-red-600 text-sm mb-2">{createError}</p>
          )}
          <input
            type="text"
            placeholder="Project name"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="border rounded px-3 py-2 w-full mb-2"
          />
          <textarea
            placeholder="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="border rounded px-3 py-2 w-full mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={() => void handleCreate()}
              disabled={!newTitle.trim() || submitting}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Project"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setNewTitle("");
                setNewDesc("");
                setCreateError(null);
              }}
              className="bg-gray-200 px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {projects.length === 0 && !showForm ? (
        <p className="text-gray-500">No projects yet. Create one to get started.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => onSelectProject(project)}
              className="text-left border rounded-lg p-4 bg-white shadow hover:shadow-md"
              aria-label={project.name}
            >
              <h2 className="font-semibold text-lg mb-1">{project.name}</h2>
              {project.description && (
                <p className="text-sm text-gray-500 mb-2">{project.description}</p>
              )}
              <div className="flex gap-3 text-xs text-gray-400">
                <span>{project.task_count} tasks</span>
                <span>{project.done_count} done</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
