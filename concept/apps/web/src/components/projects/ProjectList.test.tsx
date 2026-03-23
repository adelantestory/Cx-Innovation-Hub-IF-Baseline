import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import type { Project } from "../../api/types";
import ProjectList from "./ProjectList";

// Mock the API client BEFORE importing the component
vi.mock("../../api/client");

import { fetchProjects as mockFetchProjects, createProject as mockCreateProject } from "../../api/client";

// Test data
const mockProjects: Project[] = [
  {
    id: "p1",
    name: "Project Alpha",
    description: "First project for testing",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    task_count: 5,
    done_count: 2,
  },
  {
    id: "p2",
    name: "Project Beta",
    description: "Second project with more tasks",
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
    task_count: 10,
    done_count: 7,
  },
  {
    id: "p3",
    name: "Project Gamma",
    description: null,
    created_at: "2024-01-03T00:00:00Z",
    updated_at: "2024-01-03T00:00:00Z",
    task_count: 0,
    done_count: 0,
  },
];

describe("ProjectList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockFetchProjects).mockResolvedValue([]);
  });

  describe("Loading State", () => {
    test("renders loading state while fetching projects", () => {
      vi.mocked(mockFetchProjects).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockProjects), 100)
          )
      );

      render(<ProjectList onSelectProject={vi.fn()} />);

      expect(screen.getByText("Loading projects...")).toBeInTheDocument();
    });

    test("calls fetchProjects on mount", async () => {
      vi.mocked(mockFetchProjects).mockResolvedValue(mockProjects);

      render(<ProjectList onSelectProject={vi.fn()} />);

      await waitFor(() => {
        expect(vi.mocked(mockFetchProjects)).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Successful Project Fetch", () => {
    beforeEach(() => {
      vi.mocked(mockFetchProjects).mockResolvedValue(mockProjects);
    });

    test("renders project cards after fetch completes", async () => {
      render(<ProjectList onSelectProject={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText("Project Alpha")).toBeInTheDocument();
        expect(screen.getByText("Project Beta")).toBeInTheDocument();
        expect(screen.getByText("Project Gamma")).toBeInTheDocument();
      });

      expect(screen.queryByText("Loading projects...")).not.toBeInTheDocument();
    });

    test("renders project descriptions when available", async () => {
      render(<ProjectList onSelectProject={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText("First project for testing")).toBeInTheDocument();
        expect(
          screen.getByText("Second project with more tasks")
        ).toBeInTheDocument();
      });
    });

    test("does not render description when null", async () => {
      render(<ProjectList onSelectProject={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText("Project Gamma")).toBeInTheDocument();
      });

      // Project Gamma has no description, so it should not have a description element
      const gammaCard = screen.getByRole("button", { name: /Project Gamma/i });
      expect(gammaCard.textContent).not.toContain("null");
    });

    test("renders task count for each project card", async () => {
      render(<ProjectList onSelectProject={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText("5 tasks")).toBeInTheDocument();
        expect(screen.getByText("10 tasks")).toBeInTheDocument();
        expect(screen.getByText("0 tasks")).toBeInTheDocument();
      });
    });

    test("renders done count for each project card", async () => {
      render(<ProjectList onSelectProject={vi.fn()} />);

      await waitFor(() => {
        const doneTexts = screen.getAllByText(/done/);
        expect(doneTexts.length).toBeGreaterThan(0);
        expect(screen.getByText("2 done")).toBeInTheDocument();
        expect(screen.getByText("7 done")).toBeInTheDocument();
        expect(screen.getByText("0 done")).toBeInTheDocument();
      });
    });

    test("renders project title in heading", async () => {
      render(<ProjectList onSelectProject={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Projects" })).toBeInTheDocument();
      });
    });

    test("renders New Project button", async () => {
      render(<ProjectList onSelectProject={vi.fn()} />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /New Project/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe("Project Card Interaction", () => {
    beforeEach(() => {
      vi.mocked(mockFetchProjects).mockResolvedValue(mockProjects);
    });

    test("calls onSelectProject when project card is clicked", async () => {
      const mockOnSelectProject = vi.fn();
      const user = userEvent.setup();

      render(<ProjectList onSelectProject={mockOnSelectProject} />);

      const projectButton = await waitFor(() =>
        screen.getByRole("button", { name: /Project Alpha/i })
      );

      await user.click(projectButton);

      expect(mockOnSelectProject).toHaveBeenCalledTimes(1);
      expect(mockOnSelectProject).toHaveBeenCalledWith(mockProjects[0]);
    });

    test("passes correct project to onSelectProject callback", async () => {
      const mockOnSelectProject = vi.fn();
      const user = userEvent.setup();

      render(<ProjectList onSelectProject={mockOnSelectProject} />);

      const betaButton = await waitFor(() =>
        screen.getByRole("button", { name: /Project Beta/i })
      );

      await user.click(betaButton);

      expect(mockOnSelectProject).toHaveBeenCalledWith(mockProjects[1]);
    });

    test("calls onSelectProject for each project card clicked", async () => {
      const mockOnSelectProject = vi.fn();
      const user = userEvent.setup();

      render(<ProjectList onSelectProject={mockOnSelectProject} />);

      const alphaButton = await waitFor(() =>
        screen.getByRole("button", { name: /Project Alpha/i })
      );
      await user.click(alphaButton);

      const betaButton = screen.getByRole("button", { name: /Project Beta/i });
      await user.click(betaButton);

      expect(mockOnSelectProject).toHaveBeenCalledTimes(2);
      expect(mockOnSelectProject).toHaveBeenNthCalledWith(1, mockProjects[0]);
      expect(mockOnSelectProject).toHaveBeenNthCalledWith(2, mockProjects[1]);
    });
  });

  describe("Create Project Form", () => {
    beforeEach(() => {
      vi.mocked(mockFetchProjects).mockResolvedValue(mockProjects);
    });

    test("shows form when New Project button is clicked", async () => {
      const user = userEvent.setup();
      render(<ProjectList onSelectProject={vi.fn()} />);

      const newProjectButton = await waitFor(() =>
        screen.getByRole("button", { name: /New Project/i })
      );

      await user.click(newProjectButton);

      const titleInput = screen.getByPlaceholderText("Project name");
      expect(titleInput).toBeInTheDocument();

      const descInput = screen.getByPlaceholderText("Description (optional)");
      expect(descInput).toBeInTheDocument();

      const createButton = screen.getByRole("button", { name: /Create Project/i });
      expect(createButton).toBeInTheDocument();
    });

    test("hides form when Cancel button is clicked", async () => {
      const user = userEvent.setup();
      render(<ProjectList onSelectProject={vi.fn()} />);

      const newProjectButton = await waitFor(() =>
        screen.getByRole("button", { name: /New Project/i })
      );

      await user.click(newProjectButton);

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      await user.click(cancelButton);

      expect(
        screen.queryByPlaceholderText("Project name")
      ).not.toBeInTheDocument();
    });

    test("submits form with trimmed title and description", async () => {
      const user = userEvent.setup();
      const newProject: Project = {
        id: "p4",
        name: "New Project",
        description: "New description",
        created_at: "2024-01-04T00:00:00Z",
        updated_at: "2024-01-04T00:00:00Z",
        task_count: 0,
        done_count: 0,
      };

      vi.mocked(mockCreateProject).mockResolvedValue(newProject);

      render(<ProjectList onSelectProject={vi.fn()} />);

      const newProjectButton = await waitFor(() =>
        screen.getByRole("button", { name: /New Project/i })
      );

      await user.click(newProjectButton);

      const titleInput = screen.getByPlaceholderText("Project name");
      await user.type(titleInput, "  New Project  ");

      const descInput = screen.getByPlaceholderText("Description (optional)");
      await user.type(descInput, "  New description  ");

      const createButton = screen.getByRole("button", { name: /Create Project/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(vi.mocked(mockCreateProject)).toHaveBeenCalledWith({
          name: "New Project",
          description: "New description",
        });
      });
    });

    test("submits form with undefined description when empty", async () => {
      const user = userEvent.setup();
      const newProject: Project = {
        id: "p4",
        name: "New Project",
        description: null,
        created_at: "2024-01-04T00:00:00Z",
        updated_at: "2024-01-04T00:00:00Z",
        task_count: 0,
        done_count: 0,
      };

      vi.mocked(mockCreateProject).mockResolvedValue(newProject);

      render(<ProjectList onSelectProject={vi.fn()} />);

      const newProjectButton = await waitFor(() =>
        screen.getByRole("button", { name: /New Project/i })
      );

      await user.click(newProjectButton);

      const titleInput = screen.getByPlaceholderText("Project name");
      await user.type(titleInput, "New Project");

      const createButton = screen.getByRole("button", { name: /Create Project/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(vi.mocked(mockCreateProject)).toHaveBeenCalledWith({
          name: "New Project",
          description: undefined,
        });
      });
    });

    test("clears form inputs after successful creation", async () => {
      const user = userEvent.setup();
      const newProject: Project = {
        id: "p4",
        name: "New Project",
        description: "Test description",
        created_at: "2024-01-04T00:00:00Z",
        updated_at: "2024-01-04T00:00:00Z",
        task_count: 0,
        done_count: 0,
      };

      vi.mocked(mockCreateProject).mockResolvedValue(newProject);

      render(<ProjectList onSelectProject={vi.fn()} />);

      const newProjectButton = await waitFor(() =>
        screen.getByRole("button", { name: /New Project/i })
      );

      await user.click(newProjectButton);

      const titleInput = screen.getByPlaceholderText("Project name") as HTMLInputElement;
      const descInput = screen.getByPlaceholderText("Description (optional)") as HTMLTextAreaElement;

      await user.type(titleInput, "New Project");
      await user.type(descInput, "Test description");

      // Verify inputs have values before submission
      expect(titleInput.value).toBe("New Project");
      expect(descInput.value).toBe("Test description");

      const createButton = screen.getByRole("button", { name: /Create Project/i });
      await user.click(createButton);

      // Wait for form to be hidden (which means it was cleared and hidden after success)
      await waitFor(() => {
        expect(screen.queryByPlaceholderText("Project name")).not.toBeInTheDocument();
      });
    });

    test("hides form after successful creation", async () => {
      const user = userEvent.setup();
      const newProject: Project = {
        id: "p4",
        name: "New Project",
        description: null,
        created_at: "2024-01-04T00:00:00Z",
        updated_at: "2024-01-04T00:00:00Z",
        task_count: 0,
        done_count: 0,
      };

      vi.mocked(mockCreateProject).mockResolvedValue(newProject);

      render(<ProjectList onSelectProject={vi.fn()} />);

      const newProjectButton = await waitFor(() =>
        screen.getByRole("button", { name: /New Project/i })
      );

      await user.click(newProjectButton);

      const titleInput = screen.getByPlaceholderText("Project name");
      await user.type(titleInput, "New Project");

      const createButton = screen.getByRole("button", { name: /Create Project/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText("Project name")).not.toBeInTheDocument();
      });
    });

    test("disables create button when title is empty", async () => {
      const user = userEvent.setup();
      render(<ProjectList onSelectProject={vi.fn()} />);

      const newProjectButton = await waitFor(() =>
        screen.getByRole("button", { name: /New Project/i })
      );

      await user.click(newProjectButton);

      const createButton = screen.getByRole("button", {
        name: /Create Project/i,
      }) as HTMLButtonElement;

      expect(createButton.disabled).toBe(true);
    });

    test("enables create button when title has content", async () => {
      const user = userEvent.setup();
      render(<ProjectList onSelectProject={vi.fn()} />);

      const newProjectButton = await waitFor(() =>
        screen.getByRole("button", { name: /New Project/i })
      );

      await user.click(newProjectButton);

      const titleInput = screen.getByPlaceholderText("Project name");
      await user.type(titleInput, "New Project");

      const createButton = screen.getByRole("button", {
        name: /Create Project/i,
      }) as HTMLButtonElement;

      expect(createButton.disabled).toBe(false);
    });

    test("shows Creating... state while submitting", async () => {
      const user = userEvent.setup();
      const newProject: Project = {
        id: "p4",
        name: "New Project",
        description: null,
        created_at: "2024-01-04T00:00:00Z",
        updated_at: "2024-01-04T00:00:00Z",
        task_count: 0,
        done_count: 0,
      };

      vi.mocked(mockCreateProject).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(newProject), 100)
          )
      );

      render(<ProjectList onSelectProject={vi.fn()} />);

      const newProjectButton = await waitFor(() =>
        screen.getByRole("button", { name: /New Project/i })
      );

      await user.click(newProjectButton);

      const titleInput = screen.getByPlaceholderText("Project name");
      await user.type(titleInput, "New Project");

      const createButton = screen.getByRole("button", { name: /Create Project/i });
      await user.click(createButton);

      // Check for "Creating..." text while the request is in flight
      expect(screen.getByText("Creating...")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText("Creating...")).not.toBeInTheDocument();
      });
    });

    test("prepends newly created project to the list", async () => {
      const user = userEvent.setup();
      const newProject: Project = {
        id: "p4",
        name: "Brand New Project",
        description: null,
        created_at: "2024-01-04T00:00:00Z",
        updated_at: "2024-01-04T00:00:00Z",
        task_count: 0,
        done_count: 0,
      };

      vi.mocked(mockCreateProject).mockResolvedValue(newProject);

      render(<ProjectList onSelectProject={vi.fn()} />);

      const newProjectButton = await waitFor(() =>
        screen.getByRole("button", { name: /New Project/i })
      );

      await user.click(newProjectButton);

      const titleInput = screen.getByPlaceholderText("Project name");
      await user.type(titleInput, "Brand New Project");

      const createButton = screen.getByRole("button", { name: /Create Project/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Brand New Project/i })).toBeInTheDocument();
      });
    });

    test("does not submit form if title is only whitespace", async () => {
      const user = userEvent.setup();
      render(<ProjectList onSelectProject={vi.fn()} />);

      const newProjectButton = await waitFor(() =>
        screen.getByRole("button", { name: /New Project/i })
      );

      await user.click(newProjectButton);

      const titleInput = screen.getByPlaceholderText("Project name");
      await user.type(titleInput, "   ");

      const createButton = screen.getByRole("button", {
        name: /Create Project/i,
      }) as HTMLButtonElement;

      expect(createButton.disabled).toBe(true);
      expect(vi.mocked(mockCreateProject)).not.toHaveBeenCalled();
    });
  });

  describe("Error State", () => {
    test("displays error message when fetch fails", async () => {
      const errorMessage = "Failed to fetch projects";
      vi.mocked(mockFetchProjects).mockRejectedValue(new Error(errorMessage));

      render(<ProjectList onSelectProject={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    test("renders retry button when error occurs", async () => {
      vi.mocked(mockFetchProjects).mockRejectedValue(new Error("Fetch failed"));

      render(<ProjectList onSelectProject={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
      });
    });

    test("shows loading state after retry button is clicked", async () => {
      const user = userEvent.setup();
      
      // First render with error
      vi.mocked(mockFetchProjects).mockRejectedValue(new Error("Fetch failed"));
      
      render(<ProjectList onSelectProject={vi.fn()} />);

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
      });

      // Update mock for retry to succeed with delay
      vi.mocked(mockFetchProjects).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockProjects), 100)
          )
      );

      const retryButton = screen.getByRole("button", { name: /Retry/i });
      await user.click(retryButton);

      // Should show loading state while fetching
      expect(screen.getByText("Loading projects...")).toBeInTheDocument();

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText("Loading projects...")).not.toBeInTheDocument();
      });
    });

    test("displays error when project creation fails", async () => {
      const user = userEvent.setup();
      vi.mocked(mockFetchProjects).mockResolvedValue(mockProjects);
      const errorMessage = "Failed to create project";
      vi.mocked(mockCreateProject).mockRejectedValue(new Error(errorMessage));

      render(<ProjectList onSelectProject={vi.fn()} />);

      const newProjectButton = await waitFor(() =>
        screen.getByRole("button", { name: /New Project/i })
      );

      await user.click(newProjectButton);

      const titleInput = screen.getByPlaceholderText("Project name");
      await user.type(titleInput, "New Project");

      const createButton = screen.getByRole("button", { name: /Create Project/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe("Empty State", () => {
    beforeEach(() => {
      vi.mocked(mockFetchProjects).mockResolvedValue([]);
    });

    test("displays empty message when no projects exist", async () => {
      render(<ProjectList onSelectProject={vi.fn()} />);

      await waitFor(() => {
        expect(
          screen.getByText("No projects yet. Create one to get started.")
        ).toBeInTheDocument();
      });
    });

    test("renders New Project button in empty state", async () => {
      render(<ProjectList onSelectProject={vi.fn()} />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /New Project/i })
        ).toBeInTheDocument();
      });
    });

    test("still renders Projects heading in empty state", async () => {
      render(<ProjectList onSelectProject={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Projects" })).toBeInTheDocument();
      });
    });

    test("can create first project from empty state", async () => {
      const user = userEvent.setup();
      const newProject: Project = {
        id: "p1",
        name: "First Project",
        description: null,
        created_at: "2024-01-04T00:00:00Z",
        updated_at: "2024-01-04T00:00:00Z",
        task_count: 0,
        done_count: 0,
      };

      vi.mocked(mockCreateProject).mockResolvedValue(newProject);

      render(<ProjectList onSelectProject={vi.fn()} />);

      await waitFor(() => {
        expect(
          screen.getByText("No projects yet. Create one to get started.")
        ).toBeInTheDocument();
      });

      const newProjectButton = screen.getByRole("button", { name: /New Project/i });
      await user.click(newProjectButton);

      const titleInput = screen.getByPlaceholderText("Project name");
      await user.type(titleInput, "First Project");

      const createButton = screen.getByRole("button", { name: /Create Project/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText("First Project")).toBeInTheDocument();
        expect(
          screen.queryByText("No projects yet. Create one to get started.")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Projects Display", () => {
    beforeEach(() => {
      vi.mocked(mockFetchProjects).mockResolvedValue(mockProjects);
    });

    test("does not display empty message when projects exist", async () => {
      render(<ProjectList onSelectProject={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText("Project Alpha")).toBeInTheDocument();
      });

      expect(
        screen.queryByText("No projects yet. Create one to get started.")
      ).not.toBeInTheDocument();
    });

    test("renders all projects in correct order", async () => {
      render(<ProjectList onSelectProject={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText("Project Alpha")).toBeInTheDocument();
      });

      const projectButtons = screen.getAllByRole("button").filter((btn: HTMLElement) =>
        /Project (Alpha|Beta|Gamma)/.test(btn.textContent || "")
      );

      expect(projectButtons.length).toBe(3);
    });

    test("renders project cards as buttons", async () => {
      render(<ProjectList onSelectProject={vi.fn()} />);

      await waitFor(() => {
        const projectButton = screen.getByRole("button", {
          name: /Project Alpha/i,
        });
        expect(projectButton).toBeInTheDocument();
      });
    });
  });
});
