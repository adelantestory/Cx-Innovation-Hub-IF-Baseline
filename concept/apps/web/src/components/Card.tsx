import type { Task, User } from '../types';

interface Props {
  task: Task;
  currentUser: User;
  onClick: (task: Task) => void;
}

export default function Card({ task, currentUser, onClick }: Props) {
  const isOwn = task.assigned_user_id === currentUser.id;

  return (
    <div
      data-own={isOwn ? 'true' : undefined}
      onClick={() => onClick(task)}
      className={`bg-white rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
        isOwn ? 'ring-2 ring-blue-400' : ''
      }`}
    >
      <p className="text-sm font-medium text-gray-800 mb-2">{task.title}</p>
      {task.assigned_user_name && (
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-700 font-semibold">
            {task.assigned_user_name.charAt(0)}
          </div>
          <span className="text-xs text-gray-500">{task.assigned_user_name}</span>
        </div>
      )}
    </div>
  );
}
