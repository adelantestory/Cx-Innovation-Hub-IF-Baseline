import { useState, useMemo } from "react";
import type { TestSuite } from "../../types";

const ENV_TAGS = ["@smoke", "@dev", "@qa", "@uat", "@prod-safe"] as const;
const ENV_TAG_COLORS: Record<string, string> = {
  "@smoke": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "@dev": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "@qa": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "@uat": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "@prod-safe": "bg-green-500/20 text-green-400 border-green-500/30",
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface TestPickerProps {
  suites: TestSuite[];
  selectedKeys: Set<string>;
  onToggleTest: (key: string) => void;
  onToggleSuite: (specFile: string) => void;
  onToggleAll: () => void;
  disabled?: boolean;
}

export default function TestPicker({
  suites,
  selectedKeys,
  onToggleTest,
  onToggleSuite,
  onToggleAll,
  disabled,
}: TestPickerProps) {
  const [envFilter, setEnvFilter] = useState<string | null>(null);

  const filteredSuites = useMemo(() => {
    if (!envFilter) return suites;
    return suites
      .map((s) => ({
        ...s,
        tests: s.tests.filter((t) => t.tags.includes(envFilter)),
      }))
      .filter((s) => s.tests.length > 0);
  }, [suites, envFilter]);

  const totalTests = filteredSuites.reduce((sum, s) => sum + s.tests.length, 0);
  const allSelected = totalTests > 0 && filteredSuites.every((s) =>
    s.tests.every((t) => selectedKeys.has(`${s.specFile}:::${t.testName}`))
  );
  const someSelected =
    filteredSuites.some((s) =>
      s.tests.some((t) => selectedKeys.has(`${s.specFile}:::${t.testName}`))
    ) && !allSelected;

  return (
    <div className="bg-portal-card border border-portal-border rounded-lg overflow-hidden shadow-sm">
      {/* Environment filter bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-portal-border bg-gray-50">
        <span className="text-xs text-portal-muted font-mono mr-1">ENV:</span>
        <button
          onClick={() => setEnvFilter(null)}
          className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
            !envFilter
              ? "bg-portal-text text-white border-portal-text"
              : "bg-white text-gray-500 border-gray-300 hover:border-gray-400"
          }`}
        >
          All
        </button>
        {ENV_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setEnvFilter(envFilter === tag ? null : tag)}
            className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
              envFilter === tag
                ? ENV_TAG_COLORS[tag]
                : "bg-white text-gray-500 border-gray-300 hover:border-gray-400"
            }`}
          >
            {tag.replace("@", "")}
          </button>
        ))}
      </div>

      {/* Select All header */}
      <label
        className={`flex items-center gap-3 px-4 py-3 border-b border-portal-border cursor-pointer hover:bg-portal-bg/50 transition-colors ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      >
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected;
          }}
          onChange={onToggleAll}
          disabled={disabled}
          className="w-4 h-4 rounded border-portal-border accent-[#3a3a3a] focus:ring-[#3a3a3a] focus:ring-offset-0 bg-portal-bg cursor-pointer"
        />
        <span className="text-base font-bold text-black">
          Select All
        </span>
        <span className="ml-auto text-xs text-portal-muted font-mono">
          {selectedKeys.size}/{totalTests}
        </span>
      </label>

      {/* Scrollable test list */}
      <div className="max-h-72 overflow-y-auto">
        {filteredSuites.map((suite) => {
          const suiteKeys = suite.tests.map(
            (t) => `${suite.specFile}:::${t.testName}`
          );
          const suiteAllSelected =
            suiteKeys.length > 0 && suiteKeys.every((k) => selectedKeys.has(k));
          const suiteSomeSelected =
            suiteKeys.some((k) => selectedKeys.has(k)) && !suiteAllSelected;
          const suiteSelectedCount = suiteKeys.filter((k) =>
            selectedKeys.has(k)
          ).length;

          return (
            <div key={suite.specFile}>
              {/* Suite header */}
              <label
                className={`flex items-center gap-3 px-4 py-2 border-b border-portal-border/50 cursor-pointer hover:bg-portal-bg/60 transition-colors ${disabled ? "opacity-50 pointer-events-none" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={suiteAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = suiteSomeSelected;
                  }}
                  onChange={() => onToggleSuite(suite.specFile)}
                  disabled={disabled}
                  className="w-3.5 h-3.5 rounded border-portal-border accent-[#3a3a3a] focus:ring-[#3a3a3a] focus:ring-offset-0 bg-portal-bg cursor-pointer"
                />
                <span className="text-sm font-bold font-mono text-black break-words">
                  {suite.name}
                </span>
                <span className="ml-auto text-xs text-portal-muted font-mono shrink-0">
                  {suiteSelectedCount}/{suite.tests.length}
                </span>
              </label>

              {/* Individual tests */}
              {suite.tests.map((test) => {
                const key = `${suite.specFile}:::${test.testName}`;
                const envTags = test.tags.filter((t) => t.startsWith("@"));
                return (
                  <label
                    key={key}
                    className={`flex items-center gap-3 pl-8 pr-4 py-1.5 cursor-pointer hover:bg-portal-bg/40 transition-colors ${disabled ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedKeys.has(key)}
                      onChange={() => onToggleTest(key)}
                      disabled={disabled}
                      className="w-3 h-3 rounded border-portal-border accent-[#3a3a3a] focus:ring-[#3a3a3a] focus:ring-offset-0 bg-portal-bg cursor-pointer"
                    />
                    <span className="text-sm text-[#374151] break-words">
                      {capitalize(test.testName)}
                    </span>
                    <span className="ml-auto flex gap-1 shrink-0">
                      {envTags.map((tag) => (
                        <span
                          key={tag}
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${ENV_TAG_COLORS[tag] || "bg-gray-100 text-gray-500 border-gray-300"}`}
                        >
                          {tag.replace("@", "")}
                        </span>
                      ))}
                    </span>
                  </label>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
