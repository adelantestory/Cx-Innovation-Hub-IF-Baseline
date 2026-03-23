import { render, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi, beforeEach } from "vitest";
import type { Task } from "../../api/types";
import Card from "./Card";

// Mock @hello-pangea/dnd
vi.mock("@hello-pangea/dnd", () => ({
  Draggable: ({
    children,
  }: {
    children: (provided: any, snapshot: any) => JSX.Element;
  }) => {
    const provided = {
      innerRef: vi.fn(),
      draggableProps: { "data-draggable-id": "task-1" },
      dragHandleProps: {},
    };
    const snapshot = { isDragging: false };
    return children(provided, snapshot);
  },
}));

describe("Card Component", () => {
  const mockOnClick = vi.fn();

  const createMockTask = (overrides: Partial<Task> = {}): Task => ({
    id: "task-1",
    project_id: "project-1",
    title: "Complete project setup",
    description: "Set up the development environment",
    status: "todo",
    position: 0,
    assigned_user_id: "user-1",
    assigned_user_name: "John Doe",
    assigned_user_avatar_color: "#3B82F6",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  });

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  // ===== RENDERING TESTS =====
  test("renders task card with all required props", () => {
    const task = createMockTask();
    render(<Card task={task} index={0} onClick={mockOnClick} />);

    // Task should be rendered in the DOM
    const cardElement = screen.getByText("Complete project setup");
    expect(cardElement).toBeInTheDocument();
  });

  test("displays task title", () => {
    const task = createMockTask({
      title: "Implement authentication",
    });
    render(<Card task={task} index={0} onClick={mockOnClick} />);

    expect(screen.getByText("Implement authentication")).toBeInTheDocument();
  });

  test("displays task description when present", () => {
    const task = createMockTask({
      description: "Set up JWT tokens for user sessions",
    });
    render(<Card task={task} index={0} onClick={mockOnClick} />);

    expect(screen.getByText("Set up JWT tokens for user sessions")).toBeInTheDocument();
  });

  test("does not display description when it is null", () => {
    const task = createMockTask({
      description: null,
    });
    render(<Card task={task} index={0} onClick={mockOnClick} />);

    // Card should still render without description
    expect(screen.getByText("Complete project setup")).toBeInTheDocument();
  });

  // ===== ASSIGNED USER TESTS =====
  test("displays assigned user name", () => {
    const task = createMockTask({
      assigned_user_name: "Alice Johnson",
    });
    render(<Card task={task} index={0} onClick={mockOnClick} />);

    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
  });

  test("displays user avatar with first letter of name", () => {
    const task = createMockTask({
      assigned_user_name: "Benjamin Smith",
    });
    render(<Card task={task} index={0} onClick={mockOnClick} />);

    // Avatar should display first letter
    const avatar = screen.getByText("B");
    expect(avatar).toBeInTheDocument();
  });

  test("applies correct avatar color from task data", () => {
    const task = createMockTask({
      assigned_user_name: "Carol Wilson",
      assigned_user_avatar_color: "#EC4899",
    });
    render(<Card task={task} index={0} onClick={mockOnClick} />);

    const avatar = screen.getByText("C");
    expect(avatar).toHaveStyle({ backgroundColor: "#EC4899" });
  });

  test("uses default gray color when assigned_user_avatar_color is null", () => {
    const task = createMockTask({
      assigned_user_name: "David Lee",
      assigned_user_avatar_color: null,
    });
    render(<Card task={task} index={0} onClick={mockOnClick} />);

    const avatar = screen.getByText("D");
    expect(avatar).toHaveStyle({ backgroundColor: "#9CA3AF" });
  });

  test("does not display user section when assigned_user_name is null", () => {
    const task = createMockTask({
      title: "No assignee task",
      assigned_user_name: null,
      assigned_user_id: null,
    });
    render(<Card task={task} index={0} onClick={mockOnClick} />);

    // Card renders but without user section
    expect(screen.getByText("No assignee task")).toBeInTheDocument();
    // User avatar should not be rendered
    const { container } = render(<Card task={task} index={0} onClick={mockOnClick} />);
    const avatarDivs = container.querySelectorAll(".w-5.h-5.rounded-full");
    expect(avatarDivs.length).toBe(0);
  });

  // ===== DRAGGABLE TESTS =====
  test("card has draggable attributes present", () => {
    const task = createMockTask();
    const { container } = render(
      <Card task={task} index={0} onClick={mockOnClick} />
    );

    // Check for draggable props data attributes
    const cardElement = container.querySelector('[data-draggable-id]');
    expect(cardElement).toBeInTheDocument();
  });

  // ===== INTERACTION TESTS =====
  test("calls onClick callback when card is clicked", async () => {
    const task = createMockTask();
    const user = userEvent.setup();
    render(<Card task={task} index={0} onClick={mockOnClick} />);

    const cardText = screen.getByText("Complete project setup");
    await user.click(cardText);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
    expect(mockOnClick).toHaveBeenCalledWith(task);
  });

  test("calls onClick with correct task when multiple cards are rendered", async () => {
    const task1 = createMockTask({ id: "task-1", title: "Task 1" });
    const task2 = createMockTask({ id: "task-2", title: "Task 2" });
    const user = userEvent.setup();

    const { rerender } = render(
      <Card task={task1} index={0} onClick={mockOnClick} />
    );

    await user.click(screen.getByText("Task 1"));
    expect(mockOnClick).toHaveBeenCalledWith(task1);

    mockOnClick.mockClear();

    rerender(<Card task={task2} index={0} onClick={mockOnClick} />);
    await user.click(screen.getByText("Task 2"));
    expect(mockOnClick).toHaveBeenCalledWith(task2);
  });

  // ===== EDGE CASES =====
  test("renders minimal task with only required title", () => {
    const task = createMockTask({
      title: "Minimal Task",
      description: null,
      assigned_user_name: null,
      assigned_user_id: null,
    });
    render(<Card task={task} index={0} onClick={mockOnClick} />);

    expect(screen.getByText("Minimal Task")).toBeInTheDocument();
  });

  test("renders task with full information", () => {
    const task = createMockTask({
      title: "Complete Feature",
      description: "Implement user authentication with OAuth2",
      assigned_user_name: "Emily Brown",
      assigned_user_avatar_color: "#8B5CF6",
    });
    render(<Card task={task} index={0} onClick={mockOnClick} />);

    expect(screen.getByText("Complete Feature")).toBeInTheDocument();
    expect(screen.getByText("Implement user authentication with OAuth2")).toBeInTheDocument();
    expect(screen.getByText("Emily Brown")).toBeInTheDocument();
    expect(screen.getByText("E")).toHaveStyle({ backgroundColor: "#8B5CF6" });
  });

  test("handles task with very long title", () => {
    const longTitle = "This is a very long task title that might exceed normal length";
    const task = createMockTask({ title: longTitle });
    render(<Card task={task} index={0} onClick={mockOnClick} />);

    expect(screen.getByText(longTitle)).toBeInTheDocument();
  });

  test("handles task with special characters in title", () => {
    const task = createMockTask({
      title: "Review PR #42 & fix bugs (high priority!)",
    });
    render(<Card task={task} index={0} onClick={mockOnClick} />);

    expect(screen.getByText("Review PR #42 & fix bugs (high priority!)")).toBeInTheDocument();
  });

  test("handles task with single-character user name", () => {
    const task = createMockTask({
      assigned_user_name: "X",
    });
    render(<Card task={task} index={0} onClick={mockOnClick} />);

    // Avatar and user name both display X
    // Should find 2 instances - one in avatar circle, one in user name span
    expect(screen.getAllByText("X")).toHaveLength(2);
  });

  // ===== ACCESSIBILITY TESTS =====
  test("card is clickable and cursor is pointer", () => {
    const task = createMockTask();
    const { container } = render(
      <Card task={task} index={0} onClick={mockOnClick} />
    );

    const cardDiv = container.querySelector("div");
    expect(cardDiv).toHaveClass("cursor-pointer");
  });

  test("text elements have appropriate styling classes", () => {
    const task = createMockTask({
      title: "Styled Task",
      description: "With description",
      assigned_user_name: "Frank Wilson",
    });
    const { container } = render(
      <Card task={task} index={0} onClick={mockOnClick} />
    );

    // Title should have font-medium styling
    const titleElement = screen.getByText("Styled Task");
    expect(titleElement).toHaveClass("font-medium");

    // Description should have text-xs and color styling
    const descElement = screen.getByText("With description");
    expect(descElement).toHaveClass("text-xs");

    // User name should have text-xs styling
    const userElement = screen.getByText("Frank Wilson");
    expect(userElement).toHaveClass("text-xs");
  });

  // ===== DIFFERENT TASK STATUSES =====
  test("renders card for todo status", () => {
    const task = createMockTask({ status: "todo" });
    render(<Card task={task} index={0} onClick={mockOnClick} />);

    expect(screen.getByText("Complete project setup")).toBeInTheDocument();
  });

  test("renders card for in_progress status", () => {
    const task = createMockTask({ status: "in_progress" });
    render(<Card task={task} index={0} onClick={mockOnClick} />);

    expect(screen.getByText("Complete project setup")).toBeInTheDocument();
  });

  test("renders card for in_review status", () => {
    const task = createMockTask({ status: "in_review" });
    render(<Card task={task} index={0} onClick={mockOnClick} />);

    expect(screen.getByText("Complete project setup")).toBeInTheDocument();
  });

  test("renders card for done status", () => {
    const task = createMockTask({ status: "done" });
    render(<Card task={task} index={0} onClick={mockOnClick} />);

    expect(screen.getByText("Complete project setup")).toBeInTheDocument();
  });

  // ===== INDEX PROP TESTS =====
  test("accepts index prop for drag-and-drop positioning", () => {
    const task = createMockTask();
    const { rerender } = render(
      <Card task={task} index={0} onClick={mockOnClick} />
    );

    // Should render without errors at different indices
    expect(screen.getByText("Complete project setup")).toBeInTheDocument();

    rerender(<Card task={task} index={5} onClick={mockOnClick} />);
    expect(screen.getByText("Complete project setup")).toBeInTheDocument();
  });
});
