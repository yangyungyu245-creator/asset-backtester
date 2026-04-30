"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TooltipProps } from "recharts";
import type { PortfolioSnapshot } from "@/lib/simulation/types";
import {
  formatCompactKRW,
} from "./format";

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

function createChangeSummary(
  initialPortfolio: PortfolioSnapshot[],
  finalPortfolio: PortfolioSnapshot[],
) {
  const initialMap = new Map(
    initialPortfolio.map((item) => [item.ticker, item.weight]),
  );
  const changes = finalPortfolio
    .map((item) => ({
      ticker: item.ticker,
      name: item.name_ko || item.name,
      from: initialMap.get(item.ticker) ?? 0,
      to: item.weight,
      diff: item.weight - (initialMap.get(item.ticker) ?? 0),
    }))
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  const increased = [...changes].sort((a, b) => b.diff - a.diff)[0];
  const decreased = [...changes].sort((a, b) => a.diff - b.diff)[0];

  return { increased, decreased };
}

function formatPercentagePoint(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%p`;
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
  const { increased, decreased } = createChangeSummary(
    initialPortfolio,
    finalPortfolio,
  );

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
        <PortfolioDonut
          title="시작"
          data={initialPortfolio}
          colorMap={colorMap}
        />
        <PortfolioDonut
          title={`종료 (${endDate})`}
          data={finalPortfolio}
          colorMap={colorMap}
        />
      </div>
      <div className="mt-4 grid gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-300">
        {increased ? (
          <p>
            <span
              className="font-semibold"
              style={{ color: colorMap.get(increased.ticker) }}
            >
              {increased.ticker}
            </span>
            의 비중이 {increased.from.toFixed(1)}% → {increased.to.toFixed(1)}%로
            증가했습니다 ({formatPercentagePoint(increased.diff)}).
          </p>
        ) : null}
        {decreased && decreased.ticker !== increased?.ticker ? (
          <p>
            <span
              className="font-semibold"
              style={{ color: colorMap.get(decreased.ticker) }}
            >
              {decreased.ticker}
            </span>
            의 비중이 {decreased.from.toFixed(1)}% → {decreased.to.toFixed(1)}%로
            감소했습니다 ({formatPercentagePoint(decreased.diff)}).
          </p>
        ) : null}
      </div>
    </section>
  );
}
