import { useState } from "react";

interface CommentFormProps {
  onSubmit: (content: string, parentCommentId?: string) => Promise<void>;
  placeholder?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
  parentCommentId?: string;
}

export default function CommentForm({
  onSubmit,
  placeholder = "Add a comment...",
  autoFocus,
  onCancel,
  parentCommentId,
}: CommentFormProps) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const trimmed = value.trim();

  async function handleSubmit() {
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed, parentCommentId);
      setValue("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus={autoFocus}
        className="flex-1 border rounded px-3 py-1.5 text-sm"
        onKeyDown={(e) => {
          if (e.key === "Enter" && trimmed && !submitting) {
            void handleSubmit();
          }
        }}
      />
      <button
        onClick={() => void handleSubmit()}
        disabled={!trimmed || submitting}
        className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
      >
        {submitting ? "..." : "Send"}
      </button>
      {onCancel && (
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded text-sm border"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
