import type { SubTestResult, TestStatus } from "../../types";

interface FailureAnalysisProps {
  results: SubTestResult[];
  statusFilter: TestStatus | null;
}

const SEVERITY_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  critical: { label: "CRITICAL", bg: "bg-red-100", text: "text-red-700" },
  high: { label: "HIGH", bg: "bg-orange-100", text: "text-orange-700" },
  medium: { label: "MEDIUM", bg: "bg-yellow-100", text: "text-yellow-700" },
  low: { label: "LOW", bg: "bg-blue-100", text: "text-blue-700" },
};

export default function FailureAnalysis({ results, statusFilter }: FailureAnalysisProps) {
  // When a filter is active and it's not 'failed'/'timedOut', hide this section
  if (statusFilter === "passed" || statusFilter === "skipped") {
    return null;
  }

  const failures = results.filter((r) => r.status === "failed" || r.status === "timedOut");

  if (failures.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h4 className="text-portal-heading text-[22px] font-bold font-mono uppercase tracking-wider">
        ⚠️ Failure Analysis— {failures.length} issue{failures.length > 1 ? "s" : ""} found
      </h4>

      {failures.map((f, i) => {
        const sev = SEVERITY_STYLES[f.severity ?? "medium"];
        return (
          <div
            key={i}
            className="bg-portal-card border border-portal-border border-l-4 border-l-portal-fail rounded-lg p-5 space-y-4 shadow-sm"
          >
            {/* Header: test name + severity badge */}
            <div className="flex items-center justify-between gap-4">
              <p className="text-portal-fail font-medium text-sm">{f.name}</p>
              <span
                className={`${sev.bg} ${sev.text} text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0`}
              >
                {sev.label}
              </span>
            </div>

            {/* Objective */}
            {f.objective && (
              <div>
                <p className="text-portal-heading text-[22px] font-bold font-mono uppercase tracking-wider mb-1">
                  🎯 Test Objective
                </p>
                <p className="text-portal-muted text-sm">{f.objective}</p>
              </div>
            )}

            {/* What was attempted */}
            {f.attempted && (
              <div>
                <p className="text-portal-heading text-[22px] font-bold font-mono uppercase tracking-wider mb-1">
                  📋 What Was Attempted
                </p>
                <div className="text-portal-muted text-sm whitespace-pre-line leading-relaxed">
                  {f.attempted}
                </div>
              </div>
            )}

            {/* What went wrong */}
            {f.whatFailed && (
              <div>
                <p className="text-portal-heading text-[22px] font-bold font-mono uppercase tracking-wider mb-1">
                  ❌ What Went Wrong
                </p>
                <p className="text-portal-muted text-sm leading-relaxed">{f.whatFailed}</p>
              </div>
            )}

            {/* Raw error (collapsed) */}
            {f.error && (
              <details className="group">
                <summary className="text-portal-muted/70 text-xs font-mono cursor-pointer hover:text-portal-text transition-colors">
                  ▸ Show raw error details
                </summary>
                <pre className="mt-2 text-portal-muted text-xs bg-portal-bg rounded p-3 overflow-x-auto whitespace-pre-wrap break-words max-h-48 overflow-y-auto border border-portal-border">
                  {f.error}
                </pre>
              </details>
            )}

            {/* Suggested fix */}
            {f.suggestion && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-emerald-700 text-xs font-mono uppercase tracking-wider mb-1">
                  💡 Suggested Fix
                </p>
                <p className="text-portal-muted text-sm leading-relaxed">{f.suggestion}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
