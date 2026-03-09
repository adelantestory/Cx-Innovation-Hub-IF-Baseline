interface ProgressBarProps {
  completed: number;
  total: number;
}

export default function ProgressBar({ completed, total }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between font-mono text-sm">
        <span className="text-[#b0b0b0]">{pct}%</span>
        <span className="text-portal-muted">
          {completed} / {total} tests
        </span>
      </div>
      <div className="bg-portal-border/50 rounded-full h-4 overflow-hidden">
        <div
          className="bg-[#b0b0b0] rounded-full h-4 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
