interface StepDescriptionCardProps {
  testName: string;
  description: string;
  objective?: string;
  flowSteps?: string[];
  isActive: boolean;
}

export default function StepDescriptionCard({
  testName,
  description,
  objective,
  flowSteps,
  isActive,
}: StepDescriptionCardProps) {
  return (
    <div className="bg-portal-card border border-portal-border border-l-4 border-l-portal-accent rounded-lg p-5 space-y-3 shadow-sm">
      <div className="flex items-center gap-2">
        {isActive && (
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-portal-accent animate-pulse" />
        )}
        <h4 className="text-portal-heading font-bold text-[24px]">{testName.charAt(0).toUpperCase() + testName.slice(1)}</h4>
      </div>

      <p className="text-portal-muted text-sm leading-relaxed">{description}</p>

      {objective && (
        <div className="flex items-start gap-2">
          <span className="text-sm mt-0.5">🎯</span>
          <p className="text-portal-muted text-sm">
            <span className="text-portal-accent font-medium">Objective: </span>
            {objective}
          </p>
        </div>
      )}

      {flowSteps && flowSteps.length > 0 && (
        <div className="mt-2">
          <p className="text-portal-heading text-[22px] font-bold font-mono uppercase tracking-wider mb-2">
            Test Steps
          </p>
          <ol className="space-y-1.5">
            {flowSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-portal-text font-mono text-xs mt-0.5 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-portal-muted">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
