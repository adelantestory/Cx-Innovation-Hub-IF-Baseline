import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../test/test-utils";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import Card from "./Card";
import type { Task } from "../../api/types";

const baseTask: Task = {
  id: "1",
  project_id: "1",
  title: "Test Task",
  description: "A task description",
  status: "todo",
  position: 0,
  assigned_user_id: "1",
  assigned_user_name: "Alice Johnson",
  assigned_user_avatar_color: "#4F46E5",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

function renderCard(task: Task, onClick = vi.fn()) {
  return render(
    <DragDropContext onDragEnd={() => {}}>
      <Droppable droppableId="test-column">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            <Card task={task} index={0} onClick={onClick} />
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

describe("Card", () => {
  it("renders task title", () => {
    renderCard(baseTask);

    expect(screen.getByText("Test Task")).toBeInTheDocument();
  });

  it("renders task description when present", () => {
    renderCard(baseTask);

    expect(screen.getByText("A task description")).toBeInTheDocument();
  });

  it("does not render description when null", () => {
    renderCard({ ...baseTask, description: null });

    expect(screen.queryByText("A task description")).not.toBeInTheDocument();
  });

  it("shows assigned user avatar and name when assigned", () => {
    renderCard(baseTask);

    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    // Avatar initial
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("does not show assigned user section when unassigned", () => {
    renderCard({
      ...baseTask,
      assigned_user_id: null,
      assigned_user_name: null,
      assigned_user_avatar_color: null,
    });

    expect(screen.queryByText("Alice Johnson")).not.toBeInTheDocument();
  });

  it("calls onClick with the task when clicked", async () => {
    const onClick = vi.fn();
    const { user } = renderCard(baseTask, onClick);

    await user.click(screen.getByText("Test Task"));
    expect(onClick).toHaveBeenCalledWith(baseTask);
  });
});
