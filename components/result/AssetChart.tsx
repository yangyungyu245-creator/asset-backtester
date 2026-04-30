"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import type { SimulationPoint } from "@/lib/simulation/types";
import {
  formatCompactKRW,
  formatPercentValue,
  formatSignedKRW,
} from "./format";

type AssetChartProps = {
  data: SimulationPoint[];
};

type ChartPoint = SimulationPoint & {
  downValueSoft: number | null;
  downValueStrong: number | null;
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

  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-white/10 dark:bg-neutral-950">
      <p className="font-medium text-neutral-950 dark:text-neutral-50">
        {String(label ?? point.date)}
      </p>
      <div className="mt-2 grid gap-1 text-neutral-600 dark:text-neutral-300">
        <p>평가금액: {formatCompactKRW(point.value)}</p>
        <p>누적 원금: {formatCompactKRW(point.contributions)}</p>
        <p className={profit >= 0 ? "text-positive" : "text-negative"}>
          수익: {formatSignedKRW(profit)} ({formatPercentValue(profitRate)})
        </p>
      </div>
    </div>
  );
}

export function AssetChart({ data }: AssetChartProps) {
  let downStreak = 0;
  const chartData: ChartPoint[] = data.map((point, index) => {
    const previous = data[index - 1];
    const isDown = Boolean(previous && point.value < previous.value);
    downStreak = isDown ? downStreak + 1 : 0;

    return {
      ...point,
      downValueSoft: isDown ? point.value : null,
      downValueStrong: downStreak >= 3 ? point.value : null,
    };
  });

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a] sm:p-5">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
            자산 추이
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            평가금액과 누적 원금을 월 단위로 비교합니다.
          </p>
        </div>
      </div>
      <div className="h-[280px] w-full md:h-[360px]">
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
              payload={[
                {
                  value: "평가금액",
                  type: "plainline",
                  color: "var(--chart-value)",
                  id: "value",
                },
                {
                  value: "누적 원금",
                  type: "plainline",
                  color: "var(--chart-contribution)",
                  id: "contributions",
                },
              ]}
            />
            <Area
              name="평가금액"
              type="monotone"
              dataKey="value"
              stroke="var(--chart-value)"
              strokeWidth={3}
              fill="url(#advancedAssetValue)"
              dot={false}
              activeDot={{ r: 4 }}
            />
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
              name="긴 하락 구간"
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
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
