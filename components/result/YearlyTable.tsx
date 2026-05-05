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
    <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
      <div className="flex flex-col gap-4 border-b border-neutral-200 p-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
            상세 표
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            기간별 평가금액, 원금, 수익 흐름을 확인합니다.
          </p>
        </div>
        <div className="inline-flex rounded-md border border-neutral-200 bg-neutral-50 p-1 text-sm dark:border-white/10 dark:bg-neutral-950">
          <button
            type="button"
            onClick={() => setMode("yearly")}
            className={`rounded px-3 py-1.5 font-medium transition ${
              mode === "yearly"
                ? "bg-neutral-950 text-white dark:bg-neutral-50 dark:text-neutral-950"
                : "text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-neutral-50"
            }`}
          >
            연도별
          </button>
          <button
            type="button"
            onClick={() => setMode("monthly")}
            className={`rounded px-3 py-1.5 font-medium transition ${
              mode === "monthly"
                ? "bg-neutral-950 text-white dark:bg-neutral-50 dark:text-neutral-950"
                : "text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-neutral-50"
            }`}
          >
            월별
          </button>
        </div>
      </div>
      <div className="max-h-[520px] overflow-auto">
        <table className="w-full min-w-[44rem] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
            <tr>
              <th className="px-4 py-3 text-left font-medium">
                {mode === "yearly" ? "연도" : "월"}
              </th>
              <th className="px-4 py-3 text-right font-medium">누적 원금</th>
              <th className="px-4 py-3 text-right font-medium">평가금액</th>
              <th className="px-4 py-3 text-right font-medium">
                {mode === "yearly" ? "그 해 수익" : "그 달 수익"}
              </th>
              <th className="px-4 py-3 text-right font-medium">누적 수익률</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-white/10">
            {mode === "yearly"
              ? rows.map((row) => {
                  cumulativePrincipal += row.contributionsThisYear;
                  const yearProfit =
                    row.endValue - row.startValue - row.contributionsThisYear;

                  return (
                    <tr
                      key={row.year}
                      className="transition hover:bg-neutral-50 dark:hover:bg-white/5"
                    >
                      <td className="px-4 py-3 font-medium text-neutral-800 dark:text-neutral-200">
                        {row.year}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-600 dark:text-neutral-300">
                        {formatCompactKRW(cumulativePrincipal)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-neutral-950 dark:text-neutral-50">
                        {formatCompactKRW(row.endValue)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium ${
                          yearProfit >= 0 ? "text-positive" : "text-negative"
                        }`}
                      >
                        {formatSignedKRW(yearProfit)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium ${
                          row.cumReturn >= 0 ? "text-positive" : "text-negative"
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
                    className="transition hover:bg-neutral-50 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3 font-medium text-neutral-800 dark:text-neutral-200">
                      {row.month}
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-600 dark:text-neutral-300">
                      {formatCompactKRW(row.contributions)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-neutral-950 dark:text-neutral-50">
                      {formatCompactKRW(row.endValue)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${
                        row.monthProfit >= 0 ? "text-positive" : "text-negative"
                      }`}
                    >
                      {formatSignedKRW(row.monthProfit)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${
                        row.cumReturn >= 0 ? "text-positive" : "text-negative"
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
