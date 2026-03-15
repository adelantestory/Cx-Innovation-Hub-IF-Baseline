import type { TestMetadata } from "../../types";

interface TestSummaryCardProps {
  test: TestMetadata | null;
}

export default function TestSummaryCard({ test }: TestSummaryCardProps) {
  if (!test) {
    return (
      <div className="bg-portal-card border border-portal-border rounded-lg p-6 flex flex-col items-center justify-center text-center min-h-[200px] shadow-sm">
        <span className="text-4xl mb-3 opacity-30">📋</span>
        <p className="text-portal-muted text-sm">
          Select a test to view its details
        </p>
      </div>
    );
  }

  return (
    <div className="bg-portal-card border border-portal-border rounded-lg p-6 space-y-4 shadow-sm">
      <div>
        <h3 className="text-portal-heading font-bold text-[28px]">{test.testName.charAt(0).toUpperCase() + test.testName.slice(1)}</h3>
        <p className="text-portal-muted text-sm">{test.testSuite}</p>
      </div>

      <p className="text-portal-muted text-sm leading-relaxed">{test.summary}</p>

      <div>
        <h4 className="text-portal-heading text-[22px] font-bold font-mono uppercase tracking-wider mb-1">
          🎯 Objective
        </h4>
        <p className="text-portal-muted text-sm leading-relaxed">{test.objective}</p>
      </div>

      <div>
        <h4 className="text-portal-heading text-[22px] font-bold font-mono uppercase tracking-wider mb-2">
          Test Flow
        </h4>
        <ol className="space-y-1.5">
          {test.flow.map((step, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span className="text-portal-text font-mono text-xs mt-0.5 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-portal-muted">{step.description}</span>
            </li>
          ))}
        </ol>
      </div>

      {test.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {test.tags.map((tag) => (
            <span
              key={tag}
              className="bg-portal-accent/10 text-portal-accent text-xs rounded-full px-2 py-0.5 border border-portal-accent/20"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
