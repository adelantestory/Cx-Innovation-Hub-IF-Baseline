import Header from "./components/layout/Header";
import TestExecutionPanel from "./components/execution/TestExecutionPanel";
import CITestExecutionPanel from "./components/ci/CITestExecutionPanel";
import RequirementsCoveragePanel from "./components/coverage/RequirementsCoveragePanel";

export default function App() {

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 w-full px-4 py-6 space-y-8">
        {/* Top row: Local (60%) | Requirements Coverage (40%) */}
        <div className="flex gap-6 items-start">
          <section className="w-[60%] space-y-4">
            <h2 className="font-mono text-[24px] font-bold text-portal-heading uppercase tracking-wider">
              ▸ Local Test Execution
            </h2>
            <TestExecutionPanel />
          </section>

          <section className="w-[40%] space-y-4">
            <h2 className="font-mono text-[24px] font-bold text-portal-heading uppercase tracking-wider">
              ▸ Requirements Coverage
            </h2>
            <RequirementsCoveragePanel />
          </section>
        </div>

        {/* CI Test Execution — full width */}
        <section className="space-y-4">
          <h2 className="font-mono text-[24px] font-bold text-portal-heading uppercase tracking-wider">
            ▸ CI Test Execution
          </h2>
          <CITestExecutionPanel />
        </section>
      </main>
    </div>
  );
}
