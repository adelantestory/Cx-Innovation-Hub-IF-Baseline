import type { User } from '../types';

interface Props {
  currentUser: User;
  onSwitchUser: () => void;
  onGoToProjects: () => void;
}

export default function Header({ currentUser, onSwitchUser, onGoToProjects }: Props) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <button
          onClick={onGoToProjects}
          className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          Taskify
        </button>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm">{currentUser.name}</span>
          <button
            onClick={onSwitchUser}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md transition-colors"
          >
            Switch User
          </button>
        </div>
      </div>
    </header>
  );
}
