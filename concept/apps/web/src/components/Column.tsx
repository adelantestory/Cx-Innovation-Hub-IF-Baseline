import { Droppable, Draggable } from '@hello-pangea/dnd';
import type { Task, User } from '../types';
import Card from './Card';

interface Props {
  id: string;
  title: string;
  tasks: Task[];
  currentUser: User;
  onCardClick: (task: Task) => void;
}

export default function Column({ id, title, tasks, currentUser, onCardClick }: Props) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 flex flex-col min-h-[200px]">
      <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide px-1">
        {title}
        <span className="ml-2 text-gray-400 font-normal normal-case tracking-normal">
          {tasks.length}
        </span>
      </h3>
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-col gap-2 flex-1 min-h-[60px] rounded-lg transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50' : ''
            }`}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    style={{
                      ...dragProvided.draggableProps.style,
                      opacity: dragSnapshot.isDragging ? 0.8 : 1,
                    }}
                  >
                    <Card
                      task={task}
                      currentUser={currentUser}
                      index={index}
                      onClick={onCardClick}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
