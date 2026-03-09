// =============================================================================
// Comment Form Component
// =============================================================================
// Simple text input for adding a new comment or reply. Supports threading
// via optional parentCommentId prop.
// =============================================================================

import { useState } from "react";

interface CommentFormProps {
  onSubmit: (content: string, parentCommentId?: string) => Promise<void>;
  parentCommentId?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
}

export default function CommentForm({
  onSubmit,
  parentCommentId,
  placeholder = "Add a comment...",
  autoFocus = false,
  onCancel,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onSubmit(content.trim(), parentCommentId);
      setContent("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={submitting || !content.trim()}
        className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {submitting ? "..." : "Send"}
      </button>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      )}
    </form>
  );
}
