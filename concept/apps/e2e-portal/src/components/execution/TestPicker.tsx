import type { TestSuite } from "../../types";

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
  const totalTests = suites.reduce((sum, s) => sum + s.tests.length, 0);
  const allSelected = totalTests > 0 && selectedKeys.size === totalTests;
  const someSelected = selectedKeys.size > 0 && !allSelected;

  return (
    <div className="bg-portal-card border border-portal-border rounded-lg overflow-hidden shadow-sm">
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
        <span className="text-sm font-medium text-portal-text">
          Select All
        </span>
        <span className="ml-auto text-xs text-portal-muted font-mono">
          {selectedKeys.size}/{totalTests}
        </span>
      </label>

      {/* Scrollable test list */}
      <div className="max-h-72 overflow-y-auto">
        {suites.map((suite) => {
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
                className={`flex items-center gap-3 px-4 py-2 bg-portal-bg/30 border-b border-portal-border/50 cursor-pointer hover:bg-portal-bg/60 transition-colors ${disabled ? "opacity-50 pointer-events-none" : ""}`}
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
                <span className="text-xs font-mono text-portal-text break-words">
                  {suite.name}
                </span>
                <span className="ml-auto text-xs text-portal-muted font-mono shrink-0">
                  {suiteSelectedCount}/{suite.tests.length}
                </span>
              </label>

              {/* Individual tests */}
              {suite.tests.map((test) => {
                const key = `${suite.specFile}:::${test.testName}`;
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
                    <span className="text-xs text-portal-text break-words">
                      {capitalize(test.testName)}
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
