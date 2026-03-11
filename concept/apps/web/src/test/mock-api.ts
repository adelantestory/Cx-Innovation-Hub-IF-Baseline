import { vi } from "vitest";
import type { User, Project, Task, Comment } from "../api/types";

/**
 * Mock API client for unit tests.
 * Import and use vi.mock to replace the real API client.
 */

export const mockUsers: User[] = [
  {
    id: "1",
    name: "Alice Johnson",
    role: "Developer",
    avatar_color: "#4F46E5",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Bob Smith",
    role: "Designer",
    avatar_color: "#059669",
    created_at: "2024-01-01T00:00:00Z",
  },
];

export const mockProjects: Project[] = [
  {
    id: "1",
    name: "Test Project",
    description: "A test project",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    task_count: 3,
    done_count: 1,
  },
];

export const mockTasks: Task[] = [
  {
    id: "1",
    project_id: "1",
    title: "Test Task 1",
    description: "First test task",
    status: "todo",
    position: 0,
    assigned_user_id: null,
    assigned_user_name: null,
    assigned_user_avatar_color: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    project_id: "1",
    title: "Test Task 2",
    description: "Second test task",
    status: "in_progress",
    position: 0,
    assigned_user_id: "1",
    assigned_user_name: "Alice Johnson",
    assigned_user_avatar_color: "#4F46E5",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

export const mockComments: Comment[] = [
  {
    id: "1",
    task_id: "1",
    user_id: "1",
    parent_comment_id: null,
    content: "Test comment",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    author_name: "Alice Johnson",
    author_avatar_color: "#4F46E5",
  },
];

/**
 * Creates a mock API module. Use with vi.mock:
 *
 * vi.mock("../api/client", () => createMockApi());
 */
export function createMockApi() {
  return {
    fetchUsers: vi.fn().mockResolvedValue(mockUsers),
    fetchProjects: vi.fn().mockResolvedValue(mockProjects),
    fetchProject: vi.fn().mockResolvedValue(mockProjects[0]),
    createProject: vi.fn().mockResolvedValue(mockProjects[0]),
    fetchTasks: vi.fn().mockResolvedValue(mockTasks),
    createTask: vi.fn().mockResolvedValue(mockTasks[0]),
    updateTask: vi.fn().mockResolvedValue(mockTasks[0]),
    updateTaskStatus: vi.fn().mockResolvedValue(mockTasks[0]),
    assignTask: vi.fn().mockResolvedValue(mockTasks[0]),
    deleteTask: vi.fn().mockResolvedValue({ message: "Deleted", id: "1" }),
    fetchComments: vi.fn().mockResolvedValue(mockComments),
    createComment: vi.fn().mockResolvedValue(mockComments[0]),
    updateComment: vi.fn().mockResolvedValue(mockComments[0]),
    deleteComment: vi.fn().mockResolvedValue({ message: "Deleted", id: "1" }),
  };
}
