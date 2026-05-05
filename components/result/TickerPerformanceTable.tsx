"use client";

import Link from "next/link";
import type { TickerPerformance } from "@/lib/simulation/types";
import { formatCompactKRW, formatPercentValue } from "./format";

type TickerPerformanceTableProps = {
  rows: TickerPerformance[];
};

function getValueClassName(value: number) {
  if (value > 0) {
    return "text-positive";
  }

  if (value < 0) {
    return "text-negative";
  }

  return "text-neutral-600 dark:text-neutral-300";
}

export function TickerPerformanceTable({ rows }: TickerPerformanceTableProps) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
      <div>
        <h2 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
          종목별 최종 성과
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          각 종목에 투입된 원금과 종료 시점 평가액을 비교합니다.
        </p>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-[760px] w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-xs uppercase text-neutral-500 dark:border-white/10 dark:text-neutral-400">
            <tr>
              <th className="py-3 pr-4 font-medium">종목</th>
              <th className="px-4 py-3 text-right font-medium">최종 원금</th>
              <th className="px-4 py-3 text-right font-medium">평가액</th>
              <th className="px-4 py-3 text-right font-medium">수익금</th>
              <th className="px-4 py-3 text-right font-medium">수익률</th>
              <th className="py-3 pl-4 text-right font-medium">최종 비중</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-white/10">
            {rows.map((row) => (
              <tr key={row.ticker}>
                <td className="py-3 pr-4">
                  <Link
                    href={`/asset/${encodeURIComponent(row.ticker)}`}
                    className="font-mono font-semibold text-neutral-950 underline-offset-4 hover:text-info hover:underline dark:text-neutral-50"
                  >
                    {row.ticker}
                  </Link>
                  <div className="mt-1 max-w-52 truncate text-xs text-neutral-500 dark:text-neutral-400">
                    {row.name_ko || row.name || "데이터 준비 중"}
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300">
                  {formatCompactKRW(row.contributions)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-neutral-950 dark:text-neutral-50">
                  {formatCompactKRW(row.finalValue)}
                </td>
                <td
                  className={`px-4 py-3 text-right font-medium ${getValueClassName(
                    row.profit,
                  )}`}
                >
                  {formatCompactKRW(row.profit)}
                </td>
                <td
                  className={`px-4 py-3 text-right font-medium ${getValueClassName(
                    row.returnRate,
                  )}`}
                >
                  {formatPercentValue(row.returnRate, 1)}
                </td>
                <td className="py-3 pl-4 text-right text-neutral-700 dark:text-neutral-300">
                  {formatPercentValue(row.finalWeight, 1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
