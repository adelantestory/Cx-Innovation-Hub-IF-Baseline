import type { TestCatalog } from "../types";

const API_BASE = "/api/tests";

export async function fetchTests(): Promise<TestCatalog> {
  const res = await fetch(API_BASE);
  if (!res.ok) {
    throw new Error(`Failed to fetch tests: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export function runTests(specFiles: string[], testNames?: string[], headed?: boolean): EventSource {
  const params = new URLSearchParams();
  params.set("specs", specFiles.join(","));
  if (testNames && testNames.length > 0) {
    params.set("tests", testNames.join(","));
  }
  if (headed) {
    params.set("headed", "true");
  }
  return new EventSource(`${API_BASE}/run?${params.toString()}`);
}

export async function continueTest(): Promise<void> {
  await fetch(`${API_BASE}/continue`, { method: "POST" });
}
