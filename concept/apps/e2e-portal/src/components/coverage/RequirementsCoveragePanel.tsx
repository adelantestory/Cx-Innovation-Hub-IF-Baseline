import { useState, useMemo } from "react";
import requirementsData from "../../data/requirements.json";
import type { Requirement } from "../../types";

const requirements: Requirement[] = requirementsData as Requirement[];

export default function RequirementsCoveragePanel() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [coveredOpen, setCoveredOpen] = useState(false);
  const [gapsOpen, setGapsOpen] = useState(true);

  const stats = useMemo(() => {
    const total = requirements.length;
    const covered = requirements.filter((r) => r.coveredBy.length > 0).length;
    const gaps = total - covered;
    const pct = Math.round((covered / total) * 100);
    return { total, covered, gaps, pct };
  }, []);

  const coveredReqs = useMemo(() => requirements.filter((r) => r.coveredBy.length > 0), []);
  const gapReqs = useMemo(() => requirements.filter((r) => r.coveredBy.length === 0), []);

  const pctColor =
    stats.pct >= 90 ? "text-portal-pass" : stats.pct >= 70 ? "text-yellow-400" : "text-portal-fail";

  return (
    <div className="space-y-3">
      {/* Compact summary — 2x2 grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-portal-card border border-portal-border rounded p-2 text-center">
          <div className={`text-lg font-bold ${pctColor}`}>{stats.pct}%</div>
          <div className="text-[10px] text-portal-muted">Coverage</div>
        </div>
        <div className="bg-portal-card border border-portal-border rounded p-2 text-center">
          <div className="text-lg font-bold text-portal-text">{stats.total}</div>
          <div className="text-[10px] text-portal-muted">Requirements</div>
        </div>
        <div className="bg-portal-card border border-portal-border rounded p-2 text-center">
          <div className="text-lg font-bold text-portal-pass">{stats.covered}</div>
          <div className="text-[10px] text-portal-muted">Covered</div>
        </div>
        <div className="bg-portal-card border border-portal-border rounded p-2 text-center">
          <div className={`text-lg font-bold ${stats.gaps > 0 ? "text-portal-fail" : "text-portal-pass"}`}>{stats.gaps}</div>
          <div className="text-[10px] text-portal-muted">Gaps</div>
        </div>
      </div>

      {/* Covered section — collapsible */}
      <div className="border border-portal-border/30 rounded overflow-hidden">
        <button
          onClick={() => setCoveredOpen(!coveredOpen)}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-portal-pass bg-portal-pass/5 hover:bg-portal-pass/10 transition-colors"
        >
          <span className="text-[10px]">{coveredOpen ? "▾" : "▸"}</span>
          ✓ Covered ({stats.covered})
        </button>
        {coveredOpen && (
          <div className="max-h-48 overflow-y-auto">
            {coveredReqs.map((req) => (
              <CompactRow
                key={req.id}
                req={req}
                isExpanded={expandedId === req.id}
                onToggle={() => setExpandedId(expandedId === req.id ? null : req.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Gaps section — collapsible, open by default */}
      <div className="border border-portal-border/30 rounded overflow-hidden">
        <button
          onClick={() => setGapsOpen(!gapsOpen)}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-portal-fail bg-portal-fail/5 hover:bg-portal-fail/10 transition-colors"
        >
          <span className="text-[10px]">{gapsOpen ? "▾" : "▸"}</span>
          ⚠ Gaps ({stats.gaps})
        </button>
        {gapsOpen && (
          <div className="max-h-48 overflow-y-auto">
            {gapReqs.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-500">No gaps — full coverage!</div>
            ) : (
              gapReqs.map((req) => (
                <CompactRow
                  key={req.id}
                  req={req}
                  isExpanded={expandedId === req.id}
                  onToggle={() => setExpandedId(expandedId === req.id ? null : req.id)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CompactRow({
  req,
  isExpanded,
  onToggle,
}: {
  req: Requirement;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isCovered = req.coveredBy.length > 0;
  return (
    <div className="border-t border-portal-border/10">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-portal-card/5 transition-colors"
      >
        <span className="text-[10px] text-gray-500 font-mono w-12 shrink-0">{req.id}</span>
        <span className="text-xs text-gray-300 truncate flex-1">{req.text}</span>
        {isCovered && (
          <span className="text-[10px] text-gray-500 shrink-0">{req.coveredBy.length}</span>
        )}
      </button>
      {isExpanded && (
        <div className="px-4 pb-2 pt-1">
          {isCovered ? (
            <div className="space-y-0.5">
              {req.coveredBy.map((link, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-portal-pass">●</span>
                  <span className="text-gray-400">{link.specFile}</span>
                  <span className="text-gray-500">→</span>
                  <span className="text-gray-300 truncate">{link.testName}</span>
                </div>
              ))}
            </div>
          ) : req.suggestion ? (
            <div className="text-[11px] text-gray-300 bg-portal-fail/10 border border-portal-fail/20 rounded px-2 py-1.5">
              <span className="text-portal-fail font-medium">Suggested: </span>
              {req.suggestion}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
