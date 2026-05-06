"use client";

import Link from "next/link";
import type { TickerPerformance } from "@/lib/simulation/types";
import { formatCompactKRW, formatPercentValue } from "./format";

type TickerPerformanceTableProps = {
  rows: TickerPerformance[];
};

function getValueClassName(value: number) {
  if (value > 0) {
    return "text-up";
  }

  if (value < 0) {
    return "text-down";
  }

  return "text-secondary";
}

export function TickerPerformanceTable({ rows }: TickerPerformanceTableProps) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-subtle sm:p-5">
      <div>
        <h2 className="text-[22px] font-bold text-primary">
          종목별 최종 성과
        </h2>
        <p className="mt-1 text-sm text-secondary">
          각 종목에 투입된 원금과 종료 시점 평가액을 비교합니다.
        </p>
      </div>

      <div className="mt-5 max-w-full overflow-x-auto">
        <table className="min-w-[760px] w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-secondary">
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
                    className="font-mono font-bold text-primary underline-offset-4 hover:text-brand hover:underline"
                  >
                    {row.ticker}
                  </Link>
                  <div className="mt-1 max-w-52 truncate text-xs text-secondary">
                    {row.name_ko || row.name || "데이터 준비 중"}
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-secondary">
                  {formatCompactKRW(row.contributions)}
                </td>
                <td className="px-4 py-3 text-right font-bold text-primary">
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
                <td className="py-3 pl-4 text-right text-secondary">
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
