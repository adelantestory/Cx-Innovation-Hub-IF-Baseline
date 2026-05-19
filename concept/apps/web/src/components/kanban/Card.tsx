// =============================================================================
// Kanban Card Component
// =============================================================================
// Renders a single task card within a Kanban column. Draggable via
// @hello-pangea/dnd. Shows title, assigned user avatar, and comment count
// indicator. Clicking opens the task detail modal.
// =============================================================================

import { Draggable } from "@hello-pangea/dnd";
import type { Task } from "../../api/types";

interface CardProps {
  task: Task;
  index: number;
  onClick: (task: Task) => void;
}

const PRIORITY_STYLES: Record<Task["priority"], string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-gray-100 text-gray-700",
};

export default function Card({ task, index, onClick }: CardProps) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          className={`bg-white rounded-lg shadow-sm border p-3 mb-2 cursor-pointer transition-shadow ${
            snapshot.isDragging
              ? "shadow-lg border-blue-300"
              : "border-gray-200 hover:shadow-md"
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-gray-900">{task.title}</p>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 ${PRIORITY_STYLES[task.priority]}`}
            >
              {task.priority}
            </span>
          </div>

          {task.description && (
            <p className="text-xs text-gray-500 mb-2 line-clamp-2">
              {task.description}
            </p>
          )}

          {task.assigned_user_name && (
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-medium"
                style={{
                  backgroundColor: task.assigned_user_avatar_color || "#9CA3AF",
                }}
              >
                {task.assigned_user_name.charAt(0)}
              </div>
              <span className="text-xs text-gray-500">{task.assigned_user_name}</span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
