import type { SubTestResult } from "../../types";

interface PixelGridProps {
  results: SubTestResult[];
}

const STATUS_COLORS: Record<string, string> = {
  passed: "bg-portal-pass",
  failed: "bg-portal-fail",
  skipped: "bg-portal-skip",
  timedOut: "bg-portal-skip",
};

export default function PixelGrid({ results }: PixelGridProps) {
  if (results.length === 0) {
    return (
      <div className="text-portal-muted text-sm text-center py-6">
        No results yet.
      </div>
    );
  }

  return (
    <div className="bg-portal-card border border-portal-border rounded-lg p-4 shadow-sm">
      <h4 className="text-portal-heading text-[22px] font-bold font-mono uppercase tracking-wider mb-3">
        Pixel Grid
      </h4>

      <div
        className="space-y-0.5 p-3 rounded"
        style={{
          backgroundImage:
            "linear-gradient(rgba(224,219,215,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(224,219,215,0.5) 1px, transparent 1px)",
          backgroundSize: "8px 8px",
        }}
      >
        {results.map((r, i) => {
          const color = STATUS_COLORS[r.status] ?? STATUS_COLORS.skipped;
          return (
            <div key={i} className="flex items-center gap-3">
              <div
                className={`${color} shadow-inner rounded-sm`}
                style={{ width: 40, height: 16 }}
              />
              <span className="text-portal-muted font-mono text-[10px] truncate max-w-[200px]">
                {r.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
