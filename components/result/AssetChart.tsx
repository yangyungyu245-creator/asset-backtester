"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import type { Props as LegendContentProps } from "recharts/types/component/DefaultLegendContent";
import type { SimulationPoint } from "@/lib/simulation/types";
import type { ComparisonSeries } from "@/lib/types/comparison";
import {
  formatCompactKRW,
  formatPercentValue,
  formatSignedKRW,
} from "./format";

type AssetChartProps = {
  data: SimulationPoint[];
  futureStartDate?: string;
  comparisons?: ComparisonSeries[];
};

type ChartPoint = SimulationPoint & {
  actualValue: number | null;
  futureValue: number | null;
  downValueSoft: number | null;
  downValueStrong: number | null;
  [key: `comparison${number}`]: number | null;
};

function formatXAxis(date: string, index: number, dataLength: number) {
  if (dataLength > 36) {
    if (index === 0 || index === dataLength - 1 || date.slice(5, 7) === "12") {
      return date.slice(0, 4);
    }

    return "";
  }

  if (dataLength > 12) {
    if (index === 0 || index === dataLength - 1 || index % 3 === 0) {
      return date.slice(0, 7);
    }

    return "";
  }

  return date.slice(0, 7);
}

function renderTooltip({ active, payload, label }: TooltipProps<number, string>) {
  const point = payload?.[0]?.payload as ChartPoint | undefined;

  if (!active || !point) {
    return null;
  }

  const profit = point.value - point.contributions;
  const profitRate = point.contributions > 0 ? (profit / point.contributions) * 100 : 0;
  const benchmarkDiff =
    point.benchmarkValue !== null && point.benchmarkValue !== undefined
      ? point.value - point.benchmarkValue
      : null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-medium">
      <p className="font-bold text-primary">
        {String(label ?? point.date)}
        {point.isFuture ? " · 미래 예측" : ""}
      </p>
      <div className="mt-2 grid gap-1 text-secondary">
        <p>포트폴리오: {formatCompactKRW(point.value)}</p>
        {point.benchmarkValue !== null && point.benchmarkValue !== undefined ? (
          <p>S&P 500 (VOO): {formatCompactKRW(point.benchmarkValue)}</p>
        ) : null}
        <p>누적 원금: {formatCompactKRW(point.contributions)}</p>
        <p className={profit >= 0 ? "text-up" : "text-down"}>
          수익: {formatSignedKRW(profit)} ({formatPercentValue(profitRate)})
        </p>
        {benchmarkDiff !== null ? (
          <p className={benchmarkDiff >= 0 ? "text-up" : "text-down"}>
            VOO 대비 {formatSignedKRW(benchmarkDiff)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function renderLegend({ payload }: LegendContentProps) {
  const entries =
    payload?.filter((entry) => {
      const dataKey = String(entry.dataKey);
      return (
        ["actualValue", "futureValue", "contributions", "benchmarkValue"].includes(
          dataKey,
        ) || dataKey.startsWith("comparison")
      );
    }) ?? [];

  if (entries.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-secondary">
      {entries.map((entry) => {
        const dataKey = String(entry.dataKey);
        const dashed =
          dataKey === "contributions" ||
          dataKey === "futureValue" ||
          dataKey.startsWith("comparison");

        return (
          <li key={String(entry.dataKey)} className="inline-flex items-center gap-2">
            <span
              className="inline-block h-0 w-6 border-t-2"
              style={{
                borderColor: entry.color,
                borderTopStyle: dashed ? "dashed" : "solid",
              }}
              aria-hidden="true"
            />
            <span>{String(entry.value)}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function AssetChart({ data, futureStartDate, comparisons = [] }: AssetChartProps) {
  let downStreak = 0;
  const firstFutureIndex = data.findIndex((point) => point.isFuture);
  const enabledComparisons = comparisons.filter((comparison) => comparison.enabled);
  const comparisonMaps = enabledComparisons.map(
    (comparison) =>
      new Map(comparison.timeSeries.map((point) => [point.date, point.value])),
  );
  const chartData: ChartPoint[] = data.map((point, index) => {
    const previous = data[index - 1];
    const isDown = Boolean(previous && point.value < previous.value && !point.isFuture);
    downStreak = isDown ? downStreak + 1 : 0;
    const bridgeToFuture = firstFutureIndex > 0 && index === firstFutureIndex - 1;

    return {
      ...point,
      actualValue: point.isFuture ? null : point.value,
      futureValue: point.isFuture || bridgeToFuture ? point.value : null,
      downValueSoft: isDown ? point.value : null,
      downValueStrong: downStreak >= 3 ? point.value : null,
      ...Object.fromEntries(
        comparisonMaps.map((values, comparisonIndex) => [
          `comparison${comparisonIndex}`,
          values.get(point.date) ?? null,
        ]),
      ),
    };
  });
  const hasBenchmark = chartData.some(
    (point) => point.benchmarkValue !== null && point.benchmarkValue !== undefined,
  );
  const hasFuture = chartData.some((point) => point.isFuture);

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-subtle sm:p-5">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-primary">
            자산 추이
          </h2>
          <p className="mt-1 text-sm text-secondary">
            평가금액, 누적 원금, 같은 조건의 S&P 500 (VOO) 결과를 비교합니다.
          </p>
        </div>
      </div>
      <div className="h-[280px] w-full min-w-0 max-w-full md:h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="advancedAssetValue" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-value)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--chart-value)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="advancedAssetFuture" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-value)" stopOpacity={0.16} />
                <stop offset="95%" stopColor="var(--chart-value)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="advancedAssetDrawdownSoft" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-down)" stopOpacity={0.22} />
                <stop offset="95%" stopColor="var(--chart-down)" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="advancedAssetDrawdownStrong" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-down)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--chart-down)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="var(--chart-grid)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              minTickGap={28}
              tickFormatter={(value, index) =>
                formatXAxis(String(value), index, data.length)
              }
              tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(value) => formatCompactKRW(Number(value))}
              tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={64}
            />
            <Tooltip content={renderTooltip} />
            <Legend
              iconType="plainline"
              wrapperStyle={{ color: "var(--chart-axis)", fontSize: 12 }}
              content={renderLegend}
            />
            <Area
              name="포트폴리오"
              type="monotone"
              dataKey="actualValue"
              stroke="var(--chart-value)"
              strokeWidth={3}
              fill="url(#advancedAssetValue)"
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
            {hasFuture ? (
              <Area
                name="미래 예측"
                type="monotone"
                dataKey="futureValue"
                stroke="var(--chart-value)"
                strokeDasharray="6 4"
                strokeWidth={3}
                fill="url(#advancedAssetFuture)"
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls={false}
              />
            ) : null}
            <Area
              name="하락 구간"
              type="monotone"
              dataKey="downValueSoft"
              stroke="none"
              fill="url(#advancedAssetDrawdownSoft)"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              connectNulls={false}
              legendType="none"
            />
            <Area
              name="큰 하락 구간"
              type="monotone"
              dataKey="downValueStrong"
              stroke="none"
              fill="url(#advancedAssetDrawdownStrong)"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              connectNulls={false}
              legendType="none"
            />
            <Line
              name="누적 원금"
              type="monotone"
              dataKey="contributions"
              stroke="var(--chart-contribution)"
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
            />
            {hasBenchmark ? (
              <Line
                name="S&P 500 (VOO)"
                type="monotone"
                dataKey="benchmarkValue"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={false}
                connectNulls={false}
              />
            ) : null}
            {enabledComparisons.map((comparison, comparisonIndex) => (
              <Line
                key={comparison.id}
                name={comparison.name}
                type="monotone"
                dataKey={`comparison${comparisonIndex}`}
                stroke={comparison.color}
                strokeDasharray="6 4"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
            ))}
            {hasFuture && futureStartDate ? (
              <ReferenceLine
                x={futureStartDate}
                stroke="#a3a3a3"
                strokeDasharray="2 2"
                label={{
                  value: "오늘",
                  position: "top",
                  fill: "#a3a3a3",
                  fontSize: 12,
                }}
              />
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
