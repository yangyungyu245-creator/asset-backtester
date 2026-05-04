"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TooltipProps } from "recharts";
import type { PortfolioSnapshot } from "@/lib/simulation/types";
import { formatCompactKRW } from "./format";

type PortfolioComparisonProps = {
  initialPortfolio: PortfolioSnapshot[];
  finalPortfolio: PortfolioSnapshot[];
  endDate: string;
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

function getColorMap(portfolios: PortfolioSnapshot[][]) {
  const tickers = Array.from(
    new Set(portfolios.flatMap((portfolio) => portfolio.map((item) => item.ticker))),
  );

  return new Map(
    tickers.map((ticker, index) => [ticker, COLORS[index % COLORS.length]]),
  );
}

function PortfolioTooltip({ active, payload }: TooltipProps<number, string>) {
  const item = payload?.[0]?.payload as PortfolioSnapshot | undefined;

  if (!active || !item) {
    return null;
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-white/10 dark:bg-neutral-950">
      <p className="font-medium text-neutral-950 dark:text-neutral-50">
        {item.ticker} ({item.name_ko || item.name})
      </p>
      <div className="mt-2 grid gap-1 text-neutral-600 dark:text-neutral-300">
        <p>보유: {item.shares.toFixed(4)}주</p>
        <p>평가금액: {formatCompactKRW(item.value)}</p>
        <p>비중: {item.weight.toFixed(1)}%</p>
      </div>
    </div>
  );
}

function PortfolioDonut({
  title,
  data,
  colorMap,
}: {
  title: string;
  data: PortfolioSnapshot[];
  colorMap: Map<string, string>;
}) {
  return (
    <div className="rounded-lg bg-neutral-50 p-4 dark:bg-white/5">
      <h3 className="text-sm font-semibold text-neutral-950 dark:text-neutral-50">
        {title}
      </h3>
      <div className="mt-3 h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="weight"
              nameKey="ticker"
              innerRadius={58}
              outerRadius={86}
              paddingAngle={2}
              stroke="var(--donut-stroke)"
              strokeWidth={2}
            >
              {data.map((item) => (
                <Cell
                  key={item.ticker}
                  fill={colorMap.get(item.ticker) ?? COLORS[0]}
                />
              ))}
            </Pie>
            <Tooltip content={<PortfolioTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid gap-2">
        {data.map((item) => (
          <div
            key={item.ticker}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2 text-neutral-700 dark:text-neutral-300">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: colorMap.get(item.ticker) ?? COLORS[0] }}
              />
              <span className="truncate">{item.ticker}</span>
            </span>
            <span className="font-medium text-neutral-950 dark:text-neutral-50">
              {item.weight.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function createChanges(
  initialPortfolio: PortfolioSnapshot[],
  finalPortfolio: PortfolioSnapshot[],
) {
  const initialMap = new Map(
    initialPortfolio.map((item) => [item.ticker, item]),
  );
  const finalMap = new Map(finalPortfolio.map((item) => [item.ticker, item]));
  const tickers = Array.from(
    new Set([...Array.from(initialMap.keys()), ...Array.from(finalMap.keys())]),
  );

  return tickers
    .map((ticker) => {
      const initial = initialMap.get(ticker);
      const final = finalMap.get(ticker);
      const from = initial?.weight ?? 0;
      const to = final?.weight ?? 0;

      return {
        ticker,
        name: final?.name_ko || initial?.name_ko || final?.name || initial?.name || "",
        from,
        to,
        diff: to - from,
      };
    })
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
}

function formatPercentagePoint(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%p`;
}

function getDiffClassName(value: number) {
  if (Math.abs(value) <= 1) {
    return "text-neutral-500 dark:text-neutral-400";
  }

  return value > 0 ? "text-positive" : "text-negative";
}

export function PortfolioComparison({
  initialPortfolio,
  finalPortfolio,
  endDate,
}: PortfolioComparisonProps) {
  if (initialPortfolio.length === 0 || finalPortfolio.length === 0) {
    return null;
  }

  const colorMap = getColorMap([initialPortfolio, finalPortfolio]);
  const changes = createChanges(initialPortfolio, finalPortfolio);

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
      <div>
        <h2 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
          포트폴리오 변화
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          시작 시점과 종료 시점의 종목 비중을 비교합니다.
        </p>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <PortfolioDonut title="시작" data={initialPortfolio} colorMap={colorMap} />
        <PortfolioDonut
          title={`종료 (${endDate})`}
          data={finalPortfolio}
          colorMap={colorMap}
        />
      </div>
      <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <h3 className="text-sm font-semibold text-neutral-950 dark:text-neutral-50">
          비중 변화
        </h3>
        <div className="mt-3 divide-y divide-neutral-200 dark:divide-white/10">
          {changes.map((change) => (
            <div
              key={change.ticker}
              className="grid gap-2 py-2 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: colorMap.get(change.ticker) ?? COLORS[0] }}
                />
                <span className="font-mono font-medium text-neutral-950 dark:text-neutral-50">
                  {change.ticker}
                </span>
                {change.name ? (
                  <span className="hidden truncate text-xs text-neutral-500 dark:text-neutral-400 sm:inline">
                    {change.name}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                <span>{change.from.toFixed(1)}%</span>
                <span className="text-neutral-400">→</span>
                <span className="font-medium text-neutral-950 dark:text-neutral-50">
                  {change.to.toFixed(1)}%
                </span>
                <span className={`font-medium ${getDiffClassName(change.diff)}`}>
                  ({formatPercentagePoint(change.diff)})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
