import Header from "./components/layout/Header";
import TestExecutionPanel from "./components/execution/TestExecutionPanel";
import CITestExecutionPanel from "./components/ci/CITestExecutionPanel";

export default function App() {

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 w-full px-4 py-6 space-y-8">
        {/* Local Test Execution — full width */}
        <section className="space-y-4">
          <h2 className="font-mono text-[24px] font-bold text-portal-heading uppercase tracking-wider">
            ▸ Local Test Execution
          </h2>
          <TestExecutionPanel />
        </section>

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
