import { Draggable } from "@hello-pangea/dnd";
import type { Task } from "../../api/types";

interface CardProps {
  task: Task;
  index: number;
  onClick: (task: Task) => void;
}

export default function Card({ task, index, onClick }: CardProps) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          className="bg-white rounded-lg shadow-sm border p-3 mb-2 cursor-pointer hover:shadow"
        >
          <p className="font-medium text-sm">{task.title}</p>
          {task.description && (
            <p className="text-xs text-gray-500 mt-1">{task.description}</p>
          )}
          {task.assigned_user_name && (
            <div className="flex items-center gap-1 mt-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                style={{
                  backgroundColor: task.assigned_user_avatar_color ?? "#9CA3AF",
                }}
              >
                {task.assigned_user_name[0]}
              </div>
              <span className="text-xs text-gray-500">{task.assigned_user_name}</span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
