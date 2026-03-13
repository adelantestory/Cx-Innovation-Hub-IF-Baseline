import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "./test/test-utils";
import type { Project, User } from "./api/types";
import App from "./App";

const { mockUser, mockProject } = vi.hoisted(() => ({
  mockUser: {
    id: "1",
    name: "Alice Johnson",
    role: "Developer",
    avatar_color: "#4F46E5",
    created_at: "2024-01-01T00:00:00Z",
  } satisfies User,
  mockProject: {
    id: "project-1",
    name: "Alpha Project",
    description: "A focused project",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    task_count: 2,
    done_count: 1,
  } satisfies Project,
}));

vi.mock("./components/layout/Header", () => ({
  default: ({
    user,
    onSwitchUser,
    onNavigateHome,
  }: {
    user: User;
    onSwitchUser: () => void;
    onNavigateHome: () => void;
  }) => (
    <div>
      <p>Header for {user.name}</p>
      <button onClick={onNavigateHome}>Mock Home</button>
      <button onClick={onSwitchUser}>Mock Switch User</button>
    </div>
  ),
}));

vi.mock("./components/users/UserSelect", () => ({
  default: ({ onSelectUser }: { onSelectUser: (user: User) => void }) => (
    <div>
      <p>Mock User Select</p>
      <button onClick={() => onSelectUser(mockUser)}>Select Alice</button>
    </div>
  ),
}));

vi.mock("./components/projects/ProjectList", () => ({
  default: ({
    onSelectProject,
  }: {
    onSelectProject: (project: Project) => void;
  }) => (
    <div>
      <p>Mock Project List</p>
      <button onClick={() => onSelectProject(mockProject)}>Select Project</button>
    </div>
  ),
}));

vi.mock("./components/kanban/Board", () => ({
  default: ({
    project,
    currentUser,
    onBack,
  }: {
    project: Project;
    currentUser: User;
    onBack: () => void;
  }) => (
    <div>
      <p>Board for {project.name}</p>
      <p>Current user is {currentUser.name}</p>
      <button onClick={onBack}>Mock Back</button>
    </div>
  ),
}));

describe("App", () => {
  it("renders the user selection view initially", () => {
    render(<App />);

    expect(screen.getByText("Mock User Select")).toBeInTheDocument();
    expect(screen.queryByText(/Header for/)).not.toBeInTheDocument();
    expect(screen.queryByText("Mock Project List")).not.toBeInTheDocument();
  });

  it("moves from user selection to the project list after selecting a user", async () => {
    const { user } = render(<App />);

    await user.click(screen.getByRole("button", { name: "Select Alice" }));

    expect(screen.getByText(`Header for ${mockUser.name}`)).toBeInTheDocument();
    expect(screen.getByText("Mock Project List")).toBeInTheDocument();
    expect(screen.queryByText("Mock User Select")).not.toBeInTheDocument();
  });

  it("moves from project list to board after selecting a project", async () => {
    const { user } = render(<App />);

    await user.click(screen.getByRole("button", { name: "Select Alice" }));
    await user.click(screen.getByRole("button", { name: "Select Project" }));

    expect(screen.getByText(`Board for ${mockProject.name}`)).toBeInTheDocument();
    expect(screen.getByText(`Current user is ${mockUser.name}`)).toBeInTheDocument();
    expect(screen.queryByText("Mock Project List")).not.toBeInTheDocument();
  });

  it("returns from the board to projects and can switch back to user selection", async () => {
    const { user } = render(<App />);

    await user.click(screen.getByRole("button", { name: "Select Alice" }));
    await user.click(screen.getByRole("button", { name: "Select Project" }));
    await user.click(screen.getByRole("button", { name: "Mock Back" }));

    await waitFor(() => {
      expect(screen.getByText("Mock Project List")).toBeInTheDocument();
    });
    expect(screen.queryByText(`Board for ${mockProject.name}`)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mock Switch User" }));

    expect(screen.getByText("Mock User Select")).toBeInTheDocument();
    expect(screen.queryByText(/Header for/)).not.toBeInTheDocument();
  });
});
