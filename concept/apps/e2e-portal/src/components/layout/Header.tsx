export default function Header() {
  return (
    <header className="bg-white border-b border-portal-border px-6 py-5 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        <div>
          <h1 className="font-mono text-portal-heading text-[28px] font-bold tracking-wide">
            E2E Testing Portal
          </h1>
          <p className="text-portal-muted text-sm mt-1">
            Taskify • Playwright Test Suite
          </p>
        </div>
      </div>
    </header>
  );
}
