"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatKRW } from "@/lib/utils/format";
import { useSimulationStore } from "@/store/useSimulationStore";

export default function AdvancedResultPage() {
  const router = useRouter();
  const { simulationResult } = useSimulationStore();

  useEffect(() => {
    if (!simulationResult) {
      router.replace("/advanced/setup");
    }
  }, [router, simulationResult]);

  if (!simulationResult) {
    return null;
  }

  const metrics = [
    { label: "최종 자산", value: formatKRW(simulationResult.finalValue) },
    { label: "총 원금", value: formatKRW(simulationResult.totalContributions) },
    { label: "총 수익", value: formatKRW(simulationResult.totalReturn) },
    { label: "CAGR", value: `${(simulationResult.cagr * 100).toFixed(2)}%` },
  ];

  return (
    <section className="grid gap-6 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-950 dark:text-neutral-50">
            고급 모드 결과
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Phase 4 검증용 임시 화면입니다.
          </p>
        </div>
        <Button asChild href="/advanced/setup" variant="outline">
          다른 시나리오
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]"
          >
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {metric.label}
            </p>
            <p className="mt-2 text-xl font-semibold text-neutral-950 dark:text-neutral-50 md:text-2xl">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {simulationResult.warnings.length > 0 ? (
        <section className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
          <h2 className="font-semibold">Warnings</h2>
          <ul className="mt-2 list-disc pl-5">
            {simulationResult.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <pre className="max-h-[32rem] overflow-auto rounded-lg border border-neutral-200 bg-neutral-950 p-4 text-left text-xs text-neutral-50 dark:border-white/10">
        {JSON.stringify(simulationResult, null, 2)}
      </pre>
    </section>
  );
}
