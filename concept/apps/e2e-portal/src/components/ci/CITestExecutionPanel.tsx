import { useEffect, useState, useCallback, useRef } from "react";
import type { WorkflowSummary, WorkflowRun, CIFailure } from "../../types";

const API = "http://localhost:3001/api/ci";
const POLL_INTERVAL = 10000;

type DispatchStatus = "idle" | "triggered" | "queued" | "in_progress" | "completed";

export default function CITestExecutionPanel() {
  const [workflow, setWorkflow] = useState<WorkflowSummary | null>(null);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [failures, setFailures] = useState<CIFailure[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [dispatchStatus, setDispatchStatus] = useState<DispatchStatus>("idle");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchRuns = useCallback(async (): Promise<WorkflowRun[]> => {
    const res = await fetch(`${API}/runs`);
    if (!res.ok) throw new Error("Failed to fetch workflow runs");
    return res.json();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [wfRes, runsData] = await Promise.all([
        fetch(`${API}/workflow`),
        fetchRuns(),
      ]);
      if (!wfRes.ok) throw new Error("Failed to fetch workflow info");
      setWorkflow(await wfRes.json());
      setRuns(runsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [fetchRuns]);

  useEffect(() => {
    fetchData();
    return stopPolling;
  }, [fetchData, stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    setDispatchStatus("triggered");

    pollRef.current = setInterval(async () => {
      try {
        const latestRuns = await fetchRuns();
        setRuns(latestRuns);

        if (latestRuns.length === 0) return;
        const latest = latestRuns[0];

        if (latest.status === "queued") {
          setDispatchStatus("queued");
        } else if (latest.status === "in_progress") {
          setDispatchStatus("in_progress");
        } else if (latest.status === "completed") {
          setDispatchStatus("completed");
          stopPolling();
          // Auto-clear status after 5s
          setTimeout(() => setDispatchStatus("idle"), 5000);
        }
      } catch {
        // Silently retry on next interval
      }
    }, POLL_INTERVAL);
  }, [fetchRuns, stopPolling]);

  const handleDispatch = async () => {
    setDispatching(true);
    setError("");
    setFailures([]);
    try {
      const res = await fetch(`${API}/dispatch`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Dispatch failed");
      startPolling();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setDispatchStatus("idle");
    } finally {
      setDispatching(false);
    }
  };

  const handleAnalyze = async () => {
    if (runs.length === 0) return;
    const latest = runs[0];
    setAnalyzing(true);
    setFailures([]);
    setError("");
    try {
      const res = await fetch(`${API}/failures/${latest.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setFailures(data.failures ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAnalyzing(false);
    }
  };

  const latestFailed =
    runs.length > 0 && runs[0].conclusion === "failure";

  const conclusionIcon = (c: string | null) => {
    switch (c) {
      case "success":
        return "✅";
      case "failure":
        return "❌";
      case "cancelled":
        return "⚪";
      default:
        return "🔄";
    }
  };

  const conclusionColor = (c: string | null) => {
    switch (c) {
      case "success":
        return "text-green-600";
      case "failure":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const statusLabel = (): string => {
    switch (dispatchStatus) {
      case "triggered":
        return "Workflow triggered — waiting for GitHub to pick it up…";
      case "queued":
        return "Workflow queued — waiting for a runner…";
      case "in_progress":
        return "Workflow running…";
      case "completed":
        return "Workflow completed!";
      default:
        return "";
    }
  };

  const statusDotColor = (): string => {
    switch (dispatchStatus) {
      case "triggered":
      case "queued":
        return "bg-yellow-400";
      case "in_progress":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      default:
        return "bg-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-500 font-mono text-sm">
        Loading CI data…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Workflow summary */}
      {workflow && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="font-mono text-[16px] font-bold text-portal-heading mb-3">
            {workflow.name} — Actions Workflow
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 font-mono">
            {workflow.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Runs table */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 overflow-x-auto">
        <h3 className="font-mono text-[14px] font-bold text-portal-heading mb-3 uppercase tracking-wider">
          Recent Runs
        </h3>
        {runs.length === 0 ? (
          <p className="text-sm text-gray-500 font-mono">
            No workflow runs found.
          </p>
        ) : (
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2 pr-3">Branch</th>
                <th className="pb-2 pr-3">Commit</th>
                <th className="pb-2 pr-3">Duration</th>
                <th className="pb-2 pr-3">Date</th>
                <th className="pb-2">Link</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className={`py-2 pr-3 ${conclusionColor(r.conclusion)}`}>
                    {conclusionIcon(r.conclusion)}{" "}
                    {r.conclusion ?? r.status}
                  </td>
                  <td className="py-2 pr-3 text-gray-700">{r.branch}</td>
                  <td className="py-2 pr-3 text-gray-500" title={r.commitMessage}>
                    {r.commitSha}
                  </td>
                  <td className="py-2 pr-3 text-gray-500">{r.duration}</td>
                  <td className="py-2 pr-3 text-gray-500">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-700 underline hover:text-purple-900"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleDispatch}
          disabled={dispatching || dispatchStatus !== "idle"}
          className="px-4 py-2 rounded-lg text-white font-mono text-sm transition-colors disabled:opacity-50"
          style={{ backgroundColor: "#3a3a3a" }}
        >
          {dispatching ? "Triggering…" : "Run Workflow"}
        </button>

        {latestFailed && (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="px-4 py-2 rounded-lg text-white font-mono text-sm transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#3a3a3a" }}
          >
            {analyzing ? "Analyzing…" : "Analyze Failures"}
          </button>
        )}

        <button
          onClick={fetchData}
          className="px-4 py-2 rounded-lg text-white font-mono text-sm transition-colors"
          style={{ backgroundColor: "#3a3a3a" }}
        >
          Refresh
        </button>
      </div>

      {/* Live dispatch status */}
      {dispatchStatus !== "idle" && (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-sm text-gray-700">
          <span className={`inline-block h-3 w-3 rounded-full ${statusDotColor()} ${dispatchStatus !== "completed" ? "animate-pulse" : ""}`} />
          {statusLabel()}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 font-mono">
          {error}
        </div>
      )}

      {/* Failure analysis */}
      {failures.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-white p-5 space-y-4">
          <h3 className="font-mono text-[14px] font-bold text-red-600 uppercase tracking-wider">
            Failure Analysis
          </h3>
          {failures.map((f, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2"
            >
              <div className="font-mono text-sm">
                <span className="font-bold text-gray-700">Job:</span>{" "}
                {f.job}
              </div>
              <div className="font-mono text-sm">
                <span className="font-bold text-gray-700">Step:</span>{" "}
                {f.step}
              </div>
              <div className="font-mono text-sm">
                <span className="font-bold text-red-600">Error:</span>
                <pre className="mt-1 whitespace-pre-wrap text-xs text-red-800 bg-red-50 p-2 rounded border border-red-100 max-h-40 overflow-y-auto">
                  {f.error}
                </pre>
              </div>
              <div className="font-mono text-sm">
                <span className="font-bold text-green-700">Suggestion:</span>{" "}
                <span className="text-gray-700">{f.suggestion}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
