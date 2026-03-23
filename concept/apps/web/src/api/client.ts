import type { User, Project, Task, TaskStatus, Comment } from "./types";

const API_BASE = "";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = await response.json();
      if (body?.error?.message) {
        message = body.error.message;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function fetchUsers(): Promise<User[]> {
  return apiFetch<User[]>("/api/users");
}

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
  data: { title?: string; description?: string }
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
    headers: { "X-User-Id": userId },
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
    headers: { "X-User-Id": userId },
  });
}

export function deleteComment(
  id: string,
  userId: string
): Promise<{ message: string; id: string }> {
  return apiFetch<{ message: string; id: string }>(`/api/comments/${id}`, {
    method: "DELETE",
    headers: { "X-User-Id": userId },
  });
}
