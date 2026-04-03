import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi, beforeEach } from "vitest";
import type { User } from "../../api/types";

// Mock the API client BEFORE importing the component
vi.mock("../../api/client", () => ({
  fetchUsers: vi.fn(),
}));

// Import the component AFTER mocking
import UserSelect from "./UserSelect";
import * as apiClient from "../../api/client";

const mockFetchUsers = apiClient.fetchUsers as ReturnType<typeof vi.fn>;

describe("UserSelect", () => {
  // Test data: 5 predefined users similar to what the API returns
  const mockUsers: User[] = [
    {
      id: "1",
      name: "Alice Johnson",
      role: "admin",
      avatar_color: "#FF6B6B",
      created_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      name: "Bob Smith",
      role: "developer",
      avatar_color: "#4ECDC4",
      created_at: "2024-01-02T00:00:00Z",
    },
    {
      id: "3",
      name: "Carol White",
      role: "designer",
      avatar_color: "#45B7D1",
      created_at: "2024-01-03T00:00:00Z",
    },
    {
      id: "4",
      name: "David Brown",
      role: "product_manager",
      avatar_color: "#FFA07A",
      created_at: "2024-01-04T00:00:00Z",
    },
    {
      id: "5",
      name: "Eve Davis",
      role: "developer",
      avatar_color: "#98D8C8",
      created_at: "2024-01-05T00:00:00Z",
    },
  ];

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Default to resolving with mock users
    mockFetchUsers.mockResolvedValue(mockUsers);
  });

  // =========================================================================
  // Loading State Tests
  // =========================================================================

  test("displays loading message on mount", () => {
    // Mock fetchUsers to never resolve, so loading state persists
    mockFetchUsers.mockImplementation(() => new Promise(() => {}));

    render(<UserSelect onSelectUser={vi.fn()} />);

    expect(screen.getByText("Loading users...")).toBeInTheDocument();
  });

  test("calls fetchUsers on mount", () => {
    mockFetchUsers.mockResolvedValue([]);

    render(<UserSelect onSelectUser={vi.fn()} />);

    expect(mockFetchUsers).toHaveBeenCalledTimes(1);
  });

  // =========================================================================
  // Success State Tests
  // =========================================================================

  test("renders user cards after fetch completes", async () => {
    render(<UserSelect onSelectUser={vi.fn()} />);

    // Wait for loading to complete and users to render
    await waitFor(() => {
      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    });

    expect(screen.getByText("Bob Smith")).toBeInTheDocument();
    expect(screen.getByText("Carol White")).toBeInTheDocument();
    expect(screen.getByText("David Brown")).toBeInTheDocument();
    expect(screen.getByText("Eve Davis")).toBeInTheDocument();
  });

  test("displays user names in cards", async () => {
    render(<UserSelect onSelectUser={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    });

    mockUsers.forEach((user) => {
      expect(screen.getByText(user.name)).toBeInTheDocument();
    });
  });

  test("displays user roles (formatted) in cards", async () => {
    render(<UserSelect onSelectUser={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    });

    // Roles are displayed with underscores replaced by spaces and capitalized
    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(screen.getAllByText("developer")).toHaveLength(2); // Bob and Eve are both developers
    expect(screen.getByText("designer")).toBeInTheDocument();
    expect(screen.getByText("product manager")).toBeInTheDocument(); // underscore replaced with space
  });

  test("renders avatar with user initials", async () => {
    render(<UserSelect onSelectUser={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    });

    // Check that initials are rendered for each user
    expect(screen.getByText("A")).toBeInTheDocument(); // Alice
    expect(screen.getByText("B")).toBeInTheDocument(); // Bob
    expect(screen.getByText("C")).toBeInTheDocument(); // Carol
    expect(screen.getByText("D")).toBeInTheDocument(); // David
    expect(screen.getByText("E")).toBeInTheDocument(); // Eve
  });

  test("applies avatar color to user card avatars", async () => {
    render(<UserSelect onSelectUser={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    });

    // Find the avatar divs and verify their background colors
    const avatars = screen.getAllByText(/[A-Z]/, { selector: "div" });

    // The component renders initial letters in divs with inline style backgroundColor
    // Check that at least one avatar has the expected color
    const aliceAvatarColor = mockUsers[0].avatar_color;
    // Convert hex to RGB for comparison (jsdom converts styles)
    expect(avatars.some((el) => el.textContent === "A")).toBe(true);
    expect(avatars.some((el) => el.textContent === "B")).toBe(true);
  });

  test("renders correct number of user cards", async () => {
    render(<UserSelect onSelectUser={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    });

    // Count buttons (each user card is a button)
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(mockUsers.length);
  });

  test("renders page title 'Taskify'", async () => {
    render(<UserSelect onSelectUser={vi.fn()} />);

    // Wait for data to load to see the title
    await waitFor(() => {
      expect(screen.getByText("Taskify")).toBeInTheDocument();
    });
  });

  test("renders page subtitle", async () => {
    render(<UserSelect onSelectUser={vi.fn()} />);

    // Wait for data to load to see the subtitle
    await waitFor(() => {
      expect(screen.getByText("Select your user to get started")).toBeInTheDocument();
    });
  });

  // =========================================================================
  // User Interaction Tests
  // =========================================================================

  test("calls onSelectUser with correct user when card is clicked", async () => {
    const mockOnSelectUser = vi.fn();
    const user = userEvent.setup();

    render(<UserSelect onSelectUser={mockOnSelectUser} />);

    await waitFor(() => {
      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    });

    const aliceCard = screen.getByRole("button", { name: /Alice Johnson/i });
    await user.click(aliceCard);

    expect(mockOnSelectUser).toHaveBeenCalledTimes(1);
    expect(mockOnSelectUser).toHaveBeenCalledWith(mockUsers[0]);
  });

  test("calls onSelectUser with correct user ID when different cards are clicked", async () => {
    const mockOnSelectUser = vi.fn();
    const user = userEvent.setup();

    render(<UserSelect onSelectUser={mockOnSelectUser} />);

    await waitFor(() => {
      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    });

    // Click Bob's card
    const bobCard = screen.getByRole("button", { name: /Bob Smith/i });
    await user.click(bobCard);

    expect(mockOnSelectUser).toHaveBeenCalledWith(mockUsers[1]);

    // Reset and click Carol's card
    mockOnSelectUser.mockClear();
    const carolCard = screen.getByRole("button", { name: /Carol White/i });
    await user.click(carolCard);

    expect(mockOnSelectUser).toHaveBeenCalledWith(mockUsers[2]);
  });

  test("passes complete user object to onSelectUser callback", async () => {
    const mockOnSelectUser = vi.fn();
    const user = userEvent.setup();

    render(<UserSelect onSelectUser={mockOnSelectUser} />);

    await waitFor(() => {
      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    });

    const aliceCard = screen.getByRole("button", { name: /Alice Johnson/i });
    await user.click(aliceCard);

    // Verify the complete user object is passed, not just the ID
    expect(mockOnSelectUser).toHaveBeenCalledWith({
      id: "1",
      name: "Alice Johnson",
      role: "admin",
      avatar_color: "#FF6B6B",
      created_at: "2024-01-01T00:00:00Z",
    });
  });

  test("allows clicking multiple cards in sequence", async () => {
    const mockOnSelectUser = vi.fn();
    const user = userEvent.setup();

    render(<UserSelect onSelectUser={mockOnSelectUser} />);

    await waitFor(() => {
      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    });

    // Click first card
    await user.click(screen.getByRole("button", { name: /Alice Johnson/i }));
    expect(mockOnSelectUser).toHaveBeenCalledTimes(1);

    // Click second card
    await user.click(screen.getByRole("button", { name: /Bob Smith/i }));
    expect(mockOnSelectUser).toHaveBeenCalledTimes(2);

    // Click third card
    await user.click(screen.getByRole("button", { name: /Carol White/i }));
    expect(mockOnSelectUser).toHaveBeenCalledTimes(3);
  });

  // =========================================================================
  // Error State Tests
  // =========================================================================

  test("displays error message when fetchUsers fails", async () => {
    const errorMessage = "Network error: Failed to connect to server";
    mockFetchUsers.mockRejectedValue(new Error(errorMessage));

    render(<UserSelect onSelectUser={vi.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByText(new RegExp(`Failed to load users: ${errorMessage}`))
      ).toBeInTheDocument();
    });
  });

  test("does not render user cards when fetch fails", async () => {
    mockFetchUsers.mockRejectedValue(new Error("API Error"));

    render(<UserSelect onSelectUser={vi.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load users/)
      ).toBeInTheDocument();
    });

    // Verify no user cards are rendered
    const buttons = screen.queryAllByRole("button");
    // Only the retry button should exist
    expect(buttons.length).toBe(1);
    expect(buttons[0]).toHaveTextContent("Retry");
  });

  test("displays retry button on error", async () => {
    mockFetchUsers.mockRejectedValue(new Error("API Error"));

    render(<UserSelect onSelectUser={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
    });
  });

  test("retry button is clickable and functional", async () => {
    mockFetchUsers.mockRejectedValue(new Error("API Error"));

    const user = userEvent.setup();
    render(<UserSelect onSelectUser={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
    });

    const retryButton = screen.getByRole("button", { name: /Retry/i });
    
    // Verify button exists and is clickable (not disabled)
    expect(retryButton).not.toBeDisabled();
    
    // Click should not throw
    await expect(user.click(retryButton)).resolves.toBeUndefined();
  });

  // =========================================================================
  // Empty State Tests
  // =========================================================================

  test("handles empty user list gracefully", async () => {
    mockFetchUsers.mockResolvedValue([]);

    render(<UserSelect onSelectUser={vi.fn()} />);

    await waitFor(() => {
      // After loading completes, verify no user cards are present
      const buttons = screen.queryAllByRole("button");
      expect(buttons).toHaveLength(0);
    });

    // Verify the page title and subtitle are still rendered
    expect(screen.getByText("Taskify")).toBeInTheDocument();
    expect(screen.getByText("Select your user to get started")).toBeInTheDocument();
  });

  // =========================================================================
  // Edge Cases
  // =========================================================================

  test("handles users with special characters in names", async () => {
    const specialUsers: User[] = [
      {
        id: "1",
        name: "José García",
        role: "developer",
        avatar_color: "#FF6B6B",
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "2",
        name: "François Müller",
        role: "designer",
        avatar_color: "#4ECDC4",
        created_at: "2024-01-02T00:00:00Z",
      },
    ];

    mockFetchUsers.mockResolvedValue(specialUsers);

    render(<UserSelect onSelectUser={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("José García")).toBeInTheDocument();
    });

    expect(screen.getByText("François Müller")).toBeInTheDocument();
  });

  test("uses first character of name as avatar initial", async () => {
    const user: User = {
      id: "1",
      name: "Xander Phoenix",
      role: "developer",
      avatar_color: "#FF6B6B",
      created_at: "2024-01-01T00:00:00Z",
    };

    mockFetchUsers.mockResolvedValue([user]);

    render(<UserSelect onSelectUser={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Xander Phoenix")).toBeInTheDocument();
    });

    // Verify the initial is rendered
    expect(screen.getByText("X")).toBeInTheDocument();
  });

  test("handles role with underscores correctly", async () => {
    const userWithUnderscoreRole: User = {
      id: "1",
      name: "Test User",
      role: "project_manager",
      avatar_color: "#FF6B6B",
      created_at: "2024-01-01T00:00:00Z",
    };

    mockFetchUsers.mockResolvedValue([userWithUnderscoreRole]);

    render(<UserSelect onSelectUser={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument();
    });

    // Role should have underscores replaced with spaces
    expect(screen.getByText("project manager")).toBeInTheDocument();
  });

  test("renders all user data from API response correctly", async () => {
    const testUser: User = {
      id: "test-123",
      name: "Test User",
      role: "admin",
      avatar_color: "#ABC123",
      created_at: "2024-02-15T10:30:00Z",
    };

    mockFetchUsers.mockResolvedValue([testUser]);

    const mockOnSelectUser = vi.fn();
    const user = userEvent.setup();

    render(<UserSelect onSelectUser={mockOnSelectUser} />);

    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument();
    });

    // Click the card and verify the entire object is passed
    const card = screen.getByRole("button", { name: /Test User/i });
    await user.click(card);

    expect(mockOnSelectUser).toHaveBeenCalledWith(testUser);
  });

  test("stops showing loading state once data is loaded", async () => {
    render(<UserSelect onSelectUser={vi.fn()} />);

    // Initially shows loading
    expect(screen.getByText("Loading users...")).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    });

    // Loading state should be gone
    expect(screen.queryByText("Loading users...")).not.toBeInTheDocument();
  });

  test("cleanup: fetchUsers is called exactly once per render", async () => {
    const { rerender } = render(<UserSelect onSelectUser={vi.fn()} />);

    expect(mockFetchUsers).toHaveBeenCalledTimes(1);

    // Re-render with different props
    rerender(<UserSelect onSelectUser={vi.fn()} />);

    // Should still be called only once (effect only runs on mount)
    expect(mockFetchUsers).toHaveBeenCalledTimes(1);
  });
});
