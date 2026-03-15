import useTestDiscovery from "../../hooks/useTestDiscovery";
import type { TestMetadata } from "../../types";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface TestSelectorProps {
  onSelect: (test: TestMetadata | null) => void;
  selected: TestMetadata | null;
}

export default function TestSelector({ onSelect, selected }: TestSelectorProps) {
  const { suites, loading, error } = useTestDiscovery();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (!value) {
      onSelect(null);
      return;
    }

    const [specFile, testName] = value.split(":::");
    for (const suite of suites) {
      if (suite.specFile === specFile) {
        const test = suite.tests.find((t) => t.testName === testName);
        if (test) {
          onSelect(test);
          return;
        }
      }
    }
    onSelect(null);
  }

  if (loading) {
    return (
      <div className="bg-portal-card border border-portal-border rounded-lg p-6 flex items-center justify-center">
        <svg
          className="animate-spin h-6 w-6 text-portal-accent mr-3"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <span className="text-portal-muted text-sm">Loading tests…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-portal-card border border-portal-fail/50 rounded-lg p-6">
        <p className="text-portal-fail text-sm font-medium">⚠ Error loading tests</p>
        <p className="text-portal-muted text-xs mt-1">{error}</p>
      </div>
    );
  }

  const selectedValue = selected
    ? `${selected.specFile}:::${selected.testName}`
    : "";

  return (
    <div className="bg-portal-card border border-portal-border rounded-lg p-6 shadow-sm">
      <label
        htmlFor="test-selector"
        className="block text-portal-muted text-xs font-mono uppercase tracking-wider mb-2"
      >
        Select a Test
      </label>
      <select
        id="test-selector"
        value={selectedValue}
        onChange={handleChange}
        className="w-full bg-portal-bg border border-portal-border text-portal-text rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent focus:border-transparent cursor-pointer"
      >
        <option value="">— Choose a test —</option>
        {suites.map((suite) => (
          <optgroup key={suite.specFile} label={suite.name}>
            {suite.tests.map((test) => (
              <option
                key={`${suite.specFile}:::${test.testName}`}
                value={`${suite.specFile}:::${test.testName}`}
              >
                {capitalize(test.testName)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
