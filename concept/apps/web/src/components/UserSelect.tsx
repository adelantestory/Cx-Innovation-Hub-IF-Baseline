import { useEffect, useState } from 'react';
import type { User } from '../types';
import { getUsers } from '../api';

interface Props {
  onSelectUser: (user: User) => void;
}

export default function UserSelect({ onSelectUser }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-2">Taskify</h1>
      <p className="text-gray-500 mb-10">Select your user to get started</p>

      {loading ? (
        <p className="text-gray-400">Loading users...</p>
      ) : (
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => onSelectUser(user)}
              className="flex items-center gap-4 bg-white rounded-lg p-4 shadow hover:shadow-md hover:bg-gray-50 transition-all text-left"
            >
              <div
                className="rounded-full w-10 h-10 flex items-center justify-center text-white font-semibold flex-shrink-0"
                style={{ backgroundColor: user.avatar_color || '#6366f1' }}
              >
                {user.name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-gray-800">{user.name}</div>
                <div className="text-sm text-gray-500">{user.role}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
