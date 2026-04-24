import { useEffect, useState } from 'react';
import type { Project } from '../types';
import { getProjects, createProject } from '../api';

interface Props {
  onSelectProject: (project: Project) => void;
}

export default function ProjectList({ onSelectProject }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  function loadProjects() {
    setLoading(true);
    getProjects()
      .then(setProjects)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createProject(newName.trim(), newDesc.trim() || undefined);
      setNewName('');
      setNewDesc('');
      setShowForm(false);
      loadProjects();
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          New Project
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-lg shadow p-4 mb-6 flex flex-col gap-3"
        >
          <input
            type="text"
            placeholder="Project name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            >
              Create Project
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400">Loading projects...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => onSelectProject(project)}
              className="bg-white rounded-lg shadow p-5 text-left hover:shadow-md hover:bg-gray-50 transition-all"
            >
              <h2 className="font-semibold text-gray-800 mb-1">{project.name}</h2>
              {project.description && (
                <p className="text-sm text-gray-500 line-clamp-2">{project.description}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
