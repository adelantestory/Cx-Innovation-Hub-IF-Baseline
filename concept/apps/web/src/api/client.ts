// =============================================================================
// API Client
// =============================================================================
// Centralized HTTP client for communicating with the Taskify backend API.
// All functions return typed responses. The X-User-Id header is included
// in requests that require user context (comments).
// =============================================================================

import type { User, Project, Task, Comment, TaskStatus } from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "";

/**
 * Generic fetch wrapper with error handling.
 */
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(body.error?.message || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export function fetchUsers(): Promise<User[]> {
  return apiFetch<User[]>("/api/users");
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export function fetchProjects(): Promise<Project[]> {
  return apiFetch<Project[]>("/api/projects");
}

export function fetchProject(id: string): Promise<Project> {
  return apiFetch<Project>(`/api/projects/${id}`);
}

export function createProject(data: {
  name: string;
  description?: string;
}): Promise<Project> {
  return apiFetch<Project>("/api/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export function fetchTasks(projectId: string): Promise<Task[]> {
  return apiFetch<Task[]>(`/api/projects/${projectId}/tasks`);
}

export function createTask(
  projectId: string,
  data: { title: string; description?: string; assigned_user_id?: string }
): Promise<Task> {
  return apiFetch<Task>(`/api/projects/${projectId}/tasks`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTask(
  id: string,
  data: { title: string; description?: string }
): Promise<Task> {
  return apiFetch<Task>(`/api/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function updateTaskStatus(
  id: string,
  status: TaskStatus,
  position: number
): Promise<Task> {
  return apiFetch<Task>(`/api/tasks/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, position }),
  });
}

export function assignTask(
  id: string,
  assignedUserId: string | null
): Promise<Task> {
  return apiFetch<Task>(`/api/tasks/${id}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ assigned_user_id: assignedUserId }),
  });
}

export function deleteTask(id: string): Promise<{ message: string; id: string }> {
  return apiFetch<{ message: string; id: string }>(`/api/tasks/${id}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export function fetchComments(taskId: string): Promise<Comment[]> {
  return apiFetch<Comment[]>(`/api/tasks/${taskId}/comments`);
}

export function createComment(
  taskId: string,
  userId: string,
  data: { content: string; parent_comment_id?: string }
): Promise<Comment> {
  return apiFetch<Comment>(`/api/tasks/${taskId}/comments`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json", "X-User-Id": userId },
  });
}

export function updateComment(
  id: string,
  userId: string,
  content: string
): Promise<Comment> {
  return apiFetch<Comment>(`/api/comments/${id}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
    headers: { "Content-Type": "application/json", "X-User-Id": userId },
  });
}

export function deleteComment(
  id: string,
  userId: string
): Promise<{ message: string; id: string }> {
  return apiFetch<{ message: string; id: string }>(`/api/comments/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", "X-User-Id": userId },
  });
}
