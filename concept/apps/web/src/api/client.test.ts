import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchUsers,
  createProject,
  createComment,
  fetchProjects,
} from "./client";

const originalFetch = globalThis.fetch;

function mockFetch(response: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: "Error",
    json: () => Promise.resolve(response),
  });
}

describe("API Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetchUsers makes GET request to /api/users", async () => {
    const users = [{ id: "1", name: "Alice" }];
    globalThis.fetch = mockFetch(users);

    const result = await fetchUsers();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/users",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
    expect(result).toEqual(users);
  });

  it("createProject makes POST request with body", async () => {
    const project = { id: "1", name: "New Project" };
    globalThis.fetch = mockFetch(project);

    const result = await createProject({ name: "New Project", description: "Desc" });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/projects",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "New Project", description: "Desc" }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
    expect(result).toEqual(project);
  });

  it("throws Error with message from error response", async () => {
    globalThis.fetch = mockFetch(
      { error: { message: "Not found" } },
      false,
      404
    );

    await expect(fetchProjects()).rejects.toThrow("Not found");
  });

  it("throws generic HTTP error when no error message in body", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.reject(new Error("parse error")),
    });

    await expect(fetchProjects()).rejects.toThrow("Internal Server Error");
  });

  it("createComment includes X-User-Id header", async () => {
    const comment = { id: "1", content: "Hello" };
    globalThis.fetch = mockFetch(comment);

    await createComment("task-1", "user-42", { content: "Hello" });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/tasks/task-1/comments",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ content: "Hello" }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-User-Id": "user-42",
        }),
      })
    );
  });
});
