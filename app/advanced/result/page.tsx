"use client";

import { AssetChart } from "@/components/result/AssetChart";
import { DataWarnings } from "@/components/result/DataWarnings";
import { MetricGrid } from "@/components/result/MetricGrid";
import { PortfolioComparison } from "@/components/result/PortfolioComparison";
import { ResultActions } from "@/components/result/ResultActions";
import { ResultHeader } from "@/components/result/ResultHeader";
import { YearlyTable } from "@/components/result/YearlyTable";
import { Button } from "@/components/ui/Button";
import { useSimulationStore } from "@/store/useSimulationStore";

export default function AdvancedResultPage() {
  const {
    startDate,
    endDate,
    selectedTickers,
    initialAmount,
    contributionSchedule,
    options,
    simulationResult,
  } = useSimulationStore();

  if (!simulationResult) {
    return (
      <section className="mx-auto grid max-w-xl gap-5 py-16 text-center">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
            시뮬레이션 결과가 없습니다
          </h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
            날짜와 종목을 선택한 뒤 고급 시뮬레이션을 실행해 주세요.
          </p>
        </div>
        <Button asChild href="/advanced/dates" className="mx-auto">
          고급 모드 시작
        </Button>
      </section>
    );
  }

  return (
    <section className="grid gap-6 py-4 sm:py-6">
      <ResultHeader
        startDate={startDate}
        endDate={endDate}
        selectedTickers={selectedTickers}
        initialAmount={initialAmount}
        contributionSchedule={contributionSchedule}
        options={options}
      />
      <MetricGrid
        result={simulationResult}
        startDate={startDate}
        endDate={endDate}
        initialAmount={initialAmount}
        inflationAdjusted={options.inflationAdjusted}
      />
      <AssetChart data={simulationResult.timeSeries} />
      <PortfolioComparison
        initialPortfolio={simulationResult.initialPortfolio ?? []}
        finalPortfolio={simulationResult.finalPortfolio ?? []}
        endDate={endDate}
      />
      <YearlyTable
        rows={simulationResult.yearlyBreakdown}
        initialAmount={initialAmount}
      />
      <DataWarnings
        warnings={simulationResult.warnings}
        dataIssues={simulationResult.dataIssues}
      />
      <ResultActions />
    </section>
  );
}
