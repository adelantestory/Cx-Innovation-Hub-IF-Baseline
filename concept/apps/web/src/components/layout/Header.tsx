import type { User } from "../../api/types";

interface HeaderProps {
  user: User;
  onSwitchUser: (...args: any[]) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
  onNavigateHome: (...args: any[]) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export default function Header({ user, onSwitchUser, onNavigateHome }: HeaderProps) {
  return (
    <header className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
      <button
        onClick={onNavigateHome}
        className="text-xl font-bold hover:opacity-80"
      >
        Taskify
      </button>
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
          style={{ backgroundColor: user.avatar_color }}
        >
          {user.name[0]}
        </div>
        <span>{user.name}</span>
        <button onClick={onSwitchUser} className="underline text-sm">
          Switch User
        </button>
      </div>
    </header>
  );
}
