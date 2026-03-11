import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../test/test-utils";
import Header from "./Header";
import type { User } from "../../api/types";

const mockUser: User = {
  id: "1",
  name: "Alice Johnson",
  role: "Developer",
  avatar_color: "#4F46E5",
  created_at: "2024-01-01T00:00:00Z",
};

describe("Header", () => {
  it("renders user name and avatar initial", () => {
    render(
      <Header user={mockUser} onSwitchUser={() => {}} onNavigateHome={() => {}} />
    );

    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renders Taskify brand text", () => {
    render(
      <Header user={mockUser} onSwitchUser={() => {}} onNavigateHome={() => {}} />
    );

    expect(screen.getByText("Taskify")).toBeInTheDocument();
  });

  it("calls onSwitchUser when Switch User is clicked", async () => {
    const onSwitchUser = vi.fn();
    const { user } = render(
      <Header user={mockUser} onSwitchUser={onSwitchUser} onNavigateHome={() => {}} />
    );

    await user.click(screen.getByText("Switch User"));
    expect(onSwitchUser).toHaveBeenCalledOnce();
  });

  it("calls onNavigateHome when Taskify is clicked", async () => {
    const onNavigateHome = vi.fn();
    const { user } = render(
      <Header user={mockUser} onSwitchUser={() => {}} onNavigateHome={onNavigateHome} />
    );

    await user.click(screen.getByText("Taskify"));
    expect(onNavigateHome).toHaveBeenCalledOnce();
  });
});
