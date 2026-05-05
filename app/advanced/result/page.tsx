"use client";

import { AssetChart } from "@/components/result/AssetChart";
import { DataWarnings } from "@/components/result/DataWarnings";
import { MetricGrid } from "@/components/result/MetricGrid";
import { PortfolioComparison } from "@/components/result/PortfolioComparison";
import { ResultActions } from "@/components/result/ResultActions";
import { ResultHeader } from "@/components/result/ResultHeader";
import { TickerPerformanceTable } from "@/components/result/TickerPerformanceTable";
import { YearlyTable } from "@/components/result/YearlyTable";
import { SaveActionButton } from "@/components/saved/SaveActionButton";
import { AdPlaceholder } from "@/components/simulator/AdPlaceholder";
import { Button } from "@/components/ui/Button";
import { formatCompactKRW, formatPercentValue } from "@/components/result/format";
import { useSimulationStore } from "@/store/useSimulationStore";

function formatMonths(months: number) {
  const years = Math.floor(months / 12);
  const rest = months % 12;

  if (years === 0) {
    return `${rest}개월`;
  }

  if (rest === 0) {
    return `${years}년`;
  }

  return `${years}년 ${rest}개월`;
}

export default function AdvancedResultPage() {
  const {
    startDate,
    endDate,
    selectedTickers,
    initialAmount,
    contributionSchedule,
    options,
    simulationResult,
    simulationError,
  } = useSimulationStore();

  if (simulationError) {
    return (
      <section className="mx-auto grid max-w-xl gap-5 py-16 text-center">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
            시뮬레이션 중 문제가 발생했습니다
          </h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
            {simulationError}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild href="/advanced/loading">
            다시 시도
          </Button>
          <Button asChild href="/advanced/dates" variant="outline">
            처음으로
          </Button>
        </div>
      </section>
    );
  }

  if (!simulationResult) {
    return (
      <section className="mx-auto grid max-w-xl gap-5 py-16 text-center">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
            결과가 없습니다
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

  const futureProjection = simulationResult.futureProjection;

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
      {futureProjection ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="text-sm">
            <p className="font-semibold text-neutral-950 dark:text-neutral-50">
              미래 시점 예측 포함
            </p>
            <p className="mt-2 leading-6 text-neutral-700 dark:text-neutral-300">
              {formatMonths(futureProjection.futureMonths)} 미래 구간은 과거 5년 평균 수익률
              (포트폴리오 연 {formatPercentValue(futureProjection.portfolioCAGR * 100, 2)})
              기반 단순 복리로 계산했습니다. 실제 시장은 변동이 크며 결과가 크게 다를 수 있습니다.
            </p>
            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              오늘 시점 평가금액: {formatCompactKRW(futureProjection.realFinalValue)}
            </p>
          </div>
        </div>
      ) : null}
      <MetricGrid
        result={simulationResult}
        startDate={startDate}
        endDate={endDate}
        initialAmount={initialAmount}
        inflationAdjusted={options.inflationAdjusted}
      />
      <div className="flex justify-end">
        <SaveActionButton label="전략 저장" />
      </div>
      <AssetChart
        data={simulationResult.timeSeries}
        futureStartDate={futureProjection?.startDate}
      />
      <PortfolioComparison
        initialPortfolio={simulationResult.initialPortfolio ?? []}
        finalPortfolio={simulationResult.finalPortfolio ?? []}
        endDate={futureProjection?.startDate ?? endDate}
      />
      <TickerPerformanceTable rows={simulationResult.tickerPerformance ?? []} />
      <AdPlaceholder />
      <YearlyTable
        rows={simulationResult.yearlyBreakdown}
        timeSeries={simulationResult.timeSeries}
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
