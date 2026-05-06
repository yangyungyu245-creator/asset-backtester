"use client";

import { useMemo, useState } from "react";
import type { SimulationPoint, YearlyBreakdown } from "@/lib/simulation/types";
import {
  formatCompactKRW,
  formatPercentValue,
  formatSignedKRW,
} from "./format";

type YearlyTableProps = {
  rows: YearlyBreakdown[];
  timeSeries: SimulationPoint[];
  initialAmount: number;
};

type MonthlyRow = {
  month: string;
  contributions: number;
  endValue: number;
  monthProfit: number;
  cumReturn: number;
  isFuture?: boolean;
};

function createMonthlyRows(timeSeries: SimulationPoint[], initialAmount: number) {
  const rows: MonthlyRow[] = [];
  let previousValue = initialAmount;
  let previousContributions = initialAmount;

  for (const point of timeSeries) {
    const contributionThisMonth = Math.max(
      0,
      point.contributions - previousContributions,
    );
    const monthProfit = point.value - previousValue - contributionThisMonth;
    const cumReturn =
      point.contributions > 0
        ? ((point.value - point.contributions) / point.contributions) * 100
        : 0;

    rows.push({
      month: point.date.slice(0, 7),
      contributions: point.contributions,
      endValue: point.value,
      monthProfit,
      cumReturn,
      isFuture: point.isFuture,
    });

    previousValue = point.value;
    previousContributions = point.contributions;
  }

  return rows;
}

export function YearlyTable({ rows, timeSeries, initialAmount }: YearlyTableProps) {
  const [mode, setMode] = useState<"yearly" | "monthly">("yearly");
  const monthlyRows = useMemo(
    () => createMonthlyRows(timeSeries, initialAmount),
    [initialAmount, timeSeries],
  );
  let cumulativePrincipal = initialAmount;

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-subtle">
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-primary">
            상세 내역
          </h2>
          <p className="mt-1 text-sm text-secondary">
            기간별 평가금액, 원금, 수익 흐름을 확인합니다.
          </p>
        </div>
        <div className="inline-flex rounded-lg bg-card-subtle p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode("yearly")}
            className={`rounded px-3 py-1.5 font-medium transition ${
              mode === "yearly"
                ? "bg-card text-primary shadow-subtle"
                : "text-secondary hover:text-primary"
            }`}
          >
            연도별
          </button>
          <button
            type="button"
            onClick={() => setMode("monthly")}
            className={`rounded px-3 py-1.5 font-medium transition ${
              mode === "monthly"
                ? "bg-card text-primary shadow-subtle"
                : "text-secondary hover:text-primary"
            }`}
          >
            월별
          </button>
        </div>
      </div>
      <div className="max-h-[520px] max-w-full overflow-auto">
        <table className="w-full min-w-[44rem] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-card-subtle text-secondary">
            <tr>
              <th className="px-4 py-3 text-left font-medium">
                {mode === "yearly" ? "연도" : "월"}
              </th>
              <th className="px-4 py-3 text-right font-medium">누적 원금</th>
              <th className="px-4 py-3 text-right font-medium">평가금액</th>
              <th className="px-4 py-3 text-right font-medium">
                {mode === "yearly" ? "연간 수익" : "월간 수익"}
              </th>
              <th className="px-4 py-3 text-right font-medium">누적 수익률</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mode === "yearly"
              ? rows.map((row) => {
                  cumulativePrincipal += row.contributionsThisYear;
                  const yearProfit =
                    row.endValue - row.startValue - row.contributionsThisYear;

                  return (
                    <tr
                      key={row.year}
                      className="transition hover:bg-card-subtle"
                    >
                      <td className="px-4 py-3 font-bold text-primary">
                        {row.year}
                      </td>
                      <td className="px-4 py-3 text-right text-secondary">
                        {formatCompactKRW(cumulativePrincipal)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-primary">
                        {formatCompactKRW(row.endValue)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium ${
                          yearProfit >= 0 ? "text-up" : "text-down"
                        }`}
                      >
                        {formatSignedKRW(yearProfit)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium ${
                          row.cumReturn >= 0 ? "text-up" : "text-down"
                        }`}
                      >
                        {formatPercentValue(row.cumReturn)}
                      </td>
                    </tr>
                  );
                })
              : monthlyRows.map((row) => (
                  <tr
                    key={row.month}
                    className="transition hover:bg-card-subtle"
                  >
                    <td className="px-4 py-3 font-bold text-primary">
                      {row.month}
                      {row.isFuture ? (
                        <span className="ml-2 text-xs text-amber-500">예측</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right text-secondary">
                      {formatCompactKRW(row.contributions)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-primary">
                      {formatCompactKRW(row.endValue)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${
                        row.monthProfit >= 0 ? "text-up" : "text-down"
                      }`}
                    >
                      {formatSignedKRW(row.monthProfit)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${
                        row.cumReturn >= 0 ? "text-up" : "text-down"
                      }`}
                    >
                      {formatPercentValue(row.cumReturn)}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
