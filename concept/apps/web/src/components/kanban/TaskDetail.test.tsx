import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import TaskDetail from "./TaskDetail";
import { mockComments, mockTasks, mockUsers } from "../../test/mock-api";
import {
  assignTask,
  createComment,
  deleteComment,
  deleteTask,
  fetchComments,
  updateComment,
  updateTask,
} from "../../api/client";
import type { Comment, Task, User } from "../../api/types";

vi.mock("../../api/client", () => ({
  fetchComments: vi.fn(),
  createComment: vi.fn(),
  updateComment: vi.fn(),
  deleteComment: vi.fn(),
  updateTask: vi.fn(),
  assignTask: vi.fn(),
  deleteTask: vi.fn(),
}));

vi.mock("../comments/CommentList", () => ({
  default: ({
    comments,
    currentUserId,
    onAddComment,
    onEditComment,
    onDeleteComment,
  }: {
    comments: Comment[];
    currentUserId: string;
    onAddComment: (content: string, parentCommentId?: string) => Promise<void>;
    onEditComment: (id: string, content: string) => Promise<void>;
    onDeleteComment: (id: string) => Promise<void>;
  }) => (
    <div>
      <p>Comment count: {comments.length}</p>
      <p>Current user id: {currentUserId}</p>
      {comments.map((comment) => (
        <p key={comment.id}>{comment.content}</p>
      ))}
      <button onClick={() => void onAddComment("New discussion point")}>Trigger add comment</button>
      <button onClick={() => void onEditComment("1", "Edited top-level comment")}>
        Trigger edit comment
      </button>
      <button onClick={() => void onDeleteComment("1")}>Trigger delete comment</button>
    </div>
  ),
}));

const mockedFetchComments = vi.mocked(fetchComments);
const mockedUpdateTask = vi.mocked(updateTask);
const mockedAssignTask = vi.mocked(assignTask);
const mockedDeleteTask = vi.mocked(deleteTask);
const mockedCreateComment = vi.mocked(createComment);
const mockedUpdateComment = vi.mocked(updateComment);
const mockedDeleteComment = vi.mocked(deleteComment);

function createDeferredPromise<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function renderTaskDetail(overrides?: Partial<{
  task: Task;
  currentUser: User;
  users: User[];
  onClose: () => void;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
}>) {
  const props = {
    task: mockTasks[0]!,
    currentUser: mockUsers[0]!,
    users: mockUsers,
    onClose: vi.fn(),
    onTaskUpdated: vi.fn(),
    onTaskDeleted: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<TaskDetail {...props} />),
    props,
  };
}

describe("TaskDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedFetchComments.mockResolvedValue(mockComments);
    mockedUpdateTask.mockResolvedValue({
      ...mockTasks[0]!,
      title: "Updated task title",
      description: "Updated description",
    });
    mockedAssignTask.mockResolvedValue({
      ...mockTasks[0]!,
      assigned_user_id: mockUsers[1]!.id,
      assigned_user_name: mockUsers[1]!.name,
      assigned_user_avatar_color: mockUsers[1]!.avatar_color,
    });
    mockedDeleteTask.mockResolvedValue({ message: "Deleted", id: mockTasks[0]!.id });
    mockedCreateComment.mockResolvedValue({
      ...mockComments[0]!,
      id: "2",
      content: "New discussion point",
    });
    mockedUpdateComment.mockResolvedValue({
      ...mockComments[0]!,
      content: "Edited top-level comment",
    });
    mockedDeleteComment.mockResolvedValue({ message: "Deleted", id: "1" });
  });

  it("shows a loading indicator while comments are loading", () => {
    const deferredComments = createDeferredPromise<Comment[]>();
    mockedFetchComments.mockReturnValueOnce(deferredComments.promise);

    renderTaskDetail();

    expect(screen.getByText("Loading comments...")).toBeInTheDocument();
    expect(screen.queryByText(/Comment count:/)).not.toBeInTheDocument();
  });

  it("loads comments and passes them to the comment list", async () => {
    renderTaskDetail();

    await waitFor(() => {
      expect(screen.getByText("Comment count: 1")).toBeInTheDocument();
    });
    expect(screen.getByText("Test comment")).toBeInTheDocument();
    expect(mockedFetchComments).toHaveBeenCalledWith(mockTasks[0]!.id);
  });

  it("edits and saves task changes", async () => {
    const updatedTask: Task = {
      ...mockTasks[0]!,
      title: "Refined task title",
      description: "Refined description",
    };
    mockedUpdateTask.mockResolvedValueOnce(updatedTask);

    const { user, props } = renderTaskDetail();

    await waitFor(() => {
      expect(screen.getByText("Comment count: 1")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Edit Task" }));

    const titleInput = screen.getByDisplayValue(mockTasks[0]!.title);
    await user.clear(titleInput);
    await user.type(titleInput, "  Refined task title  ");

    const descriptionInput = screen.getByDisplayValue(mockTasks[0]!.description!);
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "  Refined description  ");

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockedUpdateTask).toHaveBeenCalledWith(mockTasks[0]!.id, {
        title: "Refined task title",
        description: "Refined description",
      });
    });
    expect(props.onTaskUpdated).toHaveBeenCalledWith(updatedTask);
  });

  it("assigns the task to another user", async () => {
    const assignedTask: Task = {
      ...mockTasks[0]!,
      assigned_user_id: mockUsers[1]!.id,
      assigned_user_name: mockUsers[1]!.name,
      assigned_user_avatar_color: mockUsers[1]!.avatar_color,
    };
    mockedAssignTask.mockResolvedValueOnce(assignedTask);

    const { user, props } = renderTaskDetail();

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByRole("combobox"), mockUsers[1]!.id);

    await waitFor(() => {
      expect(mockedAssignTask).toHaveBeenCalledWith(mockTasks[0]!.id, mockUsers[1]!.id);
    });
    expect(props.onTaskUpdated).toHaveBeenCalledWith(assignedTask);
  });

  it("deletes the task after confirmation", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { user, props } = renderTaskDetail();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Delete Task" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Delete Task" }));

    await waitFor(() => {
      expect(mockedDeleteTask).toHaveBeenCalledWith(mockTasks[0]!.id);
    });
    expect(props.onTaskDeleted).toHaveBeenCalledWith(mockTasks[0]!.id);
    expect(props.onClose).toHaveBeenCalledOnce();

    confirmSpy.mockRestore();
  });

  it("handles add, edit, and delete comment actions", async () => {
    const threadedComments: Comment[] = [
      mockComments[0]!,
      {
        ...mockComments[0]!,
        id: "reply-1",
        parent_comment_id: "1",
        content: "Nested reply",
      },
    ];
    mockedFetchComments.mockResolvedValueOnce(threadedComments);

    const { user } = renderTaskDetail();

    await waitFor(() => {
      expect(screen.getByText("Comment count: 2")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Trigger add comment" }));
    await waitFor(() => {
      expect(mockedCreateComment).toHaveBeenCalledWith(mockTasks[0]!.id, mockUsers[0]!.id, {
        content: "New discussion point",
        parent_comment_id: undefined,
      });
    });
    expect(screen.getByText("New discussion point")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Trigger edit comment" }));
    await waitFor(() => {
      expect(mockedUpdateComment).toHaveBeenCalledWith(
        "1",
        mockUsers[0]!.id,
        "Edited top-level comment"
      );
    });
    expect(screen.getByText("Edited top-level comment")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Trigger delete comment" }));
    await waitFor(() => {
      expect(mockedDeleteComment).toHaveBeenCalledWith("1", mockUsers[0]!.id);
    });
    expect(screen.queryByText("Edited top-level comment")).not.toBeInTheDocument();
    expect(screen.queryByText("Nested reply")).not.toBeInTheDocument();
    expect(screen.getByText("Comment count: 1")).toBeInTheDocument();
  });
});
