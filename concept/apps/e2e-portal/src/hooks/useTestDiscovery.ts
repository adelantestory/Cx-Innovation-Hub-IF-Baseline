import { useEffect, useState } from "react";
import { fetchTests } from "../api/client";
import type { TestSuite } from "../types";

interface UseTestDiscoveryReturn {
  suites: TestSuite[];
  totalTests: number;
  loading: boolean;
  error: string | null;
}

export default function useTestDiscovery(): UseTestDiscoveryReturn {
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [totalTests, setTotalTests] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const catalog = await fetchTests();
        if (!cancelled) {
          setSuites(catalog.suites);
          setTotalTests(catalog.totalTests);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load test catalog"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { suites, totalTests, loading, error };
}
