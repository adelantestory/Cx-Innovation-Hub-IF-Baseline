import { useState } from 'react';
import type { User, Comment } from '../types';
import { createComment, updateComment, deleteComment } from '../api';

interface Props {
  taskId: string;
  currentUser: User;
  comments: Comment[];
  onCommentsChange: (comments: Comment[]) => void;
}

export default function Comments({ taskId, currentUser, comments, onCommentsChange }: Props) {
  const [newContent, setNewContent] = useState('');
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  async function handleSend() {
    if (!newContent.trim()) return;
    setSending(true);
    try {
      const comment = await createComment(taskId, newContent.trim(), currentUser.id);
      onCommentsChange([...comments, comment]);
      setNewContent('');
    } finally {
      setSending(false);
    }
  }

  async function handleEditSave(commentId: string) {
    if (!editContent.trim()) return;
    try {
      const updated = await updateComment(commentId, editContent.trim(), currentUser.id);
      onCommentsChange(comments.map((c) => (c.id === commentId ? updated : c)));
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await deleteComment(commentId, currentUser.id);
      onCommentsChange(comments.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <h3 className="font-semibold text-gray-700 mb-3">Comments</h3>

      <div className="space-y-3 mb-4">
        {comments.map((comment) => {
          const isOwn = comment.user_id === currentUser.id;
          return (
            <div key={comment.id} className="flex gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0">
                {comment.author_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-sm text-gray-800">{comment.author_name}</span>
                  {comment.is_edited && (
                    <span className="text-xs text-gray-400">(edited)</span>
                  )}
                </div>

                {editingId === comment.id ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <button
                      onClick={() => handleEditSave(comment.id)}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 break-words">{comment.content}</p>
                )}

                {isOwn && editingId !== comment.id && (
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditContent(comment.content);
                      }}
                      className="text-xs text-blue-500 hover:text-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add a comment..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleSend}
          disabled={sending}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
