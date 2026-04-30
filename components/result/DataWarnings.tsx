import type { SimulationResult } from "@/lib/simulation/types";

type DataWarningsProps = {
  warnings: SimulationResult["warnings"];
  dataIssues: SimulationResult["dataIssues"];
};

export function DataWarnings({ warnings, dataIssues }: DataWarningsProps) {
  if (warnings.length === 0 && dataIssues.length === 0) {
    return null;
  }

  return (
    <section className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
      <h2 className="font-semibold">참고사항</h2>
      <ul className="mt-2 grid gap-1">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
        {dataIssues.map((issue) => (
          <li key={`${issue.ticker}-${issue.issue}`}>
            {issue.ticker}: {issue.issue}
          </li>
        ))}
      </ul>
    </section>
  );
}
