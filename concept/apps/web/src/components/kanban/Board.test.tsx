import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "../../test/test-utils";
import Board from "./Board";
import { mockProjects, mockTasks, mockUsers } from "../../test/mock-api";
import { createTask, fetchTasks, fetchUsers, updateTaskStatus } from "../../api/client";
import type { Task } from "../../api/types";

vi.mock("@hello-pangea/dnd", () => ({
  DragDropContext: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../../api/client", () => ({
  fetchTasks: vi.fn(),
  fetchUsers: vi.fn(),
  createTask: vi.fn(),
  updateTaskStatus: vi.fn(),
}));

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
    <section>
      <h3>{status}</h3>
      {tasks.map((task) => (
        <button key={task.id} onClick={() => onCardClick(task)}>
          Open {task.title}
        </button>
      ))}
    </section>
  ),
}));

vi.mock("./TaskDetail", () => ({
  default: ({ task }: { task: Task }) => <div>Task detail for {task.title}</div>,
}));

const mockedFetchTasks = vi.mocked(fetchTasks);
const mockedFetchUsers = vi.mocked(fetchUsers);
const mockedCreateTask = vi.mocked(createTask);

function createDeferredPromise<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe("Board", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedFetchTasks.mockResolvedValue(mockTasks);
    mockedFetchUsers.mockResolvedValue(mockUsers);
    mockedCreateTask.mockResolvedValue({
      ...mockTasks[0]!,
      id: "3",
      title: "New Task",
      position: 1,
    });
    vi.mocked(updateTaskStatus).mockResolvedValue(mockTasks[0]!);
  });

  it("shows the loading state while board data is loading", () => {
    const deferredTasks = createDeferredPromise<Task[]>();
    mockedFetchTasks.mockReturnValueOnce(deferredTasks.promise);

    render(
      <Board project={mockProjects[0]!} currentUser={mockUsers[0]!} onBack={() => {}} />
    );

    expect(screen.getByText("Loading board...")).toBeInTheDocument();
  });

  it("shows an error and retries loading successfully", async () => {
    mockedFetchTasks.mockRejectedValueOnce(new Error("Unable to load board"));
    mockedFetchTasks.mockResolvedValueOnce(mockTasks);

    const { user } = render(
      <Board project={mockProjects[0]!} currentUser={mockUsers[0]!} onBack={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByText("Unable to load board")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(screen.getByText(mockProjects[0]!.name)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: `Open ${mockTasks[0]!.title}` })).toBeInTheDocument();
    expect(mockedFetchTasks).toHaveBeenCalledTimes(2);
  });

  it("loads board data and calls onBack from the projects button", async () => {
    const onBack = vi.fn();
    const { user } = render(
      <Board project={mockProjects[0]!} currentUser={mockUsers[0]!} onBack={onBack} />
    );

    await waitFor(() => {
      expect(screen.getByText(mockProjects[0]!.name)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: `Open ${mockTasks[0]!.title}` })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Projects/ }));

    expect(onBack).toHaveBeenCalledOnce();
  });

  it("toggles the new task form open and closed", async () => {
    const { user } = render(
      <Board project={mockProjects[0]!} currentUser={mockUsers[0]!} onBack={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByText(mockProjects[0]!.name)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "New Task" }));
    expect(screen.getByPlaceholderText("Task title...")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByPlaceholderText("Task title...")).not.toBeInTheDocument();
  });

  it("creates a task and closes the new task form after success", async () => {
    const createdTask: Task = {
      ...mockTasks[0]!,
      id: "3",
      title: "Write release notes",
      position: 1,
    };
    mockedCreateTask.mockResolvedValueOnce(createdTask);

    const { user } = render(
      <Board project={mockProjects[0]!} currentUser={mockUsers[0]!} onBack={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByText(mockProjects[0]!.name)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "New Task" }));
    await user.type(screen.getByPlaceholderText("Task title..."), "  Write release notes  ");
    await user.click(screen.getByRole("button", { name: "Add Task" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Open Write release notes" })
      ).toBeInTheDocument();
    });
    expect(mockedCreateTask).toHaveBeenCalledWith(mockProjects[0]!.id, {
      title: "Write release notes",
    });
    expect(screen.queryByPlaceholderText("Task title...")).not.toBeInTheDocument();
  });

  it("opens task detail when a task is selected", async () => {
    const { user } = render(
      <Board project={mockProjects[0]!} currentUser={mockUsers[0]!} onBack={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: `Open ${mockTasks[0]!.title}` })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: `Open ${mockTasks[0]!.title}` }));

    expect(screen.getByText(`Task detail for ${mockTasks[0]!.title}`)).toBeInTheDocument();
  });
});
