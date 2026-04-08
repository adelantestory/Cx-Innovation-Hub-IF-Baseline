// =============================================================================
// API Types
// =============================================================================
// TypeScript interfaces that mirror the PostgreSQL schema and API responses.
// =============================================================================

export interface User {
  id: string;
  name: string;
  role: string;
  avatar_color: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  task_count: number;
  done_count: number;
}

export type TaskStatus = "todo" | "in_progress" | "in_review" | "done";

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  position: number;
  assigned_user_id: string | null;
  assigned_user_name: string | null;
  assigned_user_avatar_color: string | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_avatar_color: string;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

export const STATUS_COLUMNS: TaskStatus[] = [
  "todo",
  "in_progress",
  "in_review",
  "done",
];
