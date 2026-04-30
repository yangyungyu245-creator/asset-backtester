import type { YearlyBreakdown } from "@/lib/simulation/types";
import {
  formatCompactKRW,
  formatPercentValue,
  formatSignedKRW,
} from "./format";

type YearlyTableProps = {
  rows: YearlyBreakdown[];
  initialAmount: number;
};

export function YearlyTable({ rows, initialAmount }: YearlyTableProps) {
  let cumulativePrincipal = initialAmount;

  return (
    <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
      <div className="border-b border-neutral-200 p-5 dark:border-white/10">
        <h2 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
          연도별 상세
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          매년 말 기준 평가금액과 수익 흐름입니다.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] border-collapse text-sm">
          <thead className="bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
            <tr>
              <th className="px-4 py-3 text-left font-medium">연도</th>
              <th className="px-4 py-3 text-right font-medium">누적 원금</th>
              <th className="px-4 py-3 text-right font-medium">평가금액</th>
              <th className="px-4 py-3 text-right font-medium">그 해 수익</th>
              <th className="px-4 py-3 text-right font-medium">누적 수익률</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-white/10">
            {rows.map((row) => {
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
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
