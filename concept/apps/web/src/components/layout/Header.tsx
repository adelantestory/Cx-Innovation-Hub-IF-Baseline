// =============================================================================
// Header Component
// =============================================================================
// Top navigation bar displaying the app name, current user, and a button
// to switch users. Shown on all screens after user selection.
// =============================================================================

import type { User } from "../../api/types";

interface HeaderProps {
  user: User;
  onSwitchUser: () => void;
  onNavigateHome: () => void;
}

export default function Header({ user, onSwitchUser, onNavigateHome }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <button
          onClick={onNavigateHome}
          className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
        >
          Taskify
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: user.avatar_color }}
            >
              {user.name.charAt(0)}
            </div>
            <span className="text-sm text-gray-700 font-medium">{user.name}</span>
          </div>
          <button
            onClick={onSwitchUser}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Switch User
          </button>
        </div>
      </div>
    </header>
  );
}
