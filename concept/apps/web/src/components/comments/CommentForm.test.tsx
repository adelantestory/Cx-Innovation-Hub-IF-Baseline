import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../test/test-utils";
import CommentForm from "./CommentForm";

describe("CommentForm", () => {
  it("renders input with placeholder text", () => {
    render(<CommentForm onSubmit={vi.fn()} placeholder="Write something..." />);

    expect(screen.getByPlaceholderText("Write something...")).toBeInTheDocument();
  });

  it("renders default placeholder when none provided", () => {
    render(<CommentForm onSubmit={vi.fn()} />);

    expect(screen.getByPlaceholderText("Add a comment...")).toBeInTheDocument();
  });

  it("submit button is disabled when input is empty", () => {
    render(<CommentForm onSubmit={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("calls onSubmit with trimmed content on form submit", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { user } = render(<CommentForm onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("Add a comment..."), "  Hello world  ");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(onSubmit).toHaveBeenCalledWith("Hello world", undefined);
  });

  it("clears input after successful submit", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { user } = render(<CommentForm onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText("Add a comment...");
    await user.type(input, "Hello world");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(input).toHaveValue("");
  });

  it("shows Cancel button when onCancel prop is provided", () => {
    render(<CommentForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("does not show Cancel button when onCancel prop is not provided", () => {
    render(<CommentForm onSubmit={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("calls onCancel when Cancel button is clicked", async () => {
    const onCancel = vi.fn();
    const { user } = render(<CommentForm onSubmit={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("does not call onSubmit if input is only whitespace", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { user } = render(<CommentForm onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("Add a comment..."), "   ");
    // Button should still be disabled because content.trim() is empty
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });
});
