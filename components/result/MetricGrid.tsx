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
};

export function MetricGrid({
  result,
  startDate,
  endDate,
  initialAmount,
}: MetricGridProps) {
  const { years, months } = getMonthSpan(startDate, endDate);
  const returnRate =
    result.totalContributions > 0
      ? (result.totalReturn / result.totalContributions) * 100
      : 0;
  const cagrPercent = result.cagr * 100;

  const metrics = [
    {
      label: "최종 자산",
      value: formatCompactKRW(result.finalValue),
      helper: `${years}년 ${months}개월 후`,
      featured: true,
    },
    {
      label: "총 원금",
      value: formatCompactKRW(result.totalContributions),
      helper: formatContributionBreakdown(initialAmount, result.totalContributions),
    },
    {
      label: "총 수익",
      value: formatSignedKRW(result.totalReturn),
      helper: formatPercentValue(returnRate),
      tone: result.totalReturn >= 0 ? "positive" : "negative",
    },
    {
      label: "연평균 수익률",
      value: `${formatPercentValue(cagrPercent, 2)}`,
      helper: "전체 기간 CAGR",
      tone: cagrPercent >= 0 ? "positive" : "negative",
    },
  ] as const;

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {metrics.map((metric, index) => (
        <MetricCard key={metric.label} {...metric} index={index} />
      ))}
    </section>
  );
}
