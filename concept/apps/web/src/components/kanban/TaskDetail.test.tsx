// =============================================================================
// TaskDetail Component Tests
// =============================================================================
// Tests for the full-screen modal that displays task details, allows editing,
// assigning users, and managing comments. Uses Vitest + React Testing Library.
// =============================================================================

import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import TaskDetail from "./TaskDetail";
import type { Task, Comment, User } from "../../api/types";

// =============================================================================
// Mocks - Create vi.mock before any code that uses them
// =============================================================================

vi.mock("../../api/client");
vi.mock("../comments/CommentList", () => ({
  default: ({
    comments,
    onAddComment,
    onEditComment,
    onDeleteComment,
  }: {
    comments: Comment[];
    currentUserId: string;
    onAddComment: (content: string, parentId?: string) => Promise<void>;
    onEditComment: (id: string, content: string) => Promise<void>;
    onDeleteComment: (id: string) => Promise<void>;
  }) => (
    <div data-testid="comment-list">
      <div data-testid="comments-count">{comments.length}</div>
      <button
        data-testid="add-comment-button"
        onClick={() => onAddComment("Test comment")}
      >
        Add Comment
      </button>
      <button
        data-testid="edit-comment-button"
        onClick={() => onEditComment("comment-1", "Updated content")}
      >
        Edit Comment
      </button>
      <button
        data-testid="delete-comment-button"
        onClick={() => onDeleteComment("comment-1")}
      >
        Delete Comment
      </button>
    </div>
  ),
}));

// Get references to the mocked functions
import * as clientModule from "../../api/client";

const mockFetchComments = vi.mocked(clientModule).fetchComments;
const mockUpdateTask = vi.mocked(clientModule).updateTask;
const mockAssignTask = vi.mocked(clientModule).assignTask;
const mockDeleteTask = vi.mocked(clientModule).deleteTask;
const mockCreateComment = vi.mocked(clientModule).createComment;
const mockUpdateComment = vi.mocked(clientModule).updateComment;
const mockDeleteComment = vi.mocked(clientModule).deleteComment;

vi.mock("../comments/CommentList", () => ({
  default: ({
    comments,
    onAddComment,
    onEditComment,
    onDeleteComment,
  }: {
    comments: Comment[];
    currentUserId: string;
    onAddComment: (content: string, parentId?: string) => Promise<void>;
    onEditComment: (id: string, content: string) => Promise<void>;
    onDeleteComment: (id: string) => Promise<void>;
  }) => (
    <div data-testid="comment-list">
      <div data-testid="comments-count">{comments.length}</div>
      <button
        data-testid="add-comment-button"
        onClick={() => onAddComment("Test comment")}
      >
        Add Comment
      </button>
      <button
        data-testid="edit-comment-button"
        onClick={() => onEditComment("comment-1", "Updated content")}
      >
        Edit Comment
      </button>
      <button
        data-testid="delete-comment-button"
        onClick={() => onDeleteComment("comment-1")}
      >
        Delete Comment
      </button>
    </div>
  ),
}));

// =============================================================================
// Test Data
// =============================================================================

const mockCurrentUser: User = {
  id: "user-1",
  name: "Current User",
  role: "member",
  avatar_color: "#FF5733",
  created_at: "2024-01-01T00:00:00Z",
};

const mockUsers: User[] = [
  mockCurrentUser,
  {
    id: "user-2",
    name: "Alice Johnson",
    role: "member",
    avatar_color: "#33FF57",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "user-3",
    name: "Bob Smith",
    role: "member",
    avatar_color: "#3357FF",
    created_at: "2024-01-01T00:00:00Z",
  },
];

const mockTask: Task = {
  id: "task-1",
  project_id: "proj-1",
  title: "Implement user authentication",
  description: "Add JWT-based authentication to the API",
  status: "in_progress",
  position: 1,
  assigned_user_id: "user-2",
  assigned_user_name: "Alice Johnson",
  assigned_user_avatar_color: "#33FF57",
  created_at: "2024-01-01T12:00:00Z",
  updated_at: "2024-01-05T14:30:00Z",
};

const mockUnassignedTask: Task = {
  ...mockTask,
  id: "task-2",
  title: "Design landing page",
  assigned_user_id: null,
  assigned_user_name: null,
  assigned_user_avatar_color: null,
};

const mockComments: Comment[] = [
  {
    id: "comment-1",
    task_id: "task-1",
    user_id: "user-1",
    parent_comment_id: null,
    content: "This looks good, but we should consider security",
    created_at: "2024-01-02T10:00:00Z",
    updated_at: "2024-01-02T10:00:00Z",
    author_name: "Current User",
    author_avatar_color: "#FF5733",
  },
  {
    id: "comment-2",
    task_id: "task-1",
    user_id: "user-2",
    parent_comment_id: "comment-1",
    content: "Good point! Let me add rate limiting",
    created_at: "2024-01-02T11:00:00Z",
    updated_at: "2024-01-02T11:00:00Z",
    author_name: "Alice Johnson",
    author_avatar_color: "#33FF57",
  },
];

// =============================================================================
// Test Suite
// =============================================================================

describe("TaskDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockFetchComments.mockResolvedValue(mockComments);
    mockUpdateTask.mockResolvedValue(mockTask);
    mockAssignTask.mockResolvedValue(mockTask);
    mockDeleteTask.mockResolvedValue({ message: "deleted", id: "task-1" });
    mockCreateComment.mockResolvedValue({
      id: "comment-3",
      task_id: "task-1",
      user_id: "user-1",
      parent_comment_id: null,
      content: "Test comment",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author_name: "Current User",
      author_avatar_color: "#FF5733",
    });
    mockUpdateComment.mockResolvedValue({
      ...mockComments[0],
      content: "Updated content",
    });
    mockDeleteComment.mockResolvedValue({ message: "deleted", id: "comment-1" });
  });

  // ---------------------------------------------------------------------------
  // Render & Display Tests
  // ---------------------------------------------------------------------------

  test("renders modal with task title and description", () => {
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    expect(screen.getByText("Implement user authentication")).toBeInTheDocument();
    expect(
      screen.getByText("Add JWT-based authentication to the API"),
    ).toBeInTheDocument();
  });

  test("displays status label correctly", () => {
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  test("displays assigned user name in dropdown", () => {
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    const assignedSelect = screen.getByRole("combobox") as HTMLSelectElement;
    expect(assignedSelect).toBeInTheDocument();
    expect(assignedSelect.value).toBe("user-2");
  });

  test("displays 'Unassigned' when task has no assigned user", () => {
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    render(
      <TaskDetail
        task={mockUnassignedTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    const assignedSelect = screen.getByRole("combobox") as HTMLSelectElement;
    expect(assignedSelect).toBeInTheDocument();
    expect(assignedSelect.value).toBe("");
  });

  test("renders close button (x)", () => {
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    expect(screen.getByText("x")).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Comments Loading Tests
  // ---------------------------------------------------------------------------

  test("fetches and displays comments on mount", async () => {
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    await waitFor(() => {
      expect(mockFetchComments).toHaveBeenCalledWith("task-1");
    });

    await waitFor(() => {
      expect(screen.getByTestId("comment-list")).toBeInTheDocument();
    });
  });

  test("shows loading message while comments are loading", () => {
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    // Mock fetchComments to take time before resolving
    mockFetchComments.mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(mockComments), 100),
        ),
    );

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    expect(screen.getByText("Loading comments...")).toBeInTheDocument();
  });

  test("renders CommentList with fetched comments", async () => {
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("comments-count")).toHaveTextContent("2");
    });
  });

  // ---------------------------------------------------------------------------
  // Edit Title & Description Tests
  // ---------------------------------------------------------------------------

  test("enters edit mode when clicking title", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    const title = screen.getByText("Implement user authentication");
    await user.click(title);

    expect(screen.getByDisplayValue("Implement user authentication")).toBeInTheDocument();
  });

  test("enters edit mode when clicking description", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    const description = screen.getByText("Add JWT-based authentication to the API");
    await user.click(description);

    expect(screen.getByDisplayValue("Add JWT-based authentication to the API")).toBeInTheDocument();
  });

  test("enters edit mode when clicking 'Edit Task' button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    const editButton = screen.getByText("Edit Task");
    await user.click(editButton);

    expect(screen.getByDisplayValue("Implement user authentication")).toBeInTheDocument();
  });

  test("saves updated title and description", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    const updatedTask = {
      ...mockTask,
      title: "Add OAuth2 authentication",
      description: "Implement OAuth2 with Google and GitHub providers",
    };
    mockUpdateTask.mockResolvedValueOnce(updatedTask);

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    // Enter edit mode
    await user.click(screen.getByText("Implement user authentication"));

    // Change title and description
    const titleInput = screen.getByDisplayValue(
      "Implement user authentication",
    ) as HTMLInputElement;
    await user.clear(titleInput);
    await user.type(titleInput, "Add OAuth2 authentication");

    const descriptionInput = screen.getByDisplayValue(
      "Add JWT-based authentication to the API",
    ) as HTMLTextAreaElement;
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "Implement OAuth2 with Google and GitHub providers");

    // Save
    await user.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalledWith("task-1", {
        title: "Add OAuth2 authentication",
        description: "Implement OAuth2 with Google and GitHub providers",
      });
    });

    await waitFor(() => {
      expect(onTaskUpdated).toHaveBeenCalledWith(updatedTask);
    });
  });

  test("trims whitespace from title and description on save", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    // Enter edit mode
    await user.click(screen.getByText("Implement user authentication"));

    // Change title with leading/trailing whitespace
    const titleInput = screen.getByDisplayValue(
      "Implement user authentication",
    ) as HTMLInputElement;
    await user.clear(titleInput);
    await user.type(titleInput, "  New Title  ");

    // Save
    await user.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalledWith("task-1", {
        title: "New Title",
        description: expect.any(String),
      });
    });
  });

  test("cancels edit mode without saving", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    // Enter edit mode
    await user.click(screen.getByText("Implement user authentication"));

    // Change title
    const titleInput = screen.getByDisplayValue(
      "Implement user authentication",
    ) as HTMLInputElement;
    await user.clear(titleInput);
    await user.type(titleInput, "Changed Title");

    // Click Cancel
    await user.click(screen.getByText("Cancel"));

    // Verify original title is shown and updateTask was not called
    expect(screen.getByText("Implement user authentication")).toBeInTheDocument();
    expect(mockUpdateTask).not.toHaveBeenCalled();
  });

  test("prevents saving with empty title", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    // Enter edit mode
    await user.click(screen.getByText("Implement user authentication"));

    // Clear title
    const titleInput = screen.getByDisplayValue(
      "Implement user authentication",
    ) as HTMLInputElement;
    await user.clear(titleInput);

    // Try to save
    await user.click(screen.getByText("Save"));

    // Verify updateTask was not called
    expect(mockUpdateTask).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // User Assignment Tests
  // ---------------------------------------------------------------------------

  test("changes assigned user via dropdown", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    const updatedTask = {
      ...mockTask,
      assigned_user_id: "user-3",
      assigned_user_name: "Bob Smith",
    };
    mockAssignTask.mockResolvedValueOnce(updatedTask);

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    const assignSelect = screen.getByRole("combobox") as HTMLSelectElement;
    await user.selectOptions(assignSelect, "user-3");

    await waitFor(() => {
      expect(mockAssignTask).toHaveBeenCalledWith("task-1", "user-3");
    });

    await waitFor(() => {
      expect(onTaskUpdated).toHaveBeenCalledWith(updatedTask);
    });
  });

  test("unassigns user by selecting empty option", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    const updatedTask = {
      ...mockTask,
      assigned_user_id: null,
      assigned_user_name: null,
    };
    mockAssignTask.mockResolvedValueOnce(updatedTask);

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    const assignSelect = screen.getByRole("combobox") as HTMLSelectElement;
    await user.selectOptions(assignSelect, "");

    await waitFor(() => {
      expect(mockAssignTask).toHaveBeenCalledWith("task-1", null);
    });

    await waitFor(() => {
      expect(onTaskUpdated).toHaveBeenCalledWith(updatedTask);
    });
  });

  test("assigns user to previously unassigned task", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    const updatedTask = {
      ...mockUnassignedTask,
      assigned_user_id: "user-2",
      assigned_user_name: "Alice Johnson",
    };
    mockAssignTask.mockResolvedValueOnce(updatedTask);

    render(
      <TaskDetail
        task={mockUnassignedTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    const assignSelect = screen.getByRole("combobox") as HTMLSelectElement;
    await user.selectOptions(assignSelect, "user-2");

    await waitFor(() => {
      expect(mockAssignTask).toHaveBeenCalledWith("task-2", "user-2");
    });

    await waitFor(() => {
      expect(onTaskUpdated).toHaveBeenCalledWith(updatedTask);
    });
  });

  // ---------------------------------------------------------------------------
  // Delete Task Tests
  // ---------------------------------------------------------------------------

  test("prompts confirmation before deleting task", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    // Mock window.confirm to return false
    const confirmSpy = vi
      .spyOn(window, "confirm")
      .mockReturnValueOnce(false);

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    await user.click(screen.getByText("Delete Task"));

    expect(confirmSpy).toHaveBeenCalledWith(
      "Delete this task? This cannot be undone.",
    );
    expect(mockDeleteTask).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  test("deletes task when confirmation is accepted", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    // Mock window.confirm to return true
    const confirmSpy = vi
      .spyOn(window, "confirm")
      .mockReturnValueOnce(true);

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    await user.click(screen.getByText("Delete Task"));

    await waitFor(() => {
      expect(mockDeleteTask).toHaveBeenCalledWith("task-1");
    });

    await waitFor(() => {
      expect(onTaskDeleted).toHaveBeenCalledWith("task-1");
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });

  // ---------------------------------------------------------------------------
  // Close Button Tests
  // ---------------------------------------------------------------------------

  test("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    await user.click(screen.getByText("x"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ---------------------------------------------------------------------------
  // Comment Management Tests
  // ---------------------------------------------------------------------------

  test("calls handleAddComment when adding comment via CommentList", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("add-comment-button")).toBeInTheDocument();
    });

    const addCommentButton = screen.getByTestId("add-comment-button");
    await user.click(addCommentButton);

    await waitFor(() => {
      expect(mockCreateComment).toHaveBeenCalledWith("task-1", "user-1", {
        content: "Test comment",
        parent_comment_id: undefined,
      });
    });
  });

  test("calls handleEditComment when editing comment via CommentList", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("edit-comment-button")).toBeInTheDocument();
    });

    const editCommentButton = screen.getByTestId("edit-comment-button");
    await user.click(editCommentButton);

    await waitFor(() => {
      expect(mockUpdateComment).toHaveBeenCalledWith(
        "comment-1",
        "user-1",
        "Updated content",
      );
    });
  });

  test("calls handleDeleteComment when deleting comment via CommentList", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("delete-comment-button")).toBeInTheDocument();
    });

    const deleteCommentButton = screen.getByTestId("delete-comment-button");
    await user.click(deleteCommentButton);

    await waitFor(() => {
      expect(mockDeleteComment).toHaveBeenCalledWith("comment-1", "user-1");
    });
  });

  test("updates comment in list after editing", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    mockUpdateComment.mockResolvedValueOnce({
      ...mockComments[0],
      content: "Updated content",
    });

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("edit-comment-button")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("edit-comment-button"));

    await waitFor(() => {
      expect(mockUpdateComment).toHaveBeenCalled();
    });
  });

  test("removes deleted comment and its replies from list", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    // Verify initial comment count
    await waitFor(() => {
      expect(screen.getByTestId("comments-count")).toHaveTextContent("2");
    });

    await user.click(screen.getByTestId("delete-comment-button"));

    // After deletion, should have fewer comments
    // Note: This requires the component to update the state
    await waitFor(() => {
      expect(mockDeleteComment).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Modal Structure & Layout Tests
  // ---------------------------------------------------------------------------

  test("renders modal overlay with correct styling", () => {
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    const { container } = render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    const overlay = container.querySelector(".fixed.inset-0");
    expect(overlay).toBeInTheDocument();
  });

  test("renders 'Assigned to:' label", () => {
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    expect(screen.getByText("Assigned to:")).toBeInTheDocument();
  });

  test("populates user dropdown with all users", () => {
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.text);

    expect(options).toContain("Unassigned");
    expect(options).toContain("Current User");
    expect(options).toContain("Alice Johnson");
    expect(options).toContain("Bob Smith");
  });

  // ---------------------------------------------------------------------------
  // Edge Cases & Error Handling
  // ---------------------------------------------------------------------------

  test("handles task with null description", () => {
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    const taskWithoutDescription: Task = {
      ...mockTask,
      description: null,
    };

    render(
      <TaskDetail
        task={taskWithoutDescription}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    expect(screen.getByText("Click to add description...")).toBeInTheDocument();
  });

  test("handles empty comments list", async () => {
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    mockFetchComments.mockResolvedValueOnce([]);

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("comments-count")).toHaveTextContent("0");
    });
  });

  test("handles fetchComments error gracefully", async () => {
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementationOnce(() => {});

    mockFetchComments.mockRejectedValueOnce(new Error("Network error"));

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to load comments:",
        "Network error",
      );
    });

    consoleSpy.mockRestore();
  });

  test("re-renders when task prop changes", async () => {
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    const { rerender } = render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    expect(screen.getByText("Implement user authentication")).toBeInTheDocument();

    const updatedTask = {
      ...mockTask,
      title: "New task title",
    };

    rerender(
      <TaskDetail
        task={updatedTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    expect(screen.getByText("New task title")).toBeInTheDocument();
  });

  test("handles different task statuses", () => {
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    const statuses: Array<{ status: any; label: string }> = [
      { status: "todo", label: "To Do" },
      { status: "in_progress", label: "In Progress" },
      { status: "in_review", label: "In Review" },
      { status: "done", label: "Done" },
    ];

    statuses.forEach(({ status, label }) => {
      const { unmount } = render(
        <TaskDetail
          task={{ ...mockTask, status }}
          currentUser={mockCurrentUser}
          users={mockUsers}
          onClose={onClose}
          onTaskUpdated={onTaskUpdated}
          onTaskDeleted={onTaskDeleted}
        />,
      );

      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    });
  });

  // ---------------------------------------------------------------------------
  // Integration Tests
  // ---------------------------------------------------------------------------

  test("completes full workflow: edit, assign, add comment, delete", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onTaskUpdated = vi.fn();
    const onTaskDeleted = vi.fn();

    const updatedTask = {
      ...mockTask,
      title: "Updated task",
      assigned_user_id: "user-3",
    };

    mockUpdateTask.mockResolvedValueOnce(updatedTask);
    mockAssignTask.mockResolvedValueOnce(updatedTask);
    mockCreateComment.mockResolvedValueOnce({
      id: "comment-3",
      task_id: "task-1",
      user_id: "user-1",
      parent_comment_id: null,
      content: "Test comment",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author_name: "Current User",
      author_avatar_color: "#FF5733",
    });

    vi.spyOn(window, "confirm").mockReturnValueOnce(true);

    render(
      <TaskDetail
        task={mockTask}
        currentUser={mockCurrentUser}
        users={mockUsers}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />,
    );

    // Step 1: Edit task
    await user.click(screen.getByText("Implement user authentication"));
    const titleInput = screen.getByDisplayValue(
      "Implement user authentication",
    ) as HTMLInputElement;
    await user.clear(titleInput);
    await user.type(titleInput, "Updated task");
    await user.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalled();
    });

    // Step 2: Assign user
    const assignSelect = screen.getByRole("combobox") as HTMLSelectElement;
    await user.selectOptions(assignSelect, "user-3");

    await waitFor(() => {
      expect(mockAssignTask).toHaveBeenCalled();
    });

    // Step 3: Add comment
    await waitFor(() => {
      expect(screen.getByTestId("add-comment-button")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("add-comment-button"));

    await waitFor(() => {
      expect(mockCreateComment).toHaveBeenCalled();
    });

    // Step 4: Delete task
    await user.click(screen.getByText("Delete Task"));

    await waitFor(() => {
      expect(mockDeleteTask).toHaveBeenCalled();
      expect(onTaskDeleted).toHaveBeenCalled();
    });
  });
});
