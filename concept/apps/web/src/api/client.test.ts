// =============================================================================
// API Client Tests
// =============================================================================
// Comprehensive unit tests for the Taskify API client covering all 16
// endpoint wrapper functions. Tests verify HTTP method, URL path,
// request headers, request body, response parsing, and error handling.
// =============================================================================

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import * as client from "./client";
import type { User, Project, Task, Comment } from "./types";

describe("API Client", () => {
  // =========================================================================
  // Setup / Teardown
  // =========================================================================

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // =========================================================================
  // Helper Functions
  // =========================================================================

  /**
   * Creates a mock fetch response with JSON body
   */
  function mockFetchResponse<T>(data: T, ok = true, status = 200) {
    return {
      ok,
      status,
      json: () => Promise.resolve(data),
      statusText: "Error",
    } as unknown as Response;
  }

  /**
   * Creates a mock error response
   */
  function mockErrorResponse(status = 400, errorMessage = "Bad Request") {
    return {
      ok: false,
      status,
      json: () =>
        Promise.resolve({ error: { message: errorMessage } }),
      statusText: errorMessage,
    } as unknown as Response;
  }

  // =========================================================================
  // Users Tests
  // =========================================================================

  describe("fetchUsers", () => {
    test("makes GET request to /api/users and returns User[]", async () => {
      const mockUsers: User[] = [
        {
          id: "user-1",
          name: "Alice Johnson",
          role: "admin",
          avatar_color: "#FF5733",
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "user-2",
          name: "Bob Smith",
          role: "user",
          avatar_color: "#33FF57",
          created_at: "2024-01-02T00:00:00Z",
        },
      ];

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFetchResponse(mockUsers)
      );

      const result = await client.fetchUsers();

      expect(fetch).toHaveBeenCalledWith("/api/users", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(2);
      expect(result[0]!.name).toBe("Alice Johnson");
    });

    test("rejects on HTTP error", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockErrorResponse(500, "Internal Server Error")
      );

      await expect(client.fetchUsers()).rejects.toThrow(
        "Internal Server Error"
      );
    });

    test("handles response with no error body", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("Invalid JSON")),
        statusText: "Internal Server Error",
      } as unknown as Response);

      await expect(client.fetchUsers()).rejects.toThrow("Internal Server Error");
    });
  });

  // =========================================================================
  // Projects Tests
  // =========================================================================

  describe("fetchProjects", () => {
    test("makes GET request to /api/projects and returns Project[]", async () => {
      const mockProjects: Project[] = [
        {
          id: "proj-1",
          name: "Website Redesign",
          description: "Modernize the company website",
          task_count: 12,
          done_count: 5,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-10T00:00:00Z",
        },
      ];

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFetchResponse(mockProjects)
      );

      const result = await client.fetchProjects();

      expect(fetch).toHaveBeenCalledWith("/api/projects", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(result).toEqual(mockProjects);
      expect(result[0]!.name).toBe("Website Redesign");
    });

    test("rejects on HTTP error", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockErrorResponse(401, "Unauthorized")
      );

      await expect(client.fetchProjects()).rejects.toThrow("Unauthorized");
    });
  });

  describe("fetchProject", () => {
    test("makes GET request to /api/projects/{id} and returns Project", async () => {
      const mockProject: Project = {
        id: "proj-1",
        name: "Website Redesign",
        description: "Modernize the company website",
        task_count: 12,
        done_count: 5,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-10T00:00:00Z",
      };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFetchResponse(mockProject)
      );

      const result = await client.fetchProject("proj-1");

      expect(fetch).toHaveBeenCalledWith("/api/projects/proj-1", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(result).toEqual(mockProject);
      expect(result.id).toBe("proj-1");
    });

    test("rejects on HTTP error", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockErrorResponse(404, "Project not found")
      );

      await expect(client.fetchProject("proj-invalid")).rejects.toThrow(
        "Project not found"
      );
    });
  });

  describe("createProject", () => {
    test("makes POST request to /api/projects with proper body", async () => {
      const requestData = {
        name: "New Project",
        description: "A brand new project",
      };

      const mockProject: Project = {
        id: "proj-new",
        name: requestData.name,
        description: requestData.description,
        task_count: 0,
        done_count: 0,
        created_at: "2024-01-15T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
      };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFetchResponse(mockProject)
      );

      const result = await client.createProject(requestData);

      expect(fetch).toHaveBeenCalledWith("/api/projects", {
        method: "POST",
        body: JSON.stringify(requestData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(result).toEqual(mockProject);
      expect(result.id).toBe("proj-new");
    });

    test("makes POST request without optional description", async () => {
      const requestData = { name: "Simple Project" };

      const mockProject: Project = {
        id: "proj-simple",
        name: requestData.name,
        description: null,
        task_count: 0,
        done_count: 0,
        created_at: "2024-01-15T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
      };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFetchResponse(mockProject)
      );

      const result = await client.createProject(requestData);

      expect(fetch).toHaveBeenCalledWith("/api/projects", {
        method: "POST",
        body: JSON.stringify(requestData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(result).toEqual(mockProject);
    });

    test("rejects on HTTP error with validation message", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockErrorResponse(400, "Project name is required")
      );

      await expect(
        client.createProject({ name: "" })
      ).rejects.toThrow("Project name is required");
    });
  });

  // =========================================================================
  // Tasks Tests
  // =========================================================================

  describe("fetchTasks", () => {
    test("makes GET request to /api/projects/{projectId}/tasks and returns Task[]", async () => {
      const mockTasks: Task[] = [
        {
          id: "task-1",
          project_id: "proj-1",
          title: "Design mockups",
          description: "Create UI mockups for the homepage",
          status: "todo",
          position: 0,
          assigned_user_id: "user-1",
          assigned_user_name: "Alice Johnson",
          assigned_user_avatar_color: "#FF5733",
          created_at: "2024-01-05T00:00:00Z",
          updated_at: "2024-01-05T00:00:00Z",
        },
      ];

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFetchResponse(mockTasks)
      );

      const result = await client.fetchTasks("proj-1");

      expect(fetch).toHaveBeenCalledWith("/api/projects/proj-1/tasks", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(result).toEqual(mockTasks);
      expect(result[0]!.title).toBe("Design mockups");
    });

    test("rejects on HTTP error", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockErrorResponse(404, "Project not found")
      );

      await expect(client.fetchTasks("proj-invalid")).rejects.toThrow(
        "Project not found"
      );
    });
  });

  describe("createTask", () => {
    test("makes POST request to /api/projects/{projectId}/tasks with proper body", async () => {
      const projectId = "proj-1";
      const requestData = {
        title: "Implement authentication",
        description: "Add JWT-based auth",
        assigned_user_id: "user-1",
      };

      const mockTask: Task = {
        id: "task-new",
        project_id: projectId,
        title: requestData.title,
        description: requestData.description,
        status: "todo",
        position: 5,
        assigned_user_id: requestData.assigned_user_id,
        assigned_user_name: "Alice Johnson",
        assigned_user_avatar_color: "#FF5733",
        created_at: "2024-01-15T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
      };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFetchResponse(mockTask)
      );

      const result = await client.createTask(projectId, requestData);

      expect(fetch).toHaveBeenCalledWith("/api/projects/proj-1/tasks", {
        method: "POST",
        body: JSON.stringify(requestData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(result).toEqual(mockTask);
      expect(result.id).toBe("task-new");
    });

    test("makes POST request without optional fields", async () => {
      const projectId = "proj-1";
      const requestData = { title: "Simple Task" };

      const mockTask: Task = {
        id: "task-simple",
        project_id: projectId,
        title: requestData.title,
        description: null,
        status: "todo",
        position: 5,
        assigned_user_id: null,
        assigned_user_name: null,
        assigned_user_avatar_color: null,
        created_at: "2024-01-15T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
      };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFetchResponse(mockTask)
      );

      const result = await client.createTask(projectId, requestData);

      expect(fetch).toHaveBeenCalledWith("/api/projects/proj-1/tasks", {
        method: "POST",
        body: JSON.stringify(requestData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(result).toEqual(mockTask);
    });

    test("rejects on HTTP error", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockErrorResponse(400, "Title is required")
      );

      await expect(
        client.createTask("proj-1", { title: "" })
      ).rejects.toThrow("Title is required");
    });
  });

  describe("updateTask", () => {
    test("makes PUT request to /api/tasks/{id} with proper body", async () => {
      const taskId = "task-1";
      const requestData = {
        title: "Updated title",
        description: "Updated description",
      };

      const mockTask: Task = {
        id: taskId,
        project_id: "proj-1",
        title: requestData.title,
        description: requestData.description,
        status: "in_progress",
        position: 0,
        assigned_user_id: "user-1",
        assigned_user_name: "Alice Johnson",
        assigned_user_avatar_color: "#FF5733",
        created_at: "2024-01-05T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
      };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFetchResponse(mockTask)
      );

      const result = await client.updateTask(taskId, requestData);

      expect(fetch).toHaveBeenCalledWith("/api/tasks/task-1", {
        method: "PUT",
        body: JSON.stringify(requestData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(result).toEqual(mockTask);
      expect(result.title).toBe("Updated title");
    });

    test("makes PUT request with only title", async () => {
      const taskId = "task-1";
      const requestData = { title: "New Title" };

      const mockTask: Task = {
        id: taskId,
        project_id: "proj-1",
        title: requestData.title,
        description: "Original description",
        status: "todo",
        position: 0,
        assigned_user_id: null,
        assigned_user_name: null,
        assigned_user_avatar_color: null,
        created_at: "2024-01-05T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
      };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFetchResponse(mockTask)
      );

      const result = await client.updateTask(taskId, requestData);

      expect(fetch).toHaveBeenCalledWith("/api/tasks/task-1", {
        method: "PUT",
        body: JSON.stringify(requestData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(result).toEqual(mockTask);
    });

    test("rejects on HTTP error", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockErrorResponse(404, "Task not found")
      );

      await expect(
        client.updateTask("task-invalid", { title: "Title" })
      ).rejects.toThrow("Task not found");
    });
  });

  describe("updateTaskStatus", () => {
    test("makes PATCH request to /api/tasks/{id}/status with status and position", async () => {
      const taskId = "task-1";
      const status = "in_progress";
      const position = 2;

      const mockTask: Task = {
        id: taskId,
        project_id: "proj-1",
        title: "Design mockups",
        description: "Create UI mockups for the homepage",
        status: status as any,
        position: position,
        assigned_user_id: "user-1",
        assigned_user_name: "Alice Johnson",
        assigned_user_avatar_color: "#FF5733",
        created_at: "2024-01-05T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
      };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFetchResponse(mockTask)
      );

      const result = await client.updateTaskStatus(taskId, status as any, position);

      expect(fetch).toHaveBeenCalledWith("/api/tasks/task-1/status", {
        method: "PATCH",
        body: JSON.stringify({ status, position }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(result).toEqual(mockTask);
      expect(result.status).toBe("in_progress");
      expect(result.position).toBe(2);
    });

    test("updates to done status", async () => {
      const taskId = "task-1";
      const status = "done";
      const position = 10;

      const mockTask: Task = {
        id: taskId,
        project_id: "proj-1",
        title: "Design mockups",
        description: "Create UI mockups for the homepage",
        status: status as any,
        position: position,
        assigned_user_id: "user-1",
        assigned_user_name: "Alice Johnson",
        assigned_user_avatar_color: "#FF5733",
        created_at: "2024-01-05T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
      };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFetchResponse(mockTask)
      );

      const result = await client.updateTaskStatus(taskId, status as any, position);

      expect(result.status).toBe("done");
      expect(result.position).toBe(10);
    });

    test("rejects on HTTP error", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockErrorResponse(400, "Invalid status")
      );

      await expect(
        client.updateTaskStatus("task-1", "invalid_status" as any, 0)
      ).rejects.toThrow("Invalid status");
    });
  });

  describe("assignTask", () => {
    test("makes PATCH request to /api/tasks/{id}/assign with assigned_user_id", async () => {
      const taskId = "task-1";
      const assignedUserId = "user-2";

      const mockTask: Task = {
        id: taskId,
        project_id: "proj-1",
        title: "Design mockups",
        description: "Create UI mockups for the homepage",
        status: "todo",
        position: 0,
        assigned_user_id: assignedUserId,
        assigned_user_name: "Bob Smith",
        assigned_user_avatar_color: "#33FF57",
        created_at: "2024-01-05T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
      };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFetchResponse(mockTask)
      );

      const result = await client.assignTask(taskId, assignedUserId);

      expect(fetch).toHaveBeenCalledWith("/api/tasks/task-1/assign", {
        method: "PATCH",
        body: JSON.stringify({ assigned_user_id: assignedUserId }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(result).toEqual(mockTask);
      expect(result.assigned_user_id).toBe("user-2");
    });

    test("unassigns task by setting assigned_user_id to null", async () => {
      const taskId = "task-1";

      const mockTask: Task = {
        id: taskId,
        project_id: "proj-1",
        title: "Design mockups",
        description: "Create UI mockups for the homepage",
        status: "todo",
        position: 0,
        assigned_user_id: null,
        assigned_user_name: null,
        assigned_user_avatar_color: null,
        created_at: "2024-01-05T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
      };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFetchResponse(mockTask)
      );

      const result = await client.assignTask(taskId, null);

      expect(fetch).toHaveBeenCalledWith("/api/tasks/task-1/assign", {
        method: "PATCH",
        body: JSON.stringify({ assigned_user_id: null }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(result).toEqual(mockTask);
      expect(result.assigned_user_id).toBeNull();
    });

    test("rejects on HTTP error", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockErrorResponse(404, "Task not found")
      );

      await expect(
        client.assignTask("task-invalid", "user-1")
      ).rejects.toThrow("Task not found");
    });
  });

  describe("deleteTask", () => {
    test("makes DELETE request to /api/tasks/{id}", async () => {
      const taskId = "task-1";
      const mockResponse = { message: "Task deleted successfully", id: taskId };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFetchResponse(mockResponse)
      );

      const result = await client.deleteTask(taskId);

      expect(fetch).toHaveBeenCalledWith("/api/tasks/task-1", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(result).toEqual(mockResponse);
      expect(result.id).toBe("task-1");
    });

    test("rejects on HTTP error", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockErrorResponse(404, "Task not found")
      );

      await expect(client.deleteTask("task-invalid")).rejects.toThrow(
        "Task not found"
      );
    });

    test("rejects on HTTP 403 unauthorized", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockErrorResponse(403, "You do not have permission to delete this task")
      );

      await expect(client.deleteTask("task-1")).rejects.toThrow(
        "You do not have permission to delete this task"
      );
    });
  });

  // =========================================================================
  // Comments Tests
  // =========================================================================

  describe("fetchComments", () => {
    test("makes GET request to /api/tasks/{taskId}/comments and returns Comment[]", async () => {
      const mockComments: Comment[] = [
        {
          id: "comment-1",
          task_id: "task-1",
          user_id: "user-1",
          parent_comment_id: null,
          content: "This looks great!",
          created_at: "2024-01-10T00:00:00Z",
          updated_at: "2024-01-10T00:00:00Z",
          author_name: "Alice Johnson",
          author_avatar_color: "#FF5733",
        },
      ];

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFetchResponse(mockComments)
      );

      const result = await client.fetchComments("task-1");

      expect(fetch).toHaveBeenCalledWith("/api/tasks/task-1/comments", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(result).toEqual(mockComments);
      expect(result[0]!.content).toBe("This looks great!");
    });

    test("rejects on HTTP error", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockErrorResponse(404, "Task not found")
      );

      await expect(client.fetchComments("task-invalid")).rejects.toThrow(
        "Task not found"
      );
    });
  });

  describe("createComment", () => {
    test("makes POST request to /api/tasks/{taskId}/comments with X-User-Id header", async () => {
      const taskId = "task-1";
      const userId = "user-1";
      const requestData = { content: "Great work!" };

      const mockComment: Comment = {
        id: "comment-new",
        task_id: taskId,
        user_id: userId,
        parent_comment_id: null,
        content: requestData.content,
        created_at: "2024-01-15T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
        author_name: "Alice Johnson",
        author_avatar_color: "#FF5733",
      };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFetchResponse(mockComment)
      );

      const result = await client.createComment(taskId, userId, requestData);

      expect(fetch).toHaveBeenCalledWith("/api/tasks/task-1/comments", {
        method: "POST",
        body: JSON.stringify(requestData),
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": "user-1",
        },
      });

      expect(result).toEqual(mockComment);
      expect(result.content).toBe("Great work!");
    });

    test("includes parent_comment_id when replying to a comment", async () => {
      const taskId = "task-1";
      const userId = "user-1";
      const parentCommentId = "comment-1";
      const requestData = {
        content: "Thanks!",
        parent_comment_id: parentCommentId,
      };

      const mockComment: Comment = {
        id: "comment-reply",
        task_id: taskId,
        user_id: userId,
        parent_comment_id: parentCommentId,
        content: requestData.content,
        created_at: "2024-01-15T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
        author_name: "Alice Johnson",
        author_avatar_color: "#FF5733",
      };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFetchResponse(mockComment)
      );

      const result = await client.createComment(taskId, userId, requestData);

      expect(fetch).toHaveBeenCalledWith("/api/tasks/task-1/comments", {
        method: "POST",
        body: JSON.stringify(requestData),
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": "user-1",
        },
      });

      expect(result).toEqual(mockComment);
      expect(result.parent_comment_id).toBe("comment-1");
    });

    test("rejects on HTTP error", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockErrorResponse(401, "Unauthorized")
      );

      await expect(
        client.createComment("task-1", "user-invalid", { content: "Comment" })
      ).rejects.toThrow("Unauthorized");
    });

    test("includes X-User-Id header even for different userId", async () => {
      const taskId = "task-1";
      const userId = "user-2";
      const requestData = { content: "Comment from user 2" };

      const mockComment: Comment = {
        id: "comment-new",
        task_id: taskId,
        user_id: userId,
        parent_comment_id: null,
        content: requestData.content,
        created_at: "2024-01-15T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
        author_name: "Bob Smith",
        author_avatar_color: "#33FF57",
      };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFetchResponse(mockComment)
      );

      const result = await client.createComment(taskId, userId, requestData);

      expect(fetch).toHaveBeenCalledWith("/api/tasks/task-1/comments", {
        method: "POST",
        body: JSON.stringify(requestData),
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": "user-2",
        },
      });

      expect(result.user_id).toBe("user-2");
    });
  });

  describe("updateComment", () => {
    test("makes PUT request to /api/comments/{id} with X-User-Id header", async () => {
      const commentId = "comment-1";
      const userId = "user-1";
      const newContent = "Updated comment";

      const mockComment: Comment = {
        id: commentId,
        task_id: "task-1",
        user_id: userId,
        parent_comment_id: null,
        content: newContent,
        created_at: "2024-01-10T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
        author_name: "Alice Johnson",
        author_avatar_color: "#FF5733",
      };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFetchResponse(mockComment)
      );

      const result = await client.updateComment(commentId, userId, newContent);

      expect(fetch).toHaveBeenCalledWith("/api/comments/comment-1", {
        method: "PUT",
        body: JSON.stringify({ content: newContent }),
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": "user-1",
        },
      });

      expect(result).toEqual(mockComment);
      expect(result.content).toBe("Updated comment");
    });

    test("includes X-User-Id header with different userId", async () => {
      const commentId = "comment-1";
      const userId = "user-2";
      const newContent = "Updated by another user";

      const mockComment: Comment = {
        id: commentId,
        task_id: "task-1",
        user_id: "user-1",
        parent_comment_id: null,
        content: newContent,
        created_at: "2024-01-10T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
        author_name: "Alice Johnson",
        author_avatar_color: "#FF5733",
      };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFetchResponse(mockComment)
      );

      await client.updateComment(commentId, userId, newContent);

      expect(fetch).toHaveBeenCalledWith("/api/comments/comment-1", {
        method: "PUT",
        body: JSON.stringify({ content: newContent }),
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": "user-2",
        },
      });
    });

    test("rejects on HTTP 403 forbidden (user not owner)", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockErrorResponse(403, "You can only edit your own comments")
      );

      await expect(
        client.updateComment("comment-1", "user-2", "Updated content")
      ).rejects.toThrow("You can only edit your own comments");
    });

    test("rejects on HTTP error", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockErrorResponse(404, "Comment not found")
      );

      await expect(
        client.updateComment("comment-invalid", "user-1", "New content")
      ).rejects.toThrow("Comment not found");
    });
  });

  describe("deleteComment", () => {
    test("makes DELETE request to /api/comments/{id} with X-User-Id header", async () => {
      const commentId = "comment-1";
      const userId = "user-1";
      const mockResponse = {
        message: "Comment deleted successfully",
        id: commentId,
      };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFetchResponse(mockResponse)
      );

      const result = await client.deleteComment(commentId, userId);

      expect(fetch).toHaveBeenCalledWith("/api/comments/comment-1", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": "user-1",
        },
      });

      expect(result).toEqual(mockResponse);
      expect(result.id).toBe("comment-1");
    });

    test("includes X-User-Id header with different userId", async () => {
      const commentId = "comment-1";
      const userId = "user-2";
      const mockResponse = {
        message: "Comment deleted successfully",
        id: commentId,
      };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFetchResponse(mockResponse)
      );

      await client.deleteComment(commentId, userId);

      expect(fetch).toHaveBeenCalledWith("/api/comments/comment-1", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": "user-2",
        },
      });
    });

    test("rejects on HTTP 403 forbidden (user not owner)", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockErrorResponse(403, "You can only delete your own comments")
      );

      await expect(
        client.deleteComment("comment-1", "user-2")
      ).rejects.toThrow("You can only delete your own comments");
    });

    test("rejects on HTTP error", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockErrorResponse(404, "Comment not found")
      );

      await expect(client.deleteComment("comment-invalid", "user-1")).rejects.toThrow(
        "Comment not found"
      );
    });
  });

  // =========================================================================
  // Integration Tests
  // =========================================================================

  describe("Multiple requests", () => {
    test("handles multiple sequential fetch calls independently", async () => {
      const mockUsers: User[] = [
        {
          id: "user-1",
          name: "Alice",
          role: "admin",
          avatar_color: "#FF5733",
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      const mockProjects: Project[] = [
        {
          id: "proj-1",
          name: "Project A",
          description: null,
          task_count: 5,
          done_count: 2,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];

      (fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockFetchResponse(mockUsers))
        .mockResolvedValueOnce(mockFetchResponse(mockProjects));

      const users = await client.fetchUsers();
      const projects = await client.fetchProjects();

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(users).toEqual(mockUsers);
      expect(projects).toEqual(mockProjects);
    });
  });

  describe("API_BASE URL construction", () => {
    test("uses empty string as default API_BASE", async () => {
      const mockUsers: User[] = [];

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFetchResponse(mockUsers)
      );

      await client.fetchUsers();

      // The client constructs full URL as ${API_BASE}${path}
      // With empty API_BASE, the URL should be just the path
      expect(fetch).toHaveBeenCalledWith("/api/users", expect.any(Object));
    });
  });
});
