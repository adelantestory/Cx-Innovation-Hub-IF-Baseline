import { useState } from "react";
import type { Comment } from "@/api/types";
import CommentForm from "./CommentForm";

interface CommentListProps {
  comments: Comment[];
  currentUserId: string;
  onAddComment: (content: string, parentId?: string) => Promise<void>;
  onEditComment: (id: string, content: string) => Promise<void>;
  onDeleteComment: (id: string) => Promise<void>;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface CommentItemProps {
  comment: Comment;
  replies: Comment[];
  depth: number;
  currentUserId: string;
  onAddComment: (content: string, parentId?: string) => Promise<void>;
  onEditComment: (id: string, content: string) => Promise<void>;
  onDeleteComment: (id: string) => Promise<void>;
}

function CommentItem({
  comment,
  replies,
  depth,
  currentUserId,
  onAddComment,
  onEditComment,
  onDeleteComment,
}: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(comment.content);
  const [showReply, setShowReply] = useState(false);

  const isOwner = comment.user_id === currentUserId;
  const wasEdited = comment.updated_at !== comment.created_at;
  const canReply = depth < 2;

  async function handleSaveEdit() {
    if (!editValue.trim()) return;
    await onEditComment(comment.id, editValue.trim());
    setEditing(false);
  }

  return (
    <div className="mb-3">
      <div className="flex items-start gap-2">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
          style={{ backgroundColor: comment.author_avatar_color }}
        >
          {comment.author_name[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2 text-xs text-gray-500 mb-0.5">
            <span className="font-semibold text-gray-700">{comment.author_name}</span>
            <span>{formatRelativeTime(comment.created_at)}</span>
            {wasEdited && <span>(edited)</span>}
          </div>
          {editing ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 border rounded px-2 py-1 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSaveEdit();
                  if (e.key === "Escape") setEditing(false);
                }}
                autoFocus
              />
              <button
                onClick={() => void handleSaveEdit()}
                disabled={!editValue.trim()}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-xs border px-2 py-1 rounded"
              >
                Cancel
              </button>
            </div>
          ) : (
            <p className="text-sm">{comment.content}</p>
          )}
          <div className="flex gap-2 mt-1">
            {!editing && canReply && (
              <button
                onClick={() => setShowReply((v) => !v)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Reply
              </button>
            )}
            {isOwner && !editing && (
              <>
                <button
                  onClick={() => {
                    setEditValue(comment.content);
                    setEditing(true);
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => void onDeleteComment(comment.id)}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  Delete
                </button>
              </>
            )}
          </div>
          {showReply && (
            <div className="mt-2">
              <CommentForm
                onSubmit={async (content) => {
                  await onAddComment(content, comment.id);
                  setShowReply(false);
                }}
                placeholder="Write a reply..."
                onCancel={() => setShowReply(false)}
                parentCommentId={comment.id}
              />
            </div>
          )}
          {replies.length > 0 && (
            <div className="ml-6 mt-2">
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  replies={[]}
                  depth={depth + 1}
                  currentUserId={currentUserId}
                  onAddComment={onAddComment}
                  onEditComment={onEditComment}
                  onDeleteComment={onDeleteComment}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommentList({
  comments,
  currentUserId,
  onAddComment,
  onEditComment,
  onDeleteComment,
}: CommentListProps) {
  const topLevel = comments.filter((c) => c.parent_comment_id === null);
  const replies = comments.filter((c) => c.parent_comment_id !== null);

  function getReplies(commentId: string): Comment[] {
    return replies.filter((r) => r.parent_comment_id === commentId);
  }

  return (
    <div>
      <h4 className="font-semibold mb-3">Comments ({comments.length})</h4>
      <div className="mb-4">
        <CommentForm onSubmit={onAddComment} />
      </div>
      {comments.length === 0 ? (
        <p className="text-sm text-gray-400">No comments yet.</p>
      ) : (
        <div>
          {topLevel.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={getReplies(comment.id)}
              depth={0}
              currentUserId={currentUserId}
              onAddComment={onAddComment}
              onEditComment={onEditComment}
              onDeleteComment={onDeleteComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}
