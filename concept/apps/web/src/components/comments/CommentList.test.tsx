import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "../../test/test-utils";
import CommentList from "./CommentList";
import type { Comment } from "../../api/types";

const baseComments: Comment[] = [
  {
    id: "1",
    task_id: "task-1",
    user_id: "user-1",
    parent_comment_id: null,
    content: "Top-level comment",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    author_name: "Alice Johnson",
    author_avatar_color: "#4F46E5",
  },
  {
    id: "2",
    task_id: "task-1",
    user_id: "user-2",
    parent_comment_id: "1",
    content: "Reply comment",
    created_at: "2024-01-01T00:05:00Z",
    updated_at: "2024-01-01T00:05:00Z",
    author_name: "Bob Smith",
    author_avatar_color: "#059669",
  },
];

describe("CommentList", () => {
  it("shows the empty state when there are no comments", () => {
    render(
      <CommentList
        comments={[]}
        currentUserId="user-1"
        onAddComment={vi.fn().mockResolvedValue(undefined)}
        onEditComment={vi.fn().mockResolvedValue(undefined)}
        onDeleteComment={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.getByText(/Comments \(0\)/)).toBeInTheDocument();
    expect(screen.getByText(/No comments yet/i)).toBeInTheDocument();
  });

  it("submits a reply with the parent comment id", async () => {
    const onAddComment = vi.fn().mockResolvedValue(undefined);
    const { user } = render(
      <CommentList
        comments={baseComments}
        currentUserId="user-1"
        onAddComment={onAddComment}
        onEditComment={vi.fn().mockResolvedValue(undefined)}
        onDeleteComment={vi.fn().mockResolvedValue(undefined)}
      />
    );

    const topLevelComment = screen.getByText(baseComments[0]!.content).closest("div");
    expect(topLevelComment).not.toBeNull();

    await user.click(
      within(topLevelComment as HTMLDivElement).getByRole("button", { name: "Reply" })
    );
    const replyInput = screen.getByPlaceholderText("Write a reply...");
    await user.type(replyInput, "  Thanks for the update  ");
    await user.click(
      within(replyInput.closest("form") as HTMLFormElement).getByRole("button", {
        name: "Send",
      })
    );

    expect(onAddComment).toHaveBeenCalledWith("Thanks for the update", "1");
  });

  it("allows the author to edit and delete their own comment", async () => {
    const onEditComment = vi.fn().mockResolvedValue(undefined);
    const onDeleteComment = vi.fn().mockResolvedValue(undefined);
    const { user } = render(
      <CommentList
        comments={baseComments}
        currentUserId="user-1"
        onAddComment={vi.fn().mockResolvedValue(undefined)}
        onEditComment={onEditComment}
        onDeleteComment={onDeleteComment}
      />
    );

    const topLevelComment = screen.getByText(baseComments[0]!.content).closest("div");
    expect(topLevelComment).not.toBeNull();

    await user.click(
      within(topLevelComment as HTMLDivElement).getByRole("button", { name: "Edit" })
    );
    const input = screen.getByDisplayValue(baseComments[0]!.content);
    await user.clear(input);
    await user.type(input, "  Edited by author  ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onEditComment).toHaveBeenCalledWith("1", "Edited by author");

    await user.click(
      within(topLevelComment as HTMLDivElement).getByRole("button", { name: "Delete" })
    );
    expect(onDeleteComment).toHaveBeenCalledWith("1");
  });
});
