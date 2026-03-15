import { useState } from "react";
import Header from "./components/layout/Header";
import TestSelector from "./components/discovery/TestSelector";
import TestSummaryCard from "./components/discovery/TestSummaryCard";
import TestExecutionPanel from "./components/execution/TestExecutionPanel";
import CITestExecutionPanel from "./components/ci/CITestExecutionPanel";
import type { TestMetadata } from "./types";

export default function App() {
  const [selectedTest, setSelectedTest] = useState<TestMetadata | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 w-full px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left panel — Test Discovery (40%) */}
          <section className="lg:w-2/5 shrink-0 space-y-4">
            <h2 className="font-mono text-[24px] font-bold text-portal-heading uppercase tracking-wider">
              ▸ Test Discovery
            </h2>
            <TestSelector
              onSelect={setSelectedTest}
              selected={selectedTest}
            />
            <TestSummaryCard test={selectedTest} />
          </section>

          {/* Right panel — Local Test Execution (60%) */}
          <section className="lg:w-3/5 min-w-0 space-y-4">
            <h2 className="font-mono text-[24px] font-bold text-portal-heading uppercase tracking-wider">
              ▸ Local Test Execution
            </h2>
            <TestExecutionPanel />
          </section>
        </div>

        {/* CI Test Execution — full width */}
        <div className="mt-8">
          <h2 className="font-mono text-[24px] font-bold text-portal-heading uppercase tracking-wider mb-4">
            ▸ CI Test Execution
          </h2>
          <CITestExecutionPanel />
        </div>
      </main>
    </div>
  );
}
