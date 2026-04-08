import { useCallback, useEffect, useRef, useState } from "react";
import { runTests, continueTest } from "../api/client";
import type {
  ExecutionState,
  RunEndData,
  RunErrorData,
  RunPausedData,
  RunProgressData,
  RunStartData,
  RunVideoData,
  TestEndData,
  TestRunEvent,
  TestStartData,
} from "../types";

const INITIAL_STATE: ExecutionState = {
  isRunning: false,
  isHeaded: false,
  isPaused: false,
  currentTest: "",
  currentStepDescription: "",
  currentObjective: "",
  currentFlowSteps: [],
  initMessage: "",
  errorMessage: "",
  progress: 0,
  totalTests: 0,
  completedTests: 0,
  results: [],
  finalStats: null,
  videoUrl: "",
};

interface UseTestExecutionReturn {
  executionState: ExecutionState;
  startRun: (specFiles: string[], testNames?: string[], headed?: boolean) => void;
  stopRun: () => void;
  handleContinue: () => void;
}

export default function useTestExecution(): UseTestExecutionReturn {
  const [executionState, setExecutionState] =
    useState<ExecutionState>(INITIAL_STATE);
  const eventSourceRef = useRef<EventSource | null>(null);

  const stopRun = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setExecutionState((prev) => ({ ...prev, isRunning: false, isPaused: false }));
  }, []);

  const handleContinue = useCallback(async () => {
    await continueTest();
    setExecutionState((prev) => ({ ...prev, isPaused: false }));
  }, []);

  const startRun = useCallback(
    (specFiles: string[], testNames?: string[], headed?: boolean) => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      setExecutionState({
        ...INITIAL_STATE,
        isRunning: true,
        isHeaded: !!headed,
        initMessage: headed
          ? "🎬 Launching headed browser…"
          : "Connecting to test runner…",
      });

      const es = runTests(specFiles, testNames, headed);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const parsed: TestRunEvent = JSON.parse(event.data);

          switch (parsed.type) {
            case "run:progress": {
              const data = parsed.data as RunProgressData;
              setExecutionState((prev) => ({
                ...prev,
                initMessage: data.message,
              }));
              break;
            }

            case "run:start": {
              const data = parsed.data as RunStartData;
              setExecutionState((prev) => ({
                ...prev,
                totalTests: data.totalTests,
                initMessage: `Running ${data.totalTests} test${data.totalTests === 1 ? "" : "s"} in ${data.suiteName}…`,
              }));
              break;
            }

            case "test:start": {
              const data = parsed.data as TestStartData;
              setExecutionState((prev) => ({
                ...prev,
                currentTest: data.testName,
                currentStepDescription: data.stepDescription,
                currentObjective: data.objective ?? "",
                currentFlowSteps: data.flowSteps ?? [],
                initMessage: "",
                progress:
                  data.totalTests > 0
                    ? (data.testIndex / data.totalTests) * 100
                    : 0,
              }));
              break;
            }

            case "test:end": {
              const data = parsed.data as TestEndData;
              setExecutionState((prev) => ({
                ...prev,
                completedTests: prev.completedTests + 1,
                progress:
                  prev.totalTests > 0
                    ? ((data.testIndex + 1) / prev.totalTests) * 100
                    : 0,
                results: [
                  ...prev.results,
                  {
                    name: data.testName,
                    status: data.status,
                    duration: data.duration,
                    error: data.error,
                    suggestion: data.suggestion,
                    objective: data.objective,
                    attempted: data.attempted,
                    whatFailed: data.whatFailed,
                    severity: data.severity as "low" | "medium" | "high" | "critical" | undefined,
                  },
                ],
              }));
              break;
            }

            case "run:end": {
              const data = parsed.data as RunEndData;
              setExecutionState((prev) => ({
                ...prev,
                isRunning: false,
                progress: 100,
                finalStats: data,
                currentTest: "",
                currentStepDescription: "",
                currentObjective: "",
                currentFlowSteps: [],
                initMessage: "",
              }));
              es.close();
              eventSourceRef.current = null;
              break;
            }

            case "run:video": {
              const data = parsed.data as RunVideoData;
              setExecutionState((prev) => ({
                ...prev,
                videoUrl: data.videoUrl,
              }));
              break;
            }

            case "run:paused": {
              const data = parsed.data as RunPausedData;
              setExecutionState((prev) => ({
                ...prev,
                isPaused: true,
                currentTest: data.testName,
              }));
              break;
            }

            case "run:error": {
              const data = parsed.data as RunErrorData;
              setExecutionState((prev) => ({
                ...prev,
                isRunning: false,
                currentTest: "",
                currentStepDescription: "",
                initMessage: "",
                errorMessage: data.message,
              }));
              es.close();
              eventSourceRef.current = null;
              break;
            }
          }
        } catch {
          // Ignore malformed messages
        }
      };

      es.onerror = () => {
        setExecutionState((prev) => ({
          ...prev,
          isRunning: false,
          initMessage: "",
          errorMessage: prev.errorMessage || (prev.results.length === 0
            ? "Connection to the test runner was lost. Ensure the backend server is running on port 3001."
            : ""),
        }));
        es.close();
        eventSourceRef.current = null;
      };
    },
    []
  );

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  return { executionState, startRun, stopRun, handleContinue };
}
