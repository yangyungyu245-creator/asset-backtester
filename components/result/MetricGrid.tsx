import type { SimulationResult } from "@/lib/simulation/types";
import { MetricCard } from "./MetricCard";
import {
  formatContributionBreakdown,
  formatCompactKRW,
  formatPercentValue,
  formatSignedKRW,
  getMonthSpan,
} from "./format";

type MetricGridProps = {
  result: SimulationResult;
  startDate: string;
  endDate: string;
  initialAmount: number;
  inflationAdjusted?: boolean;
};

export function MetricGrid({
  result,
  startDate,
  endDate,
  initialAmount,
  inflationAdjusted = false,
}: MetricGridProps) {
  const { years, months } = getMonthSpan(startDate, endDate);
  const returnRate =
    result.totalContributions > 0
      ? (result.totalReturn / result.totalContributions) * 100
      : 0;
  const cagrPercent = result.cagr * 100;
  const drawdownDateRange =
    result.maxDrawdown.peakDate && result.maxDrawdown.troughDate
      ? `${result.maxDrawdown.peakDate} ~ ${result.maxDrawdown.troughDate}`
      : "하락 구간 없음";
  const futureSuffix = result.futureProjection ? " · 실제 데이터 구간 기준" : "";

  const metrics = [
    {
      label: `최종 자산${inflationAdjusted ? " (실질)" : ""}`,
      value: formatCompactKRW(result.finalValue),
      helper: `${years}년 ${months}개월 후`,
      featured: true,
    },
    {
      label: `총 원금${inflationAdjusted ? " (실질)" : ""}`,
      value: formatCompactKRW(result.totalContributions),
      helper: formatContributionBreakdown(initialAmount, result.totalContributions),
    },
    {
      label: `총 수익${inflationAdjusted ? " (실질)" : ""}`,
      value: formatSignedKRW(result.totalReturn),
      helper: formatPercentValue(returnRate),
      tone: result.totalReturn >= 0 ? "positive" : "negative",
    },
    {
      label: "평균 수익률",
      value: `${formatPercentValue(cagrPercent, 2)}`,
      helper: "전체 기간 CAGR",
      tone: cagrPercent >= 0 ? "positive" : "negative",
    },
    {
      label: "최대 낙폭",
      value: formatPercentValue(result.maxDrawdown.percent, 1),
      helper: `${drawdownDateRange}${futureSuffix}`,
      tone: "negative",
    },
  ] as const;

  return (
    <section className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
      {metrics.map((metric, index) => (
        <MetricCard key={metric.label} {...metric} index={index} />
      ))}
    </section>
  );
}
