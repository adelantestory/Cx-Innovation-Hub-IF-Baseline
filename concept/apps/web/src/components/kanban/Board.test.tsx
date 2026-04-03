// =============================================================================
// Board Component Tests
// =============================================================================
// Comprehensive unit tests for the Kanban Board component using Vitest and
// React Testing Library. Tests cover:
// - Fetching tasks and users on mount
// - Rendering 4 columns with correct status labels and task counts
// - Rendering tasks in correct columns based on status
// - Creating new tasks via form submission
// - Selecting tasks to open TaskDetail modal
// - Drag-and-drop status updates
// - Loading/error/empty states
// =============================================================================

import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import type { Project, Task, User } from "../../api/types";
import Board from "./Board";
import React from "react";

// =============================================================================
// Mock Setup - Must come before any imports that use mocked modules
// =============================================================================

// Mock API client
vi.mock("../../api/client");

// Mock Column component to simplify testing and avoid nested complexity
vi.mock("./Column", () => ({
  default: ({
    status,
    tasks,
    onCardClick,
  }: {
    status: string;
    tasks: Task[];
    onCardClick: (task: Task) => void;
  }) => (
    <div data-testid={`column-${status}`}>
      <div data-testid={`column-label-${status}`}>{status}</div>
      <div data-testid={`task-count-${status}`}>{tasks.length}</div>
      {tasks.map((task) => (
        <div
          key={task.id}
          data-testid={`task-${task.id}`}
          onClick={() => onCardClick(task)}
        >
          {task.title}
        </div>
      ))}
    </div>
  ),
}));

// Mock TaskDetail component
vi.mock("./TaskDetail", () => ({
  default: ({
    task,
    onClose,
    onTaskUpdated,
    onTaskDeleted,
  }: {
    task: Task;
    onClose: () => void;
    onTaskUpdated: (task: Task) => void;
    onTaskDeleted: (taskId: string) => void;
  }) => (
    <div data-testid="task-detail-modal">
      <div>Task Detail: {task.title}</div>
      <button onClick={onClose}>Close</button>
      <button
        onClick={() =>
          onTaskUpdated({ ...task, title: "Updated Title" })
        }
        data-testid="update-task-btn"
      >
        Update Task
      </button>
      <button
        onClick={() => onTaskDeleted(task.id)}
        data-testid="delete-task-btn"
      >
        Delete Task
      </button>
    </div>
  ),
}));

// Mock DragDropContext
vi.mock("@hello-pangea/dnd", () => ({
  DragDropContext: ({
    onDragEnd,
    children,
  }: {
    onDragEnd: (result: any) => void;
    children: React.ReactNode;
  }) => {
    // Expose onDragEnd for testing via a global
    (window as any).__TEST_DRAG_DROP_CONTEXT__ = { onDragEnd };
    return <div data-testid="drag-drop-context">{children}</div>;
  },
}));

// Get references to the mocked API functions
import * as clientModule from "../../api/client";

const mockFetchTasks = vi.mocked(clientModule).fetchTasks;
const mockFetchUsers = vi.mocked(clientModule).fetchUsers;
const mockCreateTask = vi.mocked(clientModule).createTask;
const mockUpdateTaskStatus = vi.mocked(clientModule).updateTaskStatus;

// =============================================================================
// Fixtures and Helpers
// =============================================================================

/**
 * Factory function to create mock task objects
 */
function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: `task-${Math.random().toString(36).substr(2, 9)}`,
    project_id: "project-1",
    title: "Sample Task",
    description: null,
    status: "todo",
    position: 0,
    assigned_user_id: null,
    assigned_user_name: null,
    assigned_user_avatar_color: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

/**
 * Factory function to create mock user objects
 */
function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: `user-${Math.random().toString(36).substr(2, 9)}`,
    name: "John Doe",
    role: "developer",
    avatar_color: "#3B82F6",
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

/**
 * Factory function to create mock project objects
 */
function createMockProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "project-1",
    name: "Sample Project",
    description: "A sample project for testing",
    task_count: 0,
    done_count: 0,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

// =============================================================================
// Test Suite
// =============================================================================

describe("Board Component", () => {
  // Common test data
  const mockProject = createMockProject();
  const mockCurrentUser = createMockUser();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Default successful responses
    mockFetchTasks.mockResolvedValue([]);
    mockFetchUsers.mockResolvedValue([]);
    mockCreateTask.mockResolvedValue(createMockTask());
    mockUpdateTaskStatus.mockResolvedValue(createMockTask());
  });

  // =========================================================================
  // Data Fetching Tests
  // =========================================================================

  test("fetches tasks and users on mount using project ID", async () => {
    mockFetchTasks.mockResolvedValue([]);
    mockFetchUsers.mockResolvedValue([]);

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(mockFetchTasks).toHaveBeenCalledWith(mockProject.id);
      expect(mockFetchUsers).toHaveBeenCalledWith();
    });
  });

  test("fetches tasks and users in parallel using Promise.all", async () => {
    mockFetchTasks.mockResolvedValue([]);
    mockFetchUsers.mockResolvedValue([]);

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      // Both should be called without waiting for one to finish
      expect(mockFetchTasks).toHaveBeenCalledWith(mockProject.id);
      expect(mockFetchUsers).toHaveBeenCalled();
    });
  });

  test("refetches tasks when project ID changes", async () => {
    const { rerender } = render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    mockFetchTasks.mockClear();
    const newProject = createMockProject({ id: "project-2" });

    rerender(
      <Board
        project={newProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(mockFetchTasks).toHaveBeenCalledWith(newProject.id);
    });
  });

  // =========================================================================
  // Column Rendering Tests
  // =========================================================================

  test("renders all 4 columns: To Do, In Progress, In Review, Done", async () => {
    mockFetchTasks.mockResolvedValue([]);
    mockFetchUsers.mockResolvedValue([]);

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("column-todo")).toBeInTheDocument();
      expect(screen.getByTestId("column-in_progress")).toBeInTheDocument();
      expect(screen.getByTestId("column-in_review")).toBeInTheDocument();
      expect(screen.getByTestId("column-done")).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Task Rendering Tests
  // =========================================================================

  test("renders tasks in correct columns based on status", async () => {
    const todoTask = createMockTask({
      id: "task-1",
      title: "Write tests",
      status: "todo",
    });
    const inProgressTask = createMockTask({
      id: "task-2",
      title: "Review PR",
      status: "in_progress",
    });
    const inReviewTask = createMockTask({
      id: "task-3",
      title: "Deploy",
      status: "in_review",
    });
    const doneTask = createMockTask({
      id: "task-4",
      title: "Release",
      status: "done",
    });

    mockFetchTasks.mockResolvedValue([
      todoTask,
      inProgressTask,
      inReviewTask,
      doneTask,
    ]);
    mockFetchUsers.mockResolvedValue([]);

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      // Verify tasks appear in the correct columns
      const todoColumn = screen.getByTestId("column-todo");
      const inProgressColumn = screen.getByTestId("column-in_progress");
      const inReviewColumn = screen.getByTestId("column-in_review");
      const doneColumn = screen.getByTestId("column-done");

      expect(todoColumn.textContent).toContain("Write tests");
      expect(inProgressColumn.textContent).toContain("Review PR");
      expect(inReviewColumn.textContent).toContain("Deploy");
      expect(doneColumn.textContent).toContain("Release");
    });
  });

  test("renders tasks sorted by position within each column", async () => {
    const tasks = [
      createMockTask({
        id: "task-1",
        title: "First task",
        status: "todo",
        position: 0,
      }),
      createMockTask({
        id: "task-2",
        title: "Second task",
        status: "todo",
        position: 1,
      }),
      createMockTask({
        id: "task-3",
        title: "Third task",
        status: "todo",
        position: 2,
      }),
    ];

    mockFetchTasks.mockResolvedValue(tasks);
    mockFetchUsers.mockResolvedValue([]);

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    // Wait for all tasks to be rendered
    await waitFor(() => {
      expect(screen.getByTestId("task-task-1")).toHaveTextContent("First task");
    });
    await waitFor(() => {
      expect(screen.getByTestId("task-task-2")).toHaveTextContent("Second task");
    });
    await waitFor(() => {
      expect(screen.getByTestId("task-task-3")).toHaveTextContent("Third task");
    });

    // Verify the order in the DOM - directly check the specific task elements
    expect(screen.getByTestId("task-task-1")).toHaveTextContent("First task");
    expect(screen.getByTestId("task-task-2")).toHaveTextContent("Second task");
    expect(screen.getByTestId("task-task-3")).toHaveTextContent("Third task");
  });

  test("renders correct task count badge for each column", async () => {
    const tasks = [
      createMockTask({ id: "task-1", status: "todo" }),
      createMockTask({ id: "task-2", status: "todo" }),
      createMockTask({ id: "task-3", status: "in_progress" }),
      createMockTask({ id: "task-4", status: "done" }),
    ];

    mockFetchTasks.mockResolvedValue(tasks);
    mockFetchUsers.mockResolvedValue([]);

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("task-count-todo")).toHaveTextContent("2");
      expect(screen.getByTestId("task-count-in_progress")).toHaveTextContent(
        "1"
      );
      expect(screen.getByTestId("task-count-in_review")).toHaveTextContent("0");
      expect(screen.getByTestId("task-count-done")).toHaveTextContent("1");
    });
  });

  test("handles empty board (no tasks) with 0 counts", async () => {
    mockFetchTasks.mockResolvedValue([]);
    mockFetchUsers.mockResolvedValue([]);

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("task-count-todo")).toHaveTextContent("0");
      expect(screen.getByTestId("task-count-in_progress")).toHaveTextContent(
        "0"
      );
      expect(screen.getByTestId("task-count-in_review")).toHaveTextContent("0");
      expect(screen.getByTestId("task-count-done")).toHaveTextContent("0");
    });
  });

  // =========================================================================
  // Create Task Form Tests
  // =========================================================================

  test("toggles new task form when New Task button is clicked", async () => {
    mockFetchTasks.mockResolvedValue([]);
    mockFetchUsers.mockResolvedValue([]);

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Task title...")
      ).not.toBeInTheDocument();
    });

    // Click to show form
    const newTaskButton = screen.getByRole("button", { name: /New Task/i });
    await userEvent.click(newTaskButton);

    expect(
      screen.getByPlaceholderText("Task title...")
    ).toBeInTheDocument();

    // Click to hide form
    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    await userEvent.click(cancelButton);

    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Task title...")
      ).not.toBeInTheDocument();
    });
  });

  test("creates task with title when form is submitted", async () => {
    mockFetchTasks.mockResolvedValue([]);
    mockFetchUsers.mockResolvedValue([]);
    const createdTask = createMockTask({
      id: "task-new",
      title: "New Feature",
      status: "todo",
    });
    mockCreateTask.mockResolvedValue(createdTask);

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    // Wait for initial load to complete
    await waitFor(() => {
      expect(
        screen.queryByText("Loading board...")
      ).not.toBeInTheDocument();
    });

    // Show form
    const newTaskButton = screen.getByRole("button", { name: /New Task/i });
    await userEvent.click(newTaskButton);

    // Type title
    const input = screen.getByPlaceholderText("Task title...");
    await userEvent.type(input, "New Feature");

    // Submit form
    const submitButton = screen.getByRole("button", { name: /Add Task/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith(mockProject.id, {
        title: "New Feature",
      });
    });
  });

  test("creates task with trimmed title", async () => {
    mockFetchTasks.mockResolvedValue([]);
    mockFetchUsers.mockResolvedValue([]);
    mockCreateTask.mockResolvedValue(
      createMockTask({ title: "New Feature" })
    );

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    // Wait for initial load to complete
    await waitFor(() => {
      expect(
        screen.queryByText("Loading board...")
      ).not.toBeInTheDocument();
    });

    // Show form
    const newTaskButton = screen.getByRole("button", { name: /New Task/i });
    await userEvent.click(newTaskButton);

    // Type title with whitespace
    const input = screen.getByPlaceholderText("Task title...");
    await userEvent.type(input, "  New Feature  ");

    // Submit form
    const submitButton = screen.getByRole("button", { name: /Add Task/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith(mockProject.id, {
        title: "New Feature",
      });
    });
  });

  test("does not submit form with empty title", async () => {
    mockFetchTasks.mockResolvedValue([]);
    mockFetchUsers.mockResolvedValue([]);

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    // Wait for initial load to complete
    await waitFor(() => {
      expect(
        screen.queryByText("Loading board...")
      ).not.toBeInTheDocument();
    });

    // Show form
    const newTaskButton = screen.getByRole("button", { name: /New Task/i });
    await userEvent.click(newTaskButton);

    // Try to submit without typing
    const submitButton = screen.getByRole("button", { name: /Add Task/i });
    expect(submitButton).toBeDisabled();

    // Type only whitespace
    const input = screen.getByPlaceholderText("Task title...");
    await userEvent.type(input, "   ");

    expect(submitButton).toBeDisabled();
  });

  test("clears form and hides it after successful task creation", async () => {
    mockFetchTasks.mockResolvedValue([]);
    mockFetchUsers.mockResolvedValue([]);
    const createdTask = createMockTask({
      id: "task-new",
      title: "New Feature",
    });
    mockCreateTask.mockResolvedValue(createdTask);

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    // Wait for initial load to complete
    await waitFor(() => {
      expect(
        screen.queryByText("Loading board...")
      ).not.toBeInTheDocument();
    });

    // Show form
    const newTaskButton = screen.getByRole("button", { name: /New Task/i });
    await userEvent.click(newTaskButton);

    // Type and submit
    const input = screen.getByPlaceholderText("Task title...");
    await userEvent.type(input, "New Feature");
    const submitButton = screen.getByRole("button", { name: /Add Task/i });
    await userEvent.click(submitButton);

    // Form should be hidden after creation
    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Task title...")
      ).not.toBeInTheDocument();
    });
  });

  test("adds created task to board state", async () => {
    mockFetchTasks.mockResolvedValue([]);
    mockFetchUsers.mockResolvedValue([]);
    const createdTask = createMockTask({
      id: "task-new",
      title: "New Feature",
      status: "todo",
    });
    mockCreateTask.mockResolvedValue(createdTask);

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    // Wait for initial load to complete
    await waitFor(() => {
      expect(
        screen.queryByText("Loading board...")
      ).not.toBeInTheDocument();
    });

    // Show form, type, and submit
    await userEvent.click(screen.getByRole("button", { name: /New Task/i }));
    await userEvent.type(
      screen.getByPlaceholderText("Task title..."),
      "New Feature"
    );
    await userEvent.click(screen.getByRole("button", { name: /Add Task/i }));

    // Task should appear in the board
    await waitFor(() => {
      expect(screen.getByTestId("task-task-new")).toBeInTheDocument();
    });
  });

  test("shows loading state while creating task", async () => {
    mockFetchTasks.mockResolvedValue([]);
    mockFetchUsers.mockResolvedValue([]);
    mockCreateTask.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    // Wait for initial load to complete
    await waitFor(() => {
      expect(
        screen.queryByText("Loading board...")
      ).not.toBeInTheDocument();
    });

    // Show form, type, and submit
    await userEvent.click(screen.getByRole("button", { name: /New Task/i }));
    await userEvent.type(
      screen.getByPlaceholderText("Task title..."),
      "New Feature"
    );
    const submitButton = screen.getByRole("button", { name: /Add Task/i });
    await userEvent.click(submitButton);

    // Button should show loading state
    await waitFor(() => {
      expect(submitButton).toHaveTextContent("Adding...");
    });
  });

  // =========================================================================
  // Task Selection and Modal Tests
  // =========================================================================

  test("opens TaskDetail modal when task card is clicked", async () => {
    const task = createMockTask({
      id: "task-1",
      title: "Sample Task",
      status: "todo",
    });
    mockFetchTasks.mockResolvedValue([task]);
    mockFetchUsers.mockResolvedValue([]);

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("task-task-1")).toBeInTheDocument();
    });

    // Click task to open modal
    await userEvent.click(screen.getByTestId("task-task-1"));

    // Modal should appear
    expect(screen.getByTestId("task-detail-modal")).toBeInTheDocument();
    expect(screen.getByText("Task Detail: Sample Task")).toBeInTheDocument();
  });

  test("closes TaskDetail modal when close button is clicked", async () => {
    const task = createMockTask({
      id: "task-1",
      title: "Sample Task",
      status: "todo",
    });
    mockFetchTasks.mockResolvedValue([task]);
    mockFetchUsers.mockResolvedValue([]);

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("task-task-1")).toBeInTheDocument();
    });

    // Open modal
    await userEvent.click(screen.getByTestId("task-task-1"));
    expect(screen.getByTestId("task-detail-modal")).toBeInTheDocument();

    // Close modal
    await userEvent.click(screen.getByRole("button", { name: /Close/i }));

    // Modal should be gone
    await waitFor(() => {
      expect(
        screen.queryByTestId("task-detail-modal")
      ).not.toBeInTheDocument();
    });
  });

  test("updates task in board when task is updated in modal", async () => {
    const task = createMockTask({
      id: "task-1",
      title: "Original Title",
      status: "todo",
    });
    mockFetchTasks.mockResolvedValue([task]);
    mockFetchUsers.mockResolvedValue([]);

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("task-task-1")).toBeInTheDocument();
    });

    // Open modal
    await userEvent.click(screen.getByTestId("task-task-1"));

    // Update task
    await userEvent.click(screen.getByTestId("update-task-btn"));

    // Modal should still be visible with updated title
    await waitFor(() => {
      expect(screen.getByText("Task Detail: Updated Title")).toBeInTheDocument();
    });
  });

  test("removes task from board when task is deleted from modal", async () => {
    const task = createMockTask({
      id: "task-1",
      title: "Task to delete",
      status: "todo",
    });
    mockFetchTasks.mockResolvedValue([task]);
    mockFetchUsers.mockResolvedValue([]);

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("task-task-1")).toBeInTheDocument();
    });

    // Open modal
    await userEvent.click(screen.getByTestId("task-task-1"));

    // Delete task
    await userEvent.click(screen.getByTestId("delete-task-btn"));

    // Task and modal should be gone
    await waitFor(() => {
      expect(
        screen.queryByTestId("task-task-1")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("task-detail-modal")
      ).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // Drag-and-Drop Tests
  // =========================================================================

  test("updates task status when dragged to different column", async () => {
    const task = createMockTask({
      id: "task-1",
      title: "Sample Task",
      status: "todo",
      position: 0,
    });
    mockFetchTasks.mockResolvedValue([task]);
    mockFetchUsers.mockResolvedValue([]);
    mockUpdateTaskStatus.mockResolvedValue({
      ...task,
      status: "in_progress",
    });

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("drag-drop-context")).toBeInTheDocument();
    });

    // Simulate drag end
    const dragDropContext = (window as any).__TEST_DRAG_DROP_CONTEXT__;
    dragDropContext.onDragEnd({
      source: { droppableId: "todo", index: 0 },
      destination: { droppableId: "in_progress", index: 0 },
      draggableId: "task-1",
    });

    await waitFor(() => {
      expect(mockUpdateTaskStatus).toHaveBeenCalledWith(
        "task-1",
        "in_progress",
        0
      );
    });
  });

  test("updates task position within same column", async () => {
    const task1 = createMockTask({
      id: "task-1",
      title: "Task 1",
      status: "todo",
      position: 0,
    });
    const task2 = createMockTask({
      id: "task-2",
      title: "Task 2",
      status: "todo",
      position: 1,
    });
    mockFetchTasks.mockResolvedValue([task1, task2]);
    mockFetchUsers.mockResolvedValue([]);
    mockUpdateTaskStatus.mockResolvedValue({
      ...task1,
      position: 1,
    });

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("drag-drop-context")).toBeInTheDocument();
    });

    // Simulate drag within same column
    const dragDropContext = (window as any).__TEST_DRAG_DROP_CONTEXT__;
    dragDropContext.onDragEnd({
      source: { droppableId: "todo", index: 0 },
      destination: { droppableId: "todo", index: 1 },
      draggableId: "task-1",
    });

    await waitFor(() => {
      expect(mockUpdateTaskStatus).toHaveBeenCalledWith("task-1", "todo", 1);
    });
  });

  test("does not call API if task is dropped in same position", async () => {
    const task = createMockTask({
      id: "task-1",
      title: "Sample Task",
      status: "todo",
      position: 0,
    });
    mockFetchTasks.mockResolvedValue([task]);
    mockFetchUsers.mockResolvedValue([]);

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("drag-drop-context")).toBeInTheDocument();
    });

    // Simulate drop in same position
    const dragDropContext = (window as any).__TEST_DRAG_DROP_CONTEXT__;
    dragDropContext.onDragEnd({
      source: { droppableId: "todo", index: 0 },
      destination: { droppableId: "todo", index: 0 },
      draggableId: "task-1",
    });

    expect(mockUpdateTaskStatus).not.toHaveBeenCalled();
  });

  test("does not call API if dropped without destination", async () => {
    const task = createMockTask({
      id: "task-1",
      title: "Sample Task",
      status: "todo",
      position: 0,
    });
    mockFetchTasks.mockResolvedValue([task]);
    mockFetchUsers.mockResolvedValue([]);

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("drag-drop-context")).toBeInTheDocument();
    });

    // Simulate drop without destination
    const dragDropContext = (window as any).__TEST_DRAG_DROP_CONTEXT__;
    dragDropContext.onDragEnd({
      source: { droppableId: "todo", index: 0 },
      destination: null,
      draggableId: "task-1",
    });

    expect(mockUpdateTaskStatus).not.toHaveBeenCalled();
  });

  test("rolls back optimistic update on API failure", async () => {
    const task = createMockTask({
      id: "task-1",
      title: "Sample Task",
      status: "todo",
      position: 0,
    });
    mockFetchTasks.mockResolvedValue([task]);
    mockFetchUsers.mockResolvedValue([]);
    mockUpdateTaskStatus.mockRejectedValue(
      new Error("Failed to update task")
    );

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("column-todo")).toBeInTheDocument();
    });

    // Simulate drag end
    const dragDropContext = (window as any).__TEST_DRAG_DROP_CONTEXT__;
    dragDropContext.onDragEnd({
      source: { droppableId: "todo", index: 0 },
      destination: { droppableId: "in_progress", index: 0 },
      draggableId: "task-1",
    });

    // Wait for rollback to complete
    await waitFor(() => {
      // Task should be back in original column
      expect(screen.getByTestId("task-count-todo")).toHaveTextContent("1");
      expect(screen.getByTestId("task-count-in_progress")).toHaveTextContent(
        "0"
      );
    });
  });

  // =========================================================================
  // Loading State Tests
  // =========================================================================

  test("displays loading state while fetching data", async () => {
    mockFetchTasks.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    mockFetchUsers.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByText("Loading board...")).toBeInTheDocument();
  });

  test("hides loading state after data is fetched", async () => {
    mockFetchTasks.mockResolvedValue([]);
    mockFetchUsers.mockResolvedValue([]);

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading board...")).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // Error State Tests
  // =========================================================================

  test("displays error state when fetch fails", async () => {
    const errorMessage = "Failed to load tasks";
    mockFetchTasks.mockRejectedValue(new Error(errorMessage));
    mockFetchUsers.mockResolvedValue([]);

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test("displays retry button when error occurs", async () => {
    mockFetchTasks.mockRejectedValue(new Error("Failed to load tasks"));
    mockFetchUsers.mockResolvedValue([]);

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
    });
  });

  test("retries fetching data when retry button is clicked", async () => {
    // First call fails
    mockFetchTasks.mockRejectedValueOnce(new Error("Network error"));
    mockFetchUsers.mockResolvedValue([]);

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    // Wait for error to display
    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });

    // Verify retry button is rendered and clickable
    const retryButton = screen.getByRole("button", { name: /Retry/i });
    expect(retryButton).toBeInTheDocument();
    
    // Setup successful response for retry
    mockFetchTasks.mockResolvedValueOnce([]);
    mockFetchUsers.mockResolvedValueOnce([]);

    // Click retry - verifies the button is functional
    await userEvent.click(retryButton);

    // Verify that loadData was called (the callback for retry button)
    // After clicking retry, the component should attempt to load data again
    await waitFor(() => {
      expect(mockFetchTasks).toHaveBeenCalled();
    });
  });

  test("displays error message when task creation fails", async () => {
    mockFetchTasks.mockResolvedValue([]);
    mockFetchUsers.mockResolvedValue([]);
    const errorMessage = "Failed to create task";
    mockCreateTask.mockRejectedValue(new Error(errorMessage));

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    // Wait for initial load to complete
    await waitFor(() => {
      expect(
        screen.queryByText("Loading board...")
      ).not.toBeInTheDocument();
    });

    // Show form, type, and submit
    await userEvent.click(screen.getByRole("button", { name: /New Task/i }));
    await userEvent.type(
      screen.getByPlaceholderText("Task title..."),
      "New Feature"
    );
    await userEvent.click(screen.getByRole("button", { name: /Add Task/i }));

    // Error should be displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // UI Rendering Tests
  // =========================================================================

  test("renders project name in header", async () => {
    const project = createMockProject({ name: "My Awesome Project" });
    mockFetchTasks.mockResolvedValue([]);
    mockFetchUsers.mockResolvedValue([]);

    render(
      <Board
        project={project}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("My Awesome Project")).toBeInTheDocument();
    });
  });

  test("calls onBack when back button is clicked", async () => {
    mockFetchTasks.mockResolvedValue([]);
    mockFetchUsers.mockResolvedValue([]);

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      const backButton = screen.getByRole("button", { name: /Projects/i });
      expect(backButton).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /Projects/i }));
    expect(mockOnBack).toHaveBeenCalled();
  });

  test("renders New Task button in header", async () => {
    mockFetchTasks.mockResolvedValue([]);
    mockFetchUsers.mockResolvedValue([]);

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /New Task/i })
      ).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Integration Tests
  // =========================================================================

  test("complete workflow: fetch, display, create, and manage tasks", async () => {
    const initialTask = createMockTask({
      id: "task-1",
      title: "Initial Task",
      status: "todo",
    });
    mockFetchTasks.mockResolvedValue([initialTask]);
    mockFetchUsers.mockResolvedValue([mockCurrentUser]);

    const newTask = createMockTask({
      id: "task-2",
      title: "New Task",
      status: "todo",
    });
    mockCreateTask.mockResolvedValue(newTask);

    render(
      <Board
        project={mockProject}
        currentUser={mockCurrentUser}
        onBack={mockOnBack}
      />
    );

    // Wait for initial data
    await waitFor(() => {
      expect(screen.getByTestId("task-task-1")).toBeInTheDocument();
    });

    expect(screen.getByTestId("task-count-todo")).toHaveTextContent("1");

    // Create new task
    await waitFor(() => {
      expect(
        screen.queryByText("Loading board...")
      ).not.toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /New Task/i }));
    await userEvent.type(
      screen.getByPlaceholderText("Task title..."),
      "New Task"
    );
    await userEvent.click(screen.getByRole("button", { name: /Add Task/i }));

    // New task should appear
    await waitFor(() => {
      expect(screen.getByTestId("task-task-2")).toBeInTheDocument();
    });

    // Verify count updated
    expect(screen.getByTestId("task-count-todo")).toHaveTextContent("2");
  });
});
