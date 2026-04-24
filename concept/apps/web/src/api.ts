import type { User, Project, Task, Comment } from './types';

const API_BASE = '/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function getUsers(): Promise<User[]> {
  return fetchJSON<User[]>(`${API_BASE}/users`);
}

export async function getProjects(): Promise<Project[]> {
  return fetchJSON<Project[]>(`${API_BASE}/projects`);
}

export async function createProject(name: string, description?: string): Promise<Project> {
  return fetchJSON<Project>(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  });
}

export async function getProjectTasks(projectId: string): Promise<Task[]> {
  return fetchJSON<Task[]>(`${API_BASE}/projects/${projectId}/tasks`);
}

export async function createTask(
  projectId: string,
  title: string,
  description?: string
): Promise<Task> {
  return fetchJSON<Task>(`${API_BASE}/projects/${projectId}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description }),
  });
}

export async function updateTask(
  taskId: string,
  title: string,
  description?: string
): Promise<Task> {
  return fetchJSON<Task>(`${API_BASE}/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description }),
  });
}

export async function updateTaskStatus(
  taskId: string,
  status: string,
  position: number
): Promise<Task> {
  return fetchJSON<Task>(`${API_BASE}/tasks/${taskId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, position }),
  });
}

export async function assignTask(
  taskId: string,
  assignedUserId: string | null
): Promise<Task> {
  return fetchJSON<Task>(`${API_BASE}/tasks/${taskId}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assigned_user_id: assignedUserId }),
  });
}

export async function deleteTask(taskId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/tasks/${taskId}`, { method: 'DELETE' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
}

export async function getComments(taskId: string): Promise<Comment[]> {
  return fetchJSON<Comment[]>(`${API_BASE}/tasks/${taskId}/comments`);
}

export async function createComment(
  taskId: string,
  content: string,
  userId: string
): Promise<Comment> {
  return fetchJSON<Comment>(`${API_BASE}/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
    body: JSON.stringify({ content }),
  });
}

export async function updateComment(
  commentId: string,
  content: string,
  userId: string
): Promise<Comment> {
  return fetchJSON<Comment>(`${API_BASE}/comments/${commentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
    body: JSON.stringify({ content }),
  });
}

export async function deleteComment(commentId: string, userId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/comments/${commentId}`, {
    method: 'DELETE',
    headers: { 'X-User-Id': userId },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
}
