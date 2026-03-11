import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import UserSelect from "./UserSelect";
import { mockUsers } from "../../test/mock-api";
import { fetchUsers } from "../../api/client";

vi.mock("../../api/client", () => ({
  fetchUsers: vi.fn(),
}));

const mockedFetchUsers = vi.mocked(fetchUsers);

describe("UserSelect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedFetchUsers.mockResolvedValue(mockUsers);
  });

  it("shows loading state initially", () => {
    render(<UserSelect onSelectUser={() => {}} />);

    expect(screen.getByText("Loading users...")).toBeInTheDocument();
  });

  it("renders user cards after loading", async () => {
    render(<UserSelect onSelectUser={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    });
    expect(screen.getByText("Bob Smith")).toBeInTheDocument();
  });

  it("calls onSelectUser with the correct user when a card is clicked", async () => {
    const onSelectUser = vi.fn();
    const { user } = render(<UserSelect onSelectUser={onSelectUser} />);

    await waitFor(() => {
      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Alice Johnson"));
    expect(onSelectUser).toHaveBeenCalledWith(mockUsers[0]);
  });

  it("shows error message when API call fails", async () => {
    mockedFetchUsers.mockRejectedValue(new Error("Network error"));

    render(<UserSelect onSelectUser={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load users: Network error/)).toBeInTheDocument();
    });
  });

  it("shows retry button on error", async () => {
    mockedFetchUsers.mockRejectedValue(new Error("Network error"));

    render(<UserSelect onSelectUser={() => {}} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    });
  });
});
