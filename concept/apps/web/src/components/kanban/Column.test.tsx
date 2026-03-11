import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../test/test-utils";
import { DragDropContext } from "@hello-pangea/dnd";
import Column from "./Column";
import type { Task } from "../../api/types";

const mockTasks: Task[] = [
  {
    id: "1",
    project_id: "1",
    title: "Task One",
    description: "First task",
    status: "todo",
    position: 0,
    assigned_user_id: null,
    assigned_user_name: null,
    assigned_user_avatar_color: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    project_id: "1",
    title: "Task Two",
    description: null,
    status: "todo",
    position: 1,
    assigned_user_id: null,
    assigned_user_name: null,
    assigned_user_avatar_color: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

function renderColumn(tasks = mockTasks, onCardClick = vi.fn()) {
  return render(
    <DragDropContext onDragEnd={() => {}}>
      <Column status="todo" tasks={tasks} onCardClick={onCardClick} />
    </DragDropContext>
  );
}

describe("Column", () => {
  it("renders status label", () => {
    renderColumn();

    expect(screen.getByText("To Do")).toBeInTheDocument();
  });

  it("renders In Progress label for in_progress status", () => {
    render(
      <DragDropContext onDragEnd={() => {}}>
        <Column status="in_progress" tasks={[]} onCardClick={() => {}} />
      </DragDropContext>
    );

    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("shows task count badge", () => {
    renderColumn();

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders cards for each task", () => {
    renderColumn();

    expect(screen.getByText("Task One")).toBeInTheDocument();
    expect(screen.getByText("Task Two")).toBeInTheDocument();
  });

  it("shows zero count when no tasks", () => {
    renderColumn([]);

    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
