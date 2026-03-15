import { useMemo, useState, useCallback } from "react";
import useTestDiscovery from "../../hooks/useTestDiscovery";
import useTestExecution from "../../hooks/useTestExecution";
import type { TestStatus } from "../../types";
import TestPicker from "./TestPicker";
import StepDescriptionCard from "./StepDescriptionCard";
import ProgressBar from "./ProgressBar";
import PassFailStats from "./PassFailStats";
import FailureAnalysis from "./FailureAnalysis";
import VideoPlayer from "./VideoPlayer";

export default function TestExecutionPanel() {
  const { suites, loading, error: discoveryError } = useTestDiscovery();
  const { executionState, startRun, stopRun, handleContinue } = useTestExecution();
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<TestStatus | null>(null);

  const {
    isRunning,
    isHeaded,
    isPaused,
    currentTest,
    currentStepDescription,
    currentObjective,
    currentFlowSteps,
    initMessage,
    errorMessage,
    results,
    finalStats,
    videoUrl,
  } = executionState;

  const allTests = useMemo(
    () => suites.flatMap((s) => s.tests),
    [suites]
  );

  const hasResults = results.length > 0;
  const canRun = selectedKeys.size > 0 && !isRunning;
  const isSingleTest = selectedKeys.size === 1;

  // --- Selection handlers ---
  const toggleTest = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleSuite = useCallback(
    (specFile: string) => {
      const suite = suites.find((s) => s.specFile === specFile);
      if (!suite) return;
      const keys = suite.tests.map((t) => `${suite.specFile}:::${t.testName}`);
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        const allSelected = keys.every((k) => next.has(k));
        if (allSelected) {
          keys.forEach((k) => next.delete(k));
        } else {
          keys.forEach((k) => next.add(k));
        }
        return next;
      });
    },
    [suites]
  );

  const toggleAll = useCallback(() => {
    setSelectedKeys((prev) => {
      const allKeys = allTests.map((t) => `${t.specFile}:::${t.testName}`);
      const everySelected = allKeys.length > 0 && allKeys.every((k) => prev.has(k));
      if (everySelected) return new Set();
      return new Set(allKeys);
    });
  }, [allTests]);

  // --- Run handler ---
  function handleClick(headed: boolean = false) {
    if (isRunning) {
      stopRun();
      return;
    }

    setStatusFilter(null);

    const selectedTests = allTests.filter((t) =>
      selectedKeys.has(`${t.specFile}:::${t.testName}`)
    );
    if (selectedTests.length === 0) return;

    // Group by spec file
    const specMap = new Map<string, string[]>();
    for (const t of selectedTests) {
      if (!specMap.has(t.specFile)) specMap.set(t.specFile, []);
      specMap.get(t.specFile)!.push(t.testName);
    }

    const specs = [...specMap.keys()];

    // Check if ALL tests in all selected specs are selected (no grep needed)
    const totalTestsInSpecs = specs.reduce((sum, s) => {
      const suite = suites.find((suite) => suite.specFile === s);
      return sum + (suite?.tests.length ?? 0);
    }, 0);

    if (selectedTests.length === totalTestsInSpecs) {
      startRun(specs, undefined, headed);
    } else {
      startRun(
        specs,
        selectedTests.map((t) => t.testName),
        headed
      );
    }
  }

  const buttonLabel = isRunning
    ? "⏹ Stop"
    : selectedKeys.size > 0
      ? `▶ Run (${selectedKeys.size})`
      : "▶ Run";

  return (
    <div className="space-y-4">
      {/* Test picker + run button */}
      <div className="flex flex-col gap-3">
        {loading && (
          <div className="text-portal-muted text-xs flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-portal-accent animate-pulse" />
            Loading tests…
          </div>
        )}
        {discoveryError && (
          <div className="text-portal-fail text-xs">⚠ {discoveryError}</div>
        )}
        {!loading && !discoveryError && (
          <TestPicker
            suites={suites}
            selectedKeys={selectedKeys}
            onToggleTest={toggleTest}
            onToggleSuite={toggleSuite}
            onToggleAll={toggleAll}
            disabled={isRunning}
          />
        )}

        <div className="flex gap-2">
          <button
            onClick={() => handleClick(false)}
            disabled={!canRun && !isRunning}
            className={`font-bold px-6 py-3 rounded-lg transition-colors whitespace-nowrap ${
              !canRun && !isRunning
                ? "bg-[#3a3a3a]/40 text-white/60 cursor-not-allowed"
                : "bg-[#3a3a3a] text-white hover:bg-[#2a2a2a]"
            }`}
          >
            {buttonLabel}
          </button>

          {isSingleTest && !isRunning && (
            <button
              onClick={() => handleClick(true)}
              disabled={!canRun}
              className={`font-bold px-6 py-3 rounded-lg transition-colors whitespace-nowrap ${
                canRun
                  ? "bg-[#3a3a3a] text-white hover:bg-[#2a2a2a]"
                  : "bg-[#3a3a3a]/40 text-white/60 cursor-not-allowed"
              }`}
            >
              🎬 Run Headed
            </button>
          )}
        </div>
      </div>

      {/* Headed mode live indicator */}
      {isRunning && isHeaded && !isPaused && (
        <div className="bg-portal-card border border-portal-accent/30 rounded-lg p-4 flex items-center gap-3 shadow-sm">
          <span className="text-2xl">🎬</span>
          <div>
            <p className="text-portal-heading font-bold text-sm">Watching Live — Browser Window Is Open</p>
            <p className="text-portal-muted text-xs">The test is running in a visible browser with slow-motion pacing. Watch the browser window to follow along.</p>
          </div>
        </div>
      )}

      {/* Paused on failure — Continue button */}
      {isRunning && isPaused && (
        <div className="bg-red-50 border-2 border-portal-fail/40 rounded-lg p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏸️</span>
            <div>
              <p className="text-portal-heading font-bold text-sm">Test Failed — Browser Paused for Inspection</p>
              <p className="text-portal-muted text-xs mt-1">
                The browser window is still open on the failure state. Inspect the page, then click Continue when ready.
              </p>
            </div>
          </div>
          <button
            onClick={handleContinue}
            className="font-bold px-6 py-3 rounded-lg bg-[#3a3a3a] hover:bg-[#2a2a2a] text-white transition-colors w-full"
          >
            ▶ Continue
          </button>
        </div>
      )}

      {/* Initialization phase */}
      {isRunning && !currentTest && initMessage && (
        <div className="bg-portal-card border border-portal-border rounded-lg p-4 flex items-center gap-3 shadow-sm">
          <div className="flex space-x-1">
            <span className="inline-block h-2 w-2 rounded-full bg-portal-accent animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="inline-block h-2 w-2 rounded-full bg-portal-accent animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="inline-block h-2 w-2 rounded-full bg-portal-accent animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <p className="text-portal-muted text-sm">{initMessage}</p>
        </div>
      )}

      {/* Active test step description */}
      {isRunning && currentTest && (
        <StepDescriptionCard
          testName={currentTest}
          description={currentStepDescription}
          objective={currentObjective}
          flowSteps={currentFlowSteps}
          isActive
        />
      )}

      {/* Progress bar */}
      {(isRunning || hasResults) && (
        <ProgressBar
          completed={executionState.completedTests}
          total={executionState.totalTests}
        />
      )}

      {/* Results */}
      {hasResults && (
        <>
          <PassFailStats
            results={results}
            finalStats={finalStats}
            statusFilter={statusFilter}
            onFilterChange={setStatusFilter}
          />
          <FailureAnalysis results={results} statusFilter={statusFilter} />
        </>
      )}

      {/* Video replay from headed run */}
      {!isRunning && videoUrl && (
        <VideoPlayer videoUrl={videoUrl} />
      )}

      {/* Error display */}
      {!isRunning && errorMessage && (
        <div className="bg-red-50 border border-red-200 border-l-4 border-l-portal-fail rounded-lg p-5 space-y-2 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-portal-fail text-lg">⚠️</span>
            <h4 className="text-portal-fail font-bold text-[24px]">Test Run Failed</h4>
          </div>
          <p className="text-portal-muted text-sm leading-relaxed">{errorMessage}</p>
          <p className="text-portal-muted/70 text-xs mt-2">
            💡 Make sure the Taskify app is running (API on port 3000, Web on port 5173) and Playwright is installed in the web app.
          </p>
        </div>
      )}

    </div>
  );
}
