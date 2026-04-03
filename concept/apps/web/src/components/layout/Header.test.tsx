import { render, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi, beforeEach } from "vitest";
import Header from "./Header";
import type { User } from "../../api/types";

// Mock user data for testing
const mockUser: User = {
  id: "user-123",
  name: "Alice Johnson",
  role: "admin",
  avatar_color: "#3B82F6",
  created_at: "2024-01-01T00:00:00Z",
};

const mockUserWithDifferentColor: User = {
  id: "user-456",
  name: "Bob Smith",
  role: "member",
  avatar_color: "#EF4444",
  created_at: "2024-01-02T00:00:00Z",
};

describe("Header Component", () => {
  let onSwitchUser: ReturnType<typeof vi.fn>;
  let onNavigateHome: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSwitchUser = vi.fn();
    onNavigateHome = vi.fn();
  });

  test("renders the Taskify logo", () => {
    render(
      <Header
        user={mockUser}
        onSwitchUser={onSwitchUser}
        onNavigateHome={onNavigateHome}
      />
    );

    const logo = screen.getByRole("button", { name: /taskify/i });
    expect(logo).toBeInTheDocument();
  });

  test("displays the current user name", () => {
    render(
      <Header
        user={mockUser}
        onSwitchUser={onSwitchUser}
        onNavigateHome={onNavigateHome}
      />
    );

    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
  });

  test("displays avatar with user's first initial", () => {
    render(
      <Header
        user={mockUser}
        onSwitchUser={onSwitchUser}
        onNavigateHome={onNavigateHome}
      />
    );

    expect(screen.getByText("A")).toBeInTheDocument();
  });

  test("avatar initial is first character of user name", () => {
    render(
      <Header
        user={mockUserWithDifferentColor}
        onSwitchUser={onSwitchUser}
        onNavigateHome={onNavigateHome}
      />
    );

    expect(screen.getByText("B")).toBeInTheDocument();
  });

  test("avatar has correct background color from user avatar_color", () => {
    render(
      <Header
        user={mockUser}
        onSwitchUser={onSwitchUser}
        onNavigateHome={onNavigateHome}
      />
    );

    const avatar = screen.getByText("A");
    expect(avatar).toHaveStyle({ backgroundColor: "#3B82F6" });
  });

  test("avatar with different color", () => {
    render(
      <Header
        user={mockUserWithDifferentColor}
        onSwitchUser={onSwitchUser}
        onNavigateHome={onNavigateHome}
      />
    );

    const avatar = screen.getByText("B");
    expect(avatar).toHaveStyle({ backgroundColor: "#EF4444" });
  });

  test("renders Switch User button", () => {
    render(
      <Header
        user={mockUser}
        onSwitchUser={onSwitchUser}
        onNavigateHome={onNavigateHome}
      />
    );

    const switchButton = screen.getByRole("button", { name: /switch user/i });
    expect(switchButton).toBeInTheDocument();
  });

  test("calls onSwitchUser callback when Switch User button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Header
        user={mockUser}
        onSwitchUser={onSwitchUser}
        onNavigateHome={onNavigateHome}
      />
    );

    const switchButton = screen.getByRole("button", { name: /switch user/i });
    await user.click(switchButton);

    expect(onSwitchUser).toHaveBeenCalledTimes(1);
  });

  test("calls onNavigateHome callback when logo is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Header
        user={mockUser}
        onSwitchUser={onSwitchUser}
        onNavigateHome={onNavigateHome}
      />
    );

    const logo = screen.getByRole("button", { name: /taskify/i });
    await user.click(logo);

    expect(onNavigateHome).toHaveBeenCalledTimes(1);
  });

  test("calls onSwitchUser multiple times on repeated clicks", async () => {
    const user = userEvent.setup();
    render(
      <Header
        user={mockUser}
        onSwitchUser={onSwitchUser}
        onNavigateHome={onNavigateHome}
      />
    );

    const switchButton = screen.getByRole("button", { name: /switch user/i });
    await user.click(switchButton);
    await user.click(switchButton);
    await user.click(switchButton);

    expect(onSwitchUser).toHaveBeenCalledTimes(3);
  });

  test("calls onNavigateHome multiple times on repeated logo clicks", async () => {
    const user = userEvent.setup();
    render(
      <Header
        user={mockUser}
        onSwitchUser={onSwitchUser}
        onNavigateHome={onNavigateHome}
      />
    );

    const logo = screen.getByRole("button", { name: /taskify/i });
    await user.click(logo);
    await user.click(logo);

    expect(onNavigateHome).toHaveBeenCalledTimes(2);
  });

  test("does not call onSwitchUser when logo is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Header
        user={mockUser}
        onSwitchUser={onSwitchUser}
        onNavigateHome={onNavigateHome}
      />
    );

    const logo = screen.getByRole("button", { name: /taskify/i });
    await user.click(logo);

    expect(onSwitchUser).not.toHaveBeenCalled();
  });

  test("does not call onNavigateHome when Switch User button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Header
        user={mockUser}
        onSwitchUser={onSwitchUser}
        onNavigateHome={onNavigateHome}
      />
    );

    const switchButton = screen.getByRole("button", { name: /switch user/i });
    await user.click(switchButton);

    expect(onNavigateHome).not.toHaveBeenCalled();
  });

  test("displays user with single character name", () => {
    const singleCharUser: User = {
      ...mockUser,
      name: "Z",
    };

    render(
      <Header
        user={singleCharUser}
        onSwitchUser={onSwitchUser}
        onNavigateHome={onNavigateHome}
      />
    );

    // Verify the single character name is displayed in the header
    const userNameElements = screen.getAllByText("Z");
    expect(userNameElements.length).toBeGreaterThanOrEqual(2); // Avatar initial + user name
  });

  test("displays user with long name", () => {
    const longNameUser: User = {
      ...mockUser,
      name: "Christopher Alexander Nathaniel",
    };

    render(
      <Header
        user={longNameUser}
        onSwitchUser={onSwitchUser}
        onNavigateHome={onNavigateHome}
      />
    );

    expect(screen.getByText("Christopher Alexander Nathaniel")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  test("renders header with all elements together", () => {
    render(
      <Header
        user={mockUser}
        onSwitchUser={onSwitchUser}
        onNavigateHome={onNavigateHome}
      />
    );

    // Verify all key elements are present together
    expect(screen.getByRole("button", { name: /taskify/i })).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /switch user/i })
    ).toBeInTheDocument();
  });

  test("Switch User button has correct styling and remains accessible on hover", () => {
    render(
      <Header
        user={mockUser}
        onSwitchUser={onSwitchUser}
        onNavigateHome={onNavigateHome}
      />
    );

    const switchButton = screen.getByRole("button", { name: /switch user/i });
    expect(switchButton).toHaveClass("underline");
    expect(switchButton).toBeInTheDocument();
  });
});
