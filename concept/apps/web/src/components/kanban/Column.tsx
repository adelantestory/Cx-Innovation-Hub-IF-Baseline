import { Droppable } from "@hello-pangea/dnd";
import type { Task, TaskStatus } from "../../api/types";
import Card from "./Card";

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

const STATUS_BG: Record<TaskStatus, string> = {
  todo: "bg-gray-100",
  in_progress: "bg-blue-50",
  in_review: "bg-yellow-50",
  done: "bg-green-50",
};

const STATUS_TEXT: Record<TaskStatus, string> = {
  todo: "text-gray-700",
  in_progress: "text-blue-700",
  in_review: "text-yellow-700",
  done: "text-green-700",
};

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onCardClick: (task: Task) => void;
}

export default function Column({ status, tasks, onCardClick }: ColumnProps) {
  return (
    <div className={`flex flex-col min-w-[240px] w-64 ${STATUS_BG[status]} rounded-lg p-3`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`font-semibold text-sm ${STATUS_TEXT[status]}`}>
          {STATUS_LABELS[status]}
        </span>
        <span className="bg-white text-gray-500 rounded-full px-2 py-0.5 text-xs">
          {tasks.length}
        </span>
      </div>
      <Droppable droppableId={status}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex-1 min-h-[100px]"
          >
            {tasks.map((task, index) => (
              <Card
                key={task.id}
                task={task}
                index={index}
                onClick={onCardClick}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
