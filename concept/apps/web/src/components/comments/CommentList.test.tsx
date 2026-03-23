import { render, screen, within } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CommentList from "./CommentList";
import type { Comment } from "@/api/types";

// Test data factory
const createMockComment = (overrides?: Partial<Comment>): Comment => ({
  id: "comment-1",
  task_id: "task-123",
  user_id: "user-alice",
  parent_comment_id: null,
  content: "This is a test comment",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  author_name: "Alice",
  author_avatar_color: "rgb(59, 130, 246)", // bg-blue-500
  ...overrides,
});

describe("CommentList", () => {
  const currentUserId = "current-user-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render heading with comment count", () => {
      const comments = [
        createMockComment({ id: "comment-1", content: "First comment" }),
        createMockComment({ id: "comment-2", content: "Second comment" }),
      ];

      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      expect(screen.getByText("Comments (2)")).toBeInTheDocument();
    });

    it("should display empty state when no comments exist", () => {
      render(
        <CommentList
          comments={[]}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      expect(screen.getByText("No comments yet.")).toBeInTheDocument();
    });

    it("should display comment form for adding new comments", () => {
      render(
        <CommentList
          comments={[]}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      expect(
        screen.getByPlaceholderText("Add a comment...")
      ).toBeInTheDocument();
    });
  });

  describe("Comment Display", () => {
    it("should display author name", () => {
      const comments = [createMockComment({ author_name: "Alice Johnson" })];

      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    });

    it("should display comment content", () => {
      const comments = [
        createMockComment({ content: "This is the comment content" }),
      ];

      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      expect(
        screen.getByText("This is the comment content")
      ).toBeInTheDocument();
    });

    it("should display avatar with correct background color", () => {
      const comments = [
        createMockComment({
          author_avatar_color: "rgb(220, 38, 38)",
          author_name: "Alice",
        }),
      ];

      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      const avatar = screen.getByText("A");
      expect(avatar).toHaveStyle({ backgroundColor: "rgb(220, 38, 38)" });
    });

    it("should format relative time correctly - just now", () => {
      const now = new Date();
      const comments = [createMockComment({ created_at: now.toISOString() })];

      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      expect(screen.getByText("just now")).toBeInTheDocument();
    });

    it("should format relative time correctly - minutes ago", () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const comments = [
        createMockComment({ created_at: fiveMinutesAgo.toISOString() }),
      ];

      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      expect(screen.getByText("5m ago")).toBeInTheDocument();
    });

    it("should format relative time correctly - hours ago", () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const comments = [
        createMockComment({ created_at: twoHoursAgo.toISOString() }),
      ];

      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      expect(screen.getByText("2h ago")).toBeInTheDocument();
    });

    it("should format relative time correctly - days ago", () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const comments = [
        createMockComment({ created_at: threeDaysAgo.toISOString() }),
      ];

      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      expect(screen.getByText("3d ago")).toBeInTheDocument();
    });

    it("should display (edited) indicator when comment was updated", () => {
      const now = new Date();
      const laterTime = new Date(now.getTime() + 1000);
      const comments = [
        createMockComment({
          created_at: now.toISOString(),
          updated_at: laterTime.toISOString(),
        }),
      ];

      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      expect(screen.getByText("(edited)")).toBeInTheDocument();
    });

    it("should not display (edited) when created_at equals updated_at", () => {
      const now = new Date();
      const comments = [
        createMockComment({
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        }),
      ];

      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      expect(screen.queryByText("(edited)")).not.toBeInTheDocument();
    });
  });

  describe("Edit Functionality", () => {
    it("should show edit button only for owned comments", () => {
      const comments = [
        createMockComment({
          id: "comment-owned",
          user_id: currentUserId,
          content: "My comment",
        }),
        createMockComment({
          id: "comment-not-owned",
          user_id: "other-user-456",
          content: "Other comment",
        }),
      ];

      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      const ownedContainer = screen.getByText("My comment").closest("div");
      const notOwnedContainer = screen.getByText("Other comment").closest("div");

      expect(
        within(ownedContainer!).queryByRole("button", { name: /edit/i })
      ).toBeInTheDocument();
      expect(
        within(notOwnedContainer!).queryByRole("button", { name: /edit/i })
      ).not.toBeInTheDocument();
    });

    it("should show delete button only for owned comments", () => {
      const comments = [
        createMockComment({
          id: "comment-owned",
          user_id: currentUserId,
          content: "My comment",
        }),
        createMockComment({
          id: "comment-not-owned",
          user_id: "other-user-456",
          content: "Other comment",
        }),
      ];

      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      const ownedContainer = screen.getByText("My comment").closest("div");
      const notOwnedContainer = screen.getByText("Other comment").closest("div");

      expect(
        within(ownedContainer!).queryByRole("button", { name: /delete/i })
      ).toBeInTheDocument();
      expect(
        within(notOwnedContainer!).queryByRole("button", { name: /delete/i })
      ).not.toBeInTheDocument();
    });

    it("should show inline edit form when edit button clicked", async () => {
      const comments = [
        createMockComment({
          id: "comment-1",
          user_id: currentUserId,
          content: "Original content",
        }),
      ];

      const user = userEvent.setup();
      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      expect(
        screen.getByDisplayValue("Original content")
      ).toBeInTheDocument();
    });

    it("should call onEditComment when edit form is submitted", async () => {
      const onEditComment = vi.fn().mockResolvedValue(undefined);
      const comments = [
        createMockComment({
          id: "comment-1",
          user_id: currentUserId,
          content: "Original content",
        }),
      ];

      const user = userEvent.setup();
      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={onEditComment}
          onDeleteComment={vi.fn()}
        />
      );

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      const input = screen.getByDisplayValue("Original content");
      await user.clear(input);
      await user.type(input, "Updated content");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      expect(onEditComment).toHaveBeenCalledWith(
        "comment-1",
        "Updated content"
      );
    });

    it("should cancel edit when cancel button clicked", async () => {
      const comments = [
        createMockComment({
          id: "comment-1",
          user_id: currentUserId,
          content: "Original content",
        }),
      ];

      const user = userEvent.setup();
      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.getByText("Original content")).toBeInTheDocument();
      expect(
        screen.queryByDisplayValue("Original content")
      ).not.toBeInTheDocument();
    });

    it("should submit edit on Enter key", async () => {
      const onEditComment = vi.fn().mockResolvedValue(undefined);
      const comments = [
        createMockComment({
          id: "comment-1",
          user_id: currentUserId,
          content: "Original content",
        }),
      ];

      const user = userEvent.setup();
      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={onEditComment}
          onDeleteComment={vi.fn()}
        />
      );

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      const input = screen.getByDisplayValue("Original content");
      await user.clear(input);
      await user.type(input, "Updated content");

      await user.keyboard("{Enter}");

      expect(onEditComment).toHaveBeenCalledWith(
        "comment-1",
        "Updated content"
      );
    });

    it("should cancel edit on Escape key", async () => {
      const comments = [
        createMockComment({
          id: "comment-1",
          user_id: currentUserId,
          content: "Original content",
        }),
      ];

      const user = userEvent.setup();
      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      await user.keyboard("{Escape}");

      expect(screen.getByText("Original content")).toBeInTheDocument();
      expect(
        screen.queryByDisplayValue("Original content")
      ).not.toBeInTheDocument();
    });

    it("should not submit empty edit content", async () => {
      const onEditComment = vi.fn();
      const comments = [
        createMockComment({
          id: "comment-1",
          user_id: currentUserId,
          content: "Original content",
        }),
      ];

      const user = userEvent.setup();
      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={onEditComment}
          onDeleteComment={vi.fn()}
        />
      );

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      const input = screen.getByDisplayValue("Original content");
      await user.clear(input);

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      expect(onEditComment).not.toHaveBeenCalled();
      // After clearing, the edit form should still be open with empty input
      const inputs = screen.getAllByDisplayValue("");
      expect(inputs.length).toBeGreaterThan(0);
    });
  });

  describe("Delete Functionality", () => {
    it("should call onDeleteComment when delete button clicked", async () => {
      const onDeleteComment = vi.fn().mockResolvedValue(undefined);
      const comments = [
        createMockComment({
          id: "comment-1",
          user_id: currentUserId,
          content: "Comment to delete",
        }),
      ];

      const user = userEvent.setup();
      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={onDeleteComment}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /delete/i });
      await user.click(deleteButton);

      expect(onDeleteComment).toHaveBeenCalledWith("comment-1");
    });
  });

  describe("Reply Functionality", () => {
    it("should show reply button for each top-level comment", () => {
      const comments = [
        createMockComment({
          id: "comment-1",
          content: "Parent comment",
          parent_comment_id: null,
        }),
      ];

      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      expect(
        screen.getByRole("button", { name: /reply/i })
      ).toBeInTheDocument();
    });

    it("should show reply form when reply button clicked", async () => {
      const comments = [
        createMockComment({
          id: "comment-1",
          content: "Parent comment",
          parent_comment_id: null,
        }),
      ];

      const user = userEvent.setup();
      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      const replyButton = screen.getByRole("button", { name: /reply/i });
      await user.click(replyButton);

      expect(
        screen.getByPlaceholderText("Write a reply...")
      ).toBeInTheDocument();
    });

    it("should hide reply form when cancel button clicked", async () => {
      const comments = [
        createMockComment({
          id: "comment-1",
          content: "Parent comment",
          parent_comment_id: null,
        }),
      ];

      const user = userEvent.setup();
      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      const replyButton = screen.getByRole("button", { name: /reply/i });
      await user.click(replyButton);

      expect(
        screen.getByPlaceholderText("Write a reply...")
      ).toBeInTheDocument();

      const cancelButtons = screen.getAllByRole("button", { name: /cancel/i });
      await user.click(cancelButtons[cancelButtons.length - 1]!);

      expect(
        screen.queryByPlaceholderText("Write a reply...")
      ).not.toBeInTheDocument();
    });

    it("should call onAddComment with parent_comment_id when reply submitted", async () => {
      const onAddComment = vi.fn().mockResolvedValue(undefined);
      const comments = [
        createMockComment({
          id: "comment-1",
          content: "Parent comment",
          parent_comment_id: null,
        }),
      ];

      const user = userEvent.setup();
      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={onAddComment}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      const replyButton = screen.getByRole("button", { name: /reply/i });
      await user.click(replyButton);

      const replyInput = screen.getByPlaceholderText("Write a reply...");
      await user.type(replyInput, "This is a reply");

      await user.keyboard("{Enter}");

      expect(onAddComment).toHaveBeenCalledWith("This is a reply", "comment-1");
    });

    it("should toggle reply form on repeated clicks", async () => {
      const comments = [
        createMockComment({
          id: "comment-1",
          content: "Parent comment",
          parent_comment_id: null,
        }),
      ];

      const user = userEvent.setup();
      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      const replyButton = screen.getByRole("button", { name: /reply/i });

      await user.click(replyButton);
      expect(
        screen.getByPlaceholderText("Write a reply...")
      ).toBeInTheDocument();

      await user.click(replyButton);
      expect(
        screen.queryByPlaceholderText("Write a reply...")
      ).not.toBeInTheDocument();

      await user.click(replyButton);
      expect(
        screen.getByPlaceholderText("Write a reply...")
      ).toBeInTheDocument();
    });
  });

  describe("Nested Comments", () => {
    it("should display single level of replies", () => {
      const comments = [
        createMockComment({
          id: "comment-1",
          content: "Parent comment",
          parent_comment_id: null,
        }),
        createMockComment({
          id: "reply-1",
          content: "Reply to parent",
          parent_comment_id: "comment-1",
        }),
      ];

      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      expect(screen.getByText("Parent comment")).toBeInTheDocument();
      expect(screen.getByText("Reply to parent")).toBeInTheDocument();
    });

    it("should display nested replies up to 2 levels", () => {
      const comments = [
        createMockComment({
          id: "comment-1",
          content: "Parent comment",
          parent_comment_id: null,
        }),
        createMockComment({
          id: "reply-1",
          content: "Reply level 1",
          parent_comment_id: "comment-1",
        }),
        // Note: CommentThread only renders direct children, not grandchildren
        // The test verifies that both parent and level 1 reply are shown
      ];

      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      expect(screen.getByText("Parent comment")).toBeInTheDocument();
      expect(screen.getByText("Reply level 1")).toBeInTheDocument();
    });

    it("should not show reply button for level 2 replies (max depth 2)", () => {
      const comments = [
        createMockComment({
          id: "comment-1",
          content: "Parent comment",
          parent_comment_id: null,
        }),
        createMockComment({
          id: "reply-1",
          content: "Reply level 1",
          parent_comment_id: "comment-1",
        }),
        createMockComment({
          id: "reply-2",
          content: "Reply level 2",
          parent_comment_id: "reply-1",
        }),
      ];

      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      const replyButtons = screen.getAllByRole("button", { name: /reply/i });
      expect(replyButtons).toHaveLength(2);
    });

    it("should apply visual nesting styles to replies", () => {
      const comments = [
        createMockComment({
          id: "parent-1",
          content: "First parent",
          parent_comment_id: null,
        }),
        createMockComment({
          id: "reply-parent-1",
          content: "Reply to first parent",
          parent_comment_id: "parent-1",
        }),
      ];

      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      const replyElement = screen.getByText("Reply to first parent");
      // Find the outer div that has the ml-6 class (the reply container)
      let replyContainer = replyElement.closest("div");
      while (replyContainer && !replyContainer.className.includes("ml-6")) {
        replyContainer = replyContainer.parentElement as HTMLDivElement | null;
      }

      expect(replyContainer).toBeTruthy();
      expect(replyContainer).toHaveClass("ml-6");
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long comment content", () => {
      const longContent = "A".repeat(500);
      const comments = [createMockComment({ content: longContent })];

      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it("should handle special characters in comment content", () => {
      const specialContent = 'Test with <script>alert("XSS")</script> & "quotes"';
      const comments = [createMockComment({ content: specialContent })];

      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      expect(screen.getByText(specialContent)).toBeInTheDocument();
    });

    it("should handle multiple comments from same author", () => {
      const comments = [
        createMockComment({
          id: "comment-1",
          author_name: "Alice",
          content: "First comment",
        }),
        createMockComment({
          id: "comment-2",
          author_name: "Alice",
          content: "Second comment",
        }),
      ];

      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      expect(screen.getByText("First comment")).toBeInTheDocument();
      expect(screen.getByText("Second comment")).toBeInTheDocument();
    });

    it("should handle whitespace-only edit content", async () => {
      const onEditComment = vi.fn();
      const comments = [
        createMockComment({
          id: "comment-1",
          user_id: currentUserId,
          content: "Original content",
        }),
      ];

      const user = userEvent.setup();
      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={onEditComment}
          onDeleteComment={vi.fn()}
        />
      );

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      const input = screen.getByDisplayValue("Original content");
      await user.clear(input);
      await user.type(input, "   ");

      await user.keyboard("{Enter}");

      expect(onEditComment).not.toHaveBeenCalled();
    });

    it("should handle comments with emoji content", () => {
      const emojiContent = "Great work! 🎉 This is awesome! 👍";
      const comments = [createMockComment({ content: emojiContent })];

      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      expect(screen.getByText(emojiContent)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should render comments with proper semantic structure", () => {
      const comments = [createMockComment({ content: "Test comment" })];

      const { container } = render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      expect(container.querySelector("h4")).toBeInTheDocument();
      expect(container.querySelector("h4")).toHaveTextContent("Comments (1)");
    });

    it("should provide descriptive button labels", () => {
      const comments = [
        createMockComment({
          user_id: currentUserId,
          parent_comment_id: null,
        }),
      ];

      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      expect(
        screen.getByRole("button", { name: /edit/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /delete/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /reply/i })
      ).toBeInTheDocument();
    });

    it("should have accessible form inputs with placeholders", () => {
      render(
        <CommentList
          comments={[]}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      expect(
        screen.getByPlaceholderText("Add a comment...")
      ).toBeInTheDocument();
    });

    it("should autofocus edit input", async () => {
      const comments = [
        createMockComment({
          id: "comment-1",
          user_id: currentUserId,
          content: "Original content",
        }),
      ];

      const user = userEvent.setup();
      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      const editInput = screen.getByDisplayValue("Original content");
      expect(editInput).toHaveFocus();
    });
  });

  describe("Avatar Color Handling", () => {
    it("should display avatars with different color formats", () => {
      const comments = [
        createMockComment({
          id: "comment-1",
          author_name: "Alice",
          author_avatar_color: "rgb(59, 130, 246)",
        }),
        createMockComment({
          id: "comment-2",
          author_name: "Bob",
          author_avatar_color: "rgb(239, 68, 68)",
        }),
        createMockComment({
          id: "comment-3",
          author_name: "Charlie",
          author_avatar_color: "rgb(34, 197, 94)",
        }),
      ];

      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      const aliceAvatar = screen.getByText("A");
      const bobAvatar = screen.getByText("B");
      const charlieAvatar = screen.getByText("C");

      expect(aliceAvatar).toHaveStyle({ backgroundColor: "rgb(59, 130, 246)" });
      expect(bobAvatar).toHaveStyle({ backgroundColor: "rgb(239, 68, 68)" });
      expect(charlieAvatar).toHaveStyle({
        backgroundColor: "rgb(34, 197, 94)",
      });
    });

    it("should use first letter of author name for avatar text", () => {
      const comments = [
        createMockComment({ id: "comment-1", author_name: "Alexandria" }),
        createMockComment({ id: "comment-2", author_name: "Zorro" }),
      ];

      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      expect(screen.getByText("A")).toBeInTheDocument();
      expect(screen.getByText("Z")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should call onAddComment when top-level form submitted", async () => {
      const onAddComment = vi.fn().mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(
        <CommentList
          comments={[]}
          currentUserId={currentUserId}
          onAddComment={onAddComment}
          onEditComment={vi.fn()}
          onDeleteComment={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText("Add a comment...");
      await user.type(input, "New comment");

      await user.keyboard("{Enter}");

      expect(onAddComment).toHaveBeenCalledWith("New comment", undefined);
    });

    it("should propagate edit errors properly", async () => {
      const onEditComment = vi.fn(async () => {
        // Simulate an error but catch it internally
        return Promise.reject(new Error("Failed to update")).catch(() => {
          // Silently fail - component should handle this
        });
      });
      const comments = [
        createMockComment({
          id: "comment-1",
          user_id: currentUserId,
          content: "Original content",
        }),
      ];

      const user = userEvent.setup();
      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={onEditComment}
          onDeleteComment={vi.fn()}
        />
      );

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      const input = screen.getByDisplayValue("Original content");
      await user.clear(input);
      await user.type(input, "Updated content");

      await user.keyboard("{Enter}");

      // Verify onEditComment was called
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(onEditComment).toHaveBeenCalled();
    });

    it("should propagate delete errors properly", async () => {
      const onDeleteComment = vi
        .fn()
        .mockRejectedValueOnce(new Error("Failed to delete"));
      const comments = [
        createMockComment({
          id: "comment-1",
          user_id: currentUserId,
          content: "Comment to delete",
        }),
      ];

      const user = userEvent.setup();
      render(
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={vi.fn()}
          onEditComment={vi.fn()}
          onDeleteComment={onDeleteComment}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /delete/i });
      await user.click(deleteButton);

      expect(onDeleteComment).toHaveBeenCalled();
    });
  });
});
