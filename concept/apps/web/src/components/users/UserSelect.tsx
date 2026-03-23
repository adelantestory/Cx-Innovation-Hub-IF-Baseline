import { useEffect, useState } from "react";
import { fetchUsers } from "../../api/client";
import type { User } from "../../api/types";

interface UserSelectProps {
  onSelectUser: (user: User) => void;
}

export default function UserSelect({ onSelectUser }: UserSelectProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers()
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading users...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Failed to load users: {error}</p>
        <button onClick={() => {
          setLoading(true);
          setError(null);
          fetchUsers()
            .then((data) => {
              setUsers(data);
              setLoading(false);
            })
            .catch((err: Error) => {
              setError(err.message);
              setLoading(false);
            });
        }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-2">Taskify</h1>
      <p className="text-gray-500 mb-8">Select your user to get started</p>
      <div className="flex flex-wrap gap-4 justify-center">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => onSelectUser(user)}
            className="flex flex-col items-center bg-white rounded-lg shadow p-6 w-40 hover:shadow-md"
            aria-label={user.name}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl mb-3"
              style={{ backgroundColor: user.avatar_color }}
            >
              {user.name[0]}
            </div>
            <span className="font-semibold">{user.name}</span>
            <span className="text-xs text-gray-500 mt-1">
              {user.role.replace(/_/g, " ")}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
