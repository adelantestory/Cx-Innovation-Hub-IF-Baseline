export interface TestStep {
  description: string;
  action: string;
}

export interface TestMetadata {
  specFile: string;
  testSuite: string;
  testName: string;
  summary: string;
  objective: string;
  flow: TestStep[];
  tags: string[];
}

export interface TestCatalog {
  suites: TestSuite[];
  totalTests: number;
}

export interface TestSuite {
  name: string;
  specFile: string;
  tests: TestMetadata[];
}

export type TestStatus = "passed" | "failed" | "skipped" | "timedOut";

export interface SubTestResult {
  name: string;
  status: TestStatus;
  duration: number;
  error?: string;
  suggestion?: string;
  objective?: string;
  attempted?: string;
  whatFailed?: string;
  severity?: "low" | "medium" | "high" | "critical";
}

export interface TestRunEvent {
  type:
    | "run:start"
    | "run:progress"
    | "test:start"
    | "test:end"
    | "run:end"
    | "run:video"
    | "run:paused"
    | "run:error";
  data:
    | RunStartData
    | RunProgressData
    | TestStartData
    | TestEndData
    | RunEndData
    | RunVideoData
    | RunPausedData
    | RunErrorData;
}

export interface RunStartData {
  totalTests: number;
  specFile: string;
  suiteName: string;
}

export interface RunProgressData {
  message: string;
  phase: "launching" | "navigating" | "executing";
}

export interface TestStartData {
  testName: string;
  testIndex: number;
  totalTests: number;
  stepDescription: string;
  objective?: string;
  flowSteps?: string[];
}

export interface TestEndData {
  testName: string;
  testIndex: number;
  status: TestStatus;
  duration: number;
  error?: string;
  suggestion?: string;
  objective?: string;
  attempted?: string;
  whatFailed?: string;
  severity?: "low" | "medium" | "high" | "critical";
}

export interface RunEndData {
  passed: number;
  failed: number;
  skipped: number;
  timedOut: number;
  totalDuration: number;
}

export interface RunVideoData {
  videoUrl: string;
}

export interface RunPausedData {
  testName: string;
}

export interface RunErrorData {
  message: string;
}

export interface ExecutionState {
  isRunning: boolean;
  isHeaded: boolean;
  isPaused: boolean;
  currentTest: string;
  currentStepDescription: string;
  currentObjective: string;
  currentFlowSteps: string[];
  initMessage: string;
  errorMessage: string;
  progress: number;
  totalTests: number;
  completedTests: number;
  results: SubTestResult[];
  finalStats: RunEndData | null;
  videoUrl: string;
}

// ── CI Test Execution types ─────────────────────────────────────

export interface WorkflowSummary {
  name: string;
  steps: string[];
}

export interface WorkflowRun {
  id: number;
  status: string;
  conclusion: string | null;
  branch: string;
  commitSha: string;
  commitMessage: string;
  duration: string;
  createdAt: string;
  url: string;
}

export interface CIFailure {
  job: string;
  step: string;
  error: string;
  suggestion: string;
}
