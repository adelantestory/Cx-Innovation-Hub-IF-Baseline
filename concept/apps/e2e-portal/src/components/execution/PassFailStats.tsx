import type { RunEndData, SubTestResult, TestStatus } from "../../types";

interface PassFailStatsProps {
  results: SubTestResult[];
  finalStats: RunEndData | null;
  statusFilter: TestStatus | null;
  onFilterChange: (status: TestStatus | null) => void;
}

const STATUS_CONFIG: Record<string, { icon: string; color: string }> = {
  passed: { icon: "✓", color: "text-portal-pass" },
  failed: { icon: "✗", color: "text-portal-fail" },
  skipped: { icon: "⊘", color: "text-portal-skip" },
  timedOut: { icon: "⊘", color: "text-portal-skip" },
};

function formatDuration(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

export default function PassFailStats({
  results,
  finalStats,
  statusFilter,
  onFilterChange,
}: PassFailStatsProps) {
  const filteredResults = statusFilter
    ? results.filter((r) => {
        if (statusFilter === "skipped") return r.status === "skipped" || r.status === "timedOut";
        return r.status === statusFilter;
      })
    : results;

  function handleCardClick(status: TestStatus) {
    onFilterChange(statusFilter === status ? null : status);
  }

  return (
    <div className="space-y-6">
      {/* Sub-Test Results */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-portal-heading text-[22px] font-bold font-mono uppercase tracking-wider">
            Sub-Test Results
          </h4>
          {statusFilter && (
            <button
              onClick={() => onFilterChange(null)}
              className="text-portal-accent text-xs hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
        <div className="bg-portal-card border border-portal-border rounded-lg divide-y divide-portal-border shadow-sm">
          {filteredResults.map((r, i) => {
            const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.skipped;
            return (
              <div key={i} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-sm ${cfg.color}`}>{cfg.icon}</span>
                  <span className="text-portal-muted text-sm">{r.name}</span>
                </div>
                <span className="text-portal-muted/70 text-xs font-mono">
                  {formatDuration(r.duration)}
                </span>
              </div>
            );
          })}
          {filteredResults.length === 0 && (
            <div className="px-4 py-3 text-portal-muted text-sm text-center">
              No {statusFilter} tests.
            </div>
          )}
        </div>
      </div>

      {/* Final Summary — Clickable cards */}
      {finalStats && (
        <div>
          <h4 className="text-portal-heading text-[22px] font-bold font-mono uppercase tracking-wider mb-3">
            Final Summary
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              onClick={() => handleCardClick("passed")}
              className={`rounded-lg p-4 text-center transition-all border-2 shadow-sm ${
                statusFilter === "passed"
                  ? "bg-[#3a3a3a] border-[#3a3a3a] text-white"
                  : "bg-portal-pass/5 border-portal-pass/20 hover:border-portal-pass/50 hover:shadow-md"
              }`}
            >
              <p className={`text-2xl font-bold ${statusFilter === "passed" ? "text-white" : "text-portal-pass"}`}>{finalStats.passed}</p>
              <p className={`text-xs mt-1 ${statusFilter === "passed" ? "text-white/80" : "text-portal-pass/80"}`}>Passed</p>
            </button>
            <button
              onClick={() => handleCardClick("failed")}
              className={`rounded-lg p-4 text-center transition-all border-2 shadow-sm ${
                statusFilter === "failed"
                  ? "bg-[#3a3a3a] border-[#3a3a3a] text-white"
                  : "bg-portal-fail/5 border-portal-fail/20 hover:border-portal-fail/50 hover:shadow-md"
              }`}
            >
              <p className={`text-2xl font-bold ${statusFilter === "failed" ? "text-white" : "text-portal-fail"}`}>{finalStats.failed}</p>
              <p className={`text-xs mt-1 ${statusFilter === "failed" ? "text-white/80" : "text-portal-fail/80"}`}>Failed</p>
            </button>
            <button
              onClick={() => handleCardClick("skipped")}
              className={`rounded-lg p-4 text-center transition-all border-2 shadow-sm ${
                statusFilter === "skipped"
                  ? "bg-[#3a3a3a] border-[#3a3a3a] text-white"
                  : "bg-portal-skip/5 border-portal-skip/20 hover:border-portal-skip/50 hover:shadow-md"
              }`}
            >
              <p className={`text-2xl font-bold ${statusFilter === "skipped" ? "text-white" : "text-portal-skip"}`}>
                {finalStats.skipped + finalStats.timedOut}
              </p>
              <p className={`text-xs mt-1 ${statusFilter === "skipped" ? "text-white/80" : "text-portal-skip/80"}`}>Skipped</p>
            </button>
            <div className="bg-portal-card border-2 border-portal-border rounded-lg p-4 text-center shadow-sm">
              <p className="text-portal-text text-2xl font-bold">
                {formatDuration(finalStats.totalDuration)}
              </p>
              <p className="text-portal-muted text-xs mt-1">Duration</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
