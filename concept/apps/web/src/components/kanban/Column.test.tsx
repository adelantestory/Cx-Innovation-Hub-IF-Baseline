// =============================================================================
// Column Component Tests
// =============================================================================
// Comprehensive unit tests for the Kanban Column component using Vitest and
// React Testing Library. Tests cover rendering, status labels, task count
// badges, card rendering, all status types, and edge cases.
// =============================================================================

import { render, screen } from "@/test/test-utils";
import { describe, test, expect, vi, beforeEach } from "vitest";
import Column from "./Column";
import type { Task, TaskStatus } from "../../api/types";

// Mock the Card component to isolate Column testing
vi.mock("./Card", () => ({
  default: ({ task, onClick }: { task: Task; onClick: (task: Task) => void }) => (
    <div data-testid={`card-${task.id}`} onClick={() => onClick(task)}>
      {task.title}
    </div>
  ),
}));

// Mock the Droppable component from @hello-pangea/dnd
vi.mock("@hello-pangea/dnd", () => ({
  Droppable: ({
    droppableId,
    children,
  }: {
    droppableId: string;
    children: (
      provided: {
        innerRef: React.RefObject<HTMLDivElement>;
        droppableProps: Record<string, unknown>;
        placeholder: null;
      },
      snapshot: { isDraggingOver: boolean }
    ) => React.ReactNode;
  }) => {
    const ref = React.createRef<HTMLDivElement>();
    return (
      <div data-testid={`droppable-${droppableId}`}>
        {children(
          {
            innerRef: ref,
            droppableProps: {},
            placeholder: null,
          },
          { isDraggingOver: false }
        )}
      </div>
    );
  },
}));

import React from "react";

/**
 * Helper function to create a mock task
 */
function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
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

describe("Column Component", () => {
  const mockOnCardClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Rendering and Layout Tests
  // ==========================================================================

  test("renders column with status label and task count badge", () => {
    const tasks = [createMockTask()];
    render(
      <Column status="todo" tasks={tasks} onCardClick={mockOnCardClick} />
    );

    // Check status label is present
    expect(screen.getByText("To Do")).toBeInTheDocument();

    // Check task count badge is present
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  test("renders empty column with 0 count badge", () => {
    render(<Column status="todo" tasks={[]} onCardClick={mockOnCardClick} />);

    expect(screen.getByText("To Do")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  test("renders droppable container with correct droppable ID", () => {
    render(<Column status="todo" tasks={[]} onCardClick={mockOnCardClick} />);

    expect(screen.getByTestId("droppable-todo")).toBeInTheDocument();
  });

  // ==========================================================================
  // Status Label Tests
  // ==========================================================================

  test("displays correct label for 'todo' status", () => {
    render(<Column status="todo" tasks={[]} onCardClick={mockOnCardClick} />);
    expect(screen.getByText("To Do")).toBeInTheDocument();
  });

  test("displays correct label for 'in_progress' status", () => {
    render(
      <Column status="in_progress" tasks={[]} onCardClick={mockOnCardClick} />
    );
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  test("displays correct label for 'in_review' status", () => {
    render(
      <Column status="in_review" tasks={[]} onCardClick={mockOnCardClick} />
    );
    expect(screen.getByText("In Review")).toBeInTheDocument();
  });

  test("displays correct label for 'done' status", () => {
    render(<Column status="done" tasks={[]} onCardClick={mockOnCardClick} />);
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  // ==========================================================================
  // Task Count Badge Tests
  // ==========================================================================

  test("displays correct count for single task", () => {
    const tasks = [createMockTask()];
    render(
      <Column status="todo" tasks={tasks} onCardClick={mockOnCardClick} />
    );

    expect(screen.getByText("1")).toBeInTheDocument();
  });

  test("displays correct count for multiple tasks", () => {
    const tasks = [
      createMockTask({ id: "task-1" }),
      createMockTask({ id: "task-2" }),
      createMockTask({ id: "task-3" }),
    ];
    render(
      <Column status="todo" tasks={tasks} onCardClick={mockOnCardClick} />
    );

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  test("displays correct count for many tasks", () => {
    const tasks = Array.from({ length: 15 }, (_, i) =>
      createMockTask({ id: `task-${i}` })
    );
    render(
      <Column status="todo" tasks={tasks} onCardClick={mockOnCardClick} />
    );

    expect(screen.getByText("15")).toBeInTheDocument();
  });

  // ==========================================================================
  // Card Rendering Tests
  // ==========================================================================

  test("renders all task cards in the column", () => {
    const tasks = [
      createMockTask({ id: "task-1", title: "First Task" }),
      createMockTask({ id: "task-2", title: "Second Task" }),
      createMockTask({ id: "task-3", title: "Third Task" }),
    ];
    render(
      <Column status="todo" tasks={tasks} onCardClick={mockOnCardClick} />
    );

    expect(screen.getByTestId("card-task-1")).toBeInTheDocument();
    expect(screen.getByTestId("card-task-2")).toBeInTheDocument();
    expect(screen.getByTestId("card-task-3")).toBeInTheDocument();
  });

  test("renders no cards when column is empty", () => {
    render(<Column status="todo" tasks={[]} onCardClick={mockOnCardClick} />);

    // Should have no elements with card test IDs
    const cardElements = screen.queryAllByTestId(/^card-/);
    expect(cardElements).toHaveLength(0);
  });

  test("renders cards with correct task data", () => {
    const tasks = [
      createMockTask({
        id: "task-1",
        title: "Create user profile",
      }),
      createMockTask({
        id: "task-2",
        title: "Fix login bug",
      }),
    ];
    render(
      <Column status="todo" tasks={tasks} onCardClick={mockOnCardClick} />
    );

    expect(screen.getByText("Create user profile")).toBeInTheDocument();
    expect(screen.getByText("Fix login bug")).toBeInTheDocument();
  });

  // ==========================================================================
  // Card Click Handler Tests
  // ==========================================================================

  test("calls onCardClick with correct task when card is clicked", () => {
    const task = createMockTask({
      id: "task-1",
      title: "Test Task",
    });
    render(
      <Column status="todo" tasks={[task]} onCardClick={mockOnCardClick} />
    );

    const card = screen.getByTestId("card-task-1");
    card.click();

    expect(mockOnCardClick).toHaveBeenCalledWith(task);
    expect(mockOnCardClick).toHaveBeenCalledTimes(1);
  });

  test("calls onCardClick for each card click independently", () => {
    const task1 = createMockTask({ id: "task-1", title: "Task One" });
    const task2 = createMockTask({ id: "task-2", title: "Task Two" });
    render(
      <Column
        status="todo"
        tasks={[task1, task2]}
        onCardClick={mockOnCardClick}
      />
    );

    screen.getByTestId("card-task-1").click();
    screen.getByTestId("card-task-2").click();

    expect(mockOnCardClick).toHaveBeenNthCalledWith(1, task1);
    expect(mockOnCardClick).toHaveBeenNthCalledWith(2, task2);
    expect(mockOnCardClick).toHaveBeenCalledTimes(2);
  });

  // ==========================================================================
  // Status-Specific Column Tests
  // ==========================================================================

  test("renders 'todo' column with correct styling", () => {
    const { container } = render(
      <Column status="todo" tasks={[]} onCardClick={mockOnCardClick} />
    );

    const columnDiv = container.querySelector("div");
    expect(columnDiv).toHaveClass("bg-gray-100");
    expect(columnDiv).toHaveClass("rounded-lg");
    expect(columnDiv).toHaveClass("p-3");
  });

  test("renders 'in_progress' column with correct background color", () => {
    const { container } = render(
      <Column status="in_progress" tasks={[]} onCardClick={mockOnCardClick} />
    );

    const columnDiv = container.querySelector("div");
    expect(columnDiv).toHaveClass("bg-blue-50");
  });

  test("renders 'in_review' column with correct background color", () => {
    const { container } = render(
      <Column status="in_review" tasks={[]} onCardClick={mockOnCardClick} />
    );

    const columnDiv = container.querySelector("div");
    expect(columnDiv).toHaveClass("bg-yellow-50");
  });

  test("renders 'done' column with correct background color", () => {
    const { container } = render(
      <Column status="done" tasks={[]} onCardClick={mockOnCardClick} />
    );

    const columnDiv = container.querySelector("div");
    expect(columnDiv).toHaveClass("bg-green-50");
  });

  test("applies correct header text color for 'todo' status", () => {
    render(<Column status="todo" tasks={[]} onCardClick={mockOnCardClick} />);

    const header = screen.getByText("To Do");
    expect(header).toHaveClass("text-gray-700");
  });

  test("applies correct header text color for 'in_progress' status", () => {
    render(
      <Column status="in_progress" tasks={[]} onCardClick={mockOnCardClick} />
    );

    const header = screen.getByText("In Progress");
    expect(header).toHaveClass("text-blue-700");
  });

  test("applies correct header text color for 'in_review' status", () => {
    render(
      <Column status="in_review" tasks={[]} onCardClick={mockOnCardClick} />
    );

    const header = screen.getByText("In Review");
    expect(header).toHaveClass("text-yellow-700");
  });

  test("applies correct header text color for 'done' status", () => {
    render(<Column status="done" tasks={[]} onCardClick={mockOnCardClick} />);

    const header = screen.getByText("Done");
    expect(header).toHaveClass("text-green-700");
  });

  // ==========================================================================
  // Edge Cases and Large Data Sets
  // ==========================================================================

  test("renders column with 50 tasks without performance issues", () => {
    const tasks = Array.from({ length: 50 }, (_, i) =>
      createMockTask({ id: `task-${i}`, title: `Task ${i}` })
    );
    render(
      <Column status="todo" tasks={tasks} onCardClick={mockOnCardClick} />
    );

    expect(screen.getByText("50")).toBeInTheDocument();

    // Verify some cards are rendered
    expect(screen.getByTestId("card-task-0")).toBeInTheDocument();
    expect(screen.getByTestId("card-task-25")).toBeInTheDocument();
    expect(screen.getByTestId("card-task-49")).toBeInTheDocument();
  });

  test("handles tasks with long titles", () => {
    const longTitle =
      "This is a very long task title that might wrap to multiple lines in the UI";
    const tasks = [createMockTask({ id: "task-1", title: longTitle })];
    render(
      <Column status="todo" tasks={tasks} onCardClick={mockOnCardClick} />
    );

    expect(screen.getByText(longTitle)).toBeInTheDocument();
  });

  test("handles tasks with special characters in title", () => {
    const specialTitle = "Task #1: Fix @bug with $money & <quotes>";
    const tasks = [createMockTask({ id: "task-1", title: specialTitle })];
    render(
      <Column status="todo" tasks={tasks} onCardClick={mockOnCardClick} />
    );

    expect(screen.getByText(specialTitle)).toBeInTheDocument();
  });

  // ==========================================================================
  // Task Count Badge Styling Tests
  // ==========================================================================

  test("task count badge has correct styling classes", () => {
    const { container } = render(
      <Column status="todo" tasks={[createMockTask()]} onCardClick={mockOnCardClick} />
    );

    const badge = screen.getByText("1");
    expect(badge).toHaveClass("bg-white");
    expect(badge).toHaveClass("text-gray-500");
    expect(badge).toHaveClass("rounded-full");
    expect(badge).toHaveClass("px-2");
    expect(badge).toHaveClass("py-0.5");
  });

  // ==========================================================================
  // Header Layout Tests
  // ==========================================================================

  test("header displays status label and task count side by side", () => {
    const { container } = render(
      <Column status="todo" tasks={[createMockTask()]} onCardClick={mockOnCardClick} />
    );

    const header = container.querySelector(".flex.items-center.justify-between");
    expect(header).toBeInTheDocument();

    // Both status label and count should be children of this header
    expect(header?.textContent).toContain("To Do");
    expect(header?.textContent).toContain("1");
  });

  // ==========================================================================
  // Re-render and Prop Update Tests
  // ==========================================================================

  test("updates card count when tasks array changes", () => {
    const { rerender } = render(
      <Column status="todo" tasks={[]} onCardClick={mockOnCardClick} />
    );

    expect(screen.getByText("0")).toBeInTheDocument();

    const newTasks = [
      createMockTask({ id: "task-1" }),
      createMockTask({ id: "task-2" }),
    ];
    rerender(
      <Column status="todo" tasks={newTasks} onCardClick={mockOnCardClick} />
    );

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  test("updates displayed cards when tasks array changes", () => {
    const initialTasks = [createMockTask({ id: "task-1", title: "Task One" })];
    const { rerender } = render(
      <Column status="todo" tasks={initialTasks} onCardClick={mockOnCardClick} />
    );

    expect(screen.getByText("Task One")).toBeInTheDocument();

    const newTasks = [
      createMockTask({ id: "task-2", title: "Task Two" }),
      createMockTask({ id: "task-3", title: "Task Three" }),
    ];
    rerender(
      <Column status="todo" tasks={newTasks} onCardClick={mockOnCardClick} />
    );

    expect(screen.queryByText("Task One")).not.toBeInTheDocument();
    expect(screen.getByText("Task Two")).toBeInTheDocument();
    expect(screen.getByText("Task Three")).toBeInTheDocument();
  });

  test("updates status label when status prop changes", () => {
    const { rerender } = render(
      <Column status="todo" tasks={[]} onCardClick={mockOnCardClick} />
    );

    expect(screen.getByText("To Do")).toBeInTheDocument();

    rerender(
      <Column status="in_progress" tasks={[]} onCardClick={mockOnCardClick} />
    );

    expect(screen.queryByText("To Do")).not.toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  test("updates column background color when status changes", () => {
    const { container, rerender } = render(
      <Column status="todo" tasks={[]} onCardClick={mockOnCardClick} />
    );

    const columnDiv = container.querySelector("div");
    expect(columnDiv).toHaveClass("bg-gray-100");

    rerender(
      <Column status="done" tasks={[]} onCardClick={mockOnCardClick} />
    );

    expect(columnDiv).toHaveClass("bg-green-50");
  });

  // ==========================================================================
  // Callback Stability Tests
  // ==========================================================================

  test("callback reference can be updated", () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const task = createMockTask({ id: "task-1" });

    const { rerender } = render(
      <Column status="todo" tasks={[task]} onCardClick={callback1} />
    );

    screen.getByTestId("card-task-1").click();
    expect(callback1).toHaveBeenCalledWith(task);

    rerender(
      <Column status="todo" tasks={[task]} onCardClick={callback2} />
    );

    vi.clearAllMocks();

    screen.getByTestId("card-task-1").click();
    expect(callback2).toHaveBeenCalledWith(task);
  });
});
