import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import ProjectList from "./ProjectList";
import { mockProjects } from "../../test/mock-api";
import { fetchProjects, createProject } from "../../api/client";

vi.mock("../../api/client", () => ({
  fetchProjects: vi.fn(),
  createProject: vi.fn(),
}));

const mockedFetchProjects = vi.mocked(fetchProjects);
const mockedCreateProject = vi.mocked(createProject);

describe("ProjectList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedFetchProjects.mockResolvedValue(mockProjects);
    mockedCreateProject.mockResolvedValue(mockProjects[0]!);
  });

  it("shows loading state initially", () => {
    render(<ProjectList onSelectProject={() => {}} />);

    expect(screen.getByText("Loading projects...")).toBeInTheDocument();
  });

  it("renders project cards with name, task count, done count", async () => {
    render(<ProjectList onSelectProject={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Test Project")).toBeInTheDocument();
    });
    expect(screen.getByText("3 tasks")).toBeInTheDocument();
    expect(screen.getByText("1 done")).toBeInTheDocument();
  });

  it("calls onSelectProject when a project card is clicked", async () => {
    const onSelectProject = vi.fn();
    const { user } = render(<ProjectList onSelectProject={onSelectProject} />);

    await waitFor(() => {
      expect(screen.getByText("Test Project")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Test Project"));
    expect(onSelectProject).toHaveBeenCalledWith(mockProjects[0]);
  });

  it("shows New Project button", async () => {
    render(<ProjectList onSelectProject={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Test Project")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "New Project" })).toBeInTheDocument();
  });

  it("shows create form when New Project is clicked", async () => {
    const { user } = render(<ProjectList onSelectProject={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Test Project")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "New Project" }));

    expect(screen.getByPlaceholderText("Project name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Description (optional)")).toBeInTheDocument();
  });

  it("shows empty state message when no projects exist", async () => {
    mockedFetchProjects.mockResolvedValue([]);

    render(<ProjectList onSelectProject={() => {}} />);

    await waitFor(() => {
      expect(
        screen.getByText("No projects yet. Create one to get started.")
      ).toBeInTheDocument();
    });
  });
});
