"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { SelectedTicker } from "@/store/useSimulationStore";

type PortfolioDonutProps = {
  tickers: SelectedTicker[];
};

const COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#14b8a6",
  "#ec4899",
];

export function PortfolioDonut({ tickers }: PortfolioDonutProps) {
  if (tickers.length === 0) {
    return null;
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
          종목 비중
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          시뮬레이션 시작 시점의 목표 비중입니다.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={tickers}
                dataKey="weight"
                nameKey="ticker"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={2}
                stroke="var(--donut-stroke)"
                strokeWidth={2}
              >
                {tickers.map((ticker, index) => (
                  <Cell
                    key={ticker.ticker}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name]}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--chart-grid)",
                  background: "var(--tooltip-bg)",
                  color: "var(--tooltip-text)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {tickers.map((ticker, index) => (
            <div
              key={ticker.ticker}
              className="flex items-center justify-between gap-3 rounded-md bg-neutral-50 px-3 py-2 text-sm dark:bg-white/5"
            >
              <span className="flex min-w-0 items-center gap-2 text-neutral-700 dark:text-neutral-300">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="truncate">{ticker.ticker}</span>
              </span>
              <span className="font-medium text-neutral-950 dark:text-neutral-50">
                {ticker.weight.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
