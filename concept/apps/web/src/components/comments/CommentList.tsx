// =============================================================================
// Comment List Component
// =============================================================================
// Renders a threaded list of comments for a task. Top-level comments are
// displayed first, with replies indented below their parent. Supports
// inline editing, deletion (author only), and reply threading.
// =============================================================================

import { useState } from "react";
import CommentForm from "./CommentForm";
import type { Comment } from "../../api/types";

interface CommentListProps {
  comments: Comment[];
  currentUserId: string;
  onAddComment: (content: string, parentCommentId?: string) => Promise<void>;
  onEditComment: (id: string, content: string) => Promise<void>;
  onDeleteComment: (id: string) => Promise<void>;
}

export default function CommentList({
  comments,
  currentUserId,
  onAddComment,
  onEditComment,
  onDeleteComment,
}: CommentListProps) {
  // Separate top-level and reply comments
  const topLevel = comments.filter((c) => !c.parent_comment_id);
  const replies = comments.filter((c) => c.parent_comment_id);

  function getReplies(parentId: string): Comment[] {
    return replies.filter((c) => c.parent_comment_id === parentId);
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700">
        Comments ({comments.length})
      </h4>

      <CommentForm onSubmit={onAddComment} placeholder="Add a comment..." />

      <div className="space-y-3">
        {topLevel.map((comment) => (
          <CommentThread
            key={comment.id}
            comment={comment}
            replies={getReplies(comment.id)}
            currentUserId={currentUserId}
            onAddComment={onAddComment}
            onEditComment={onEditComment}
            onDeleteComment={onDeleteComment}
            depth={0}
          />
        ))}
      </div>

      {comments.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-2">No comments yet.</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single Comment Thread (recursive for replies)
// ---------------------------------------------------------------------------

interface CommentThreadProps {
  comment: Comment;
  replies: Comment[];
  currentUserId: string;
  onAddComment: (content: string, parentCommentId?: string) => Promise<void>;
  onEditComment: (id: string, content: string) => Promise<void>;
  onDeleteComment: (id: string) => Promise<void>;
  depth: number;
}

function CommentThread({
  comment,
  replies,
  currentUserId,
  onAddComment,
  onEditComment,
  onDeleteComment,
  depth,
}: CommentThreadProps) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isAuthor = comment.user_id === currentUserId;
  const maxDepth = 2; // Limit nesting depth for readability

  async function handleEdit() {
    if (!editContent.trim()) return;
    await onEditComment(comment.id, editContent.trim());
    setEditing(false);
  }

  async function handleReply(content: string) {
    await onAddComment(content, comment.id);
    setReplying(false);
  }

  const timeAgo = formatTimeAgo(comment.created_at);
  const wasEdited = comment.created_at !== comment.updated_at;

  return (
    <div className={depth > 0 ? "ml-6 border-l-2 border-gray-200 pl-3" : ""}>
      <div className="flex items-start gap-2">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0 mt-0.5"
          style={{ backgroundColor: comment.author_avatar_color }}
        >
          {comment.author_name.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-700">
              {comment.author_name}
            </span>
            <span className="text-xs text-gray-400">{timeAgo}</span>
            {wasEdited && <span className="text-xs text-gray-400">(edited)</span>}
          </div>

          {editing ? (
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEdit();
                  if (e.key === "Escape") setEditing(false);
                }}
              />
              <button
                onClick={handleEdit}
                className="text-xs text-blue-500 hover:text-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditContent(comment.content);
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-600 mt-0.5">{comment.content}</p>
          )}

          <div className="flex items-center gap-3 mt-1">
            {depth < maxDepth && (
              <button
                onClick={() => setReplying(!replying)}
                className="text-xs text-gray-400 hover:text-blue-500"
              >
                Reply
              </button>
            )}
            {isAuthor && !editing && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-gray-400 hover:text-blue-500"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeleteComment(comment.id)}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  Delete
                </button>
              </>
            )}
          </div>

          {replying && (
            <div className="mt-2">
              <CommentForm
                onSubmit={handleReply}
                placeholder="Write a reply..."
                autoFocus
                onCancel={() => setReplying(false)}
              />
            </div>
          )}
        </div>
      </div>

      {replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              replies={[]} // Only one level of nesting for simplicity
              currentUserId={currentUserId}
              onAddComment={onAddComment}
              onEditComment={onEditComment}
              onDeleteComment={onDeleteComment}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Simple relative time formatter.
 */
function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
