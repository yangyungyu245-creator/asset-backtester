"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AssetGrowthChart } from "@/components/charts/AssetGrowthChart";
import { LoadingScreen } from "@/components/simulator/LoadingScreen";
import { ResultMetrics } from "@/components/simulator/ResultMetrics";
import { SimpleInputForm } from "@/components/simulator/SimpleInputForm";
import {
  type SimpleSimulationInput,
  simulateSimple,
} from "@/lib/simulation/simple";
import { formatKRW } from "@/lib/utils/format";

type Phase = "input" | "loading" | "result";

const defaultInput: SimpleSimulationInput = {
  initialAmount: 0,
  annualRatePercent: 0,
  compoundFrequency: "monthly",
  contributionSchedule: [
    {
      id: "default-period",
      durationYears: 10,
      monthlyAmount: 0,
    },
  ],
};

export default function SimplePage() {
  const [phase, setPhase] = useState<Phase>("input");
  const [input, setInput] = useState<SimpleSimulationInput>(defaultInput);
  const result = useMemo(() => simulateSimple(input), [input]);

  const handleLoadingDone = useCallback(() => {
    setPhase("result");
  }, []);

  const chartData = useMemo(
    () =>
      result.yearlyBreakdown.map((row) => ({
        period: row.year,
        date: `${row.year}년차`,
        contributions: row.cumulativeContributions,
        value: row.endValue,
      })),
    [result.yearlyBreakdown],
  );

  if (phase === "loading") {
    return <LoadingScreen onDone={handleLoadingDone} />;
  }

  return (
    <section className="grid gap-8 py-4 sm:py-8">
      <div>
        <Link
          href="/"
          className="text-sm text-neutral-500 transition hover:text-info dark:text-neutral-400"
        >
          ← 모드 선택으로
        </Link>
        <h1 className="mt-4 text-3xl font-semibold text-neutral-950 dark:text-neutral-50">
          간단 모드
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-400">
          예금·적금처럼 초기 금액, 월 적립액, 연 수익률만으로 복리 결과를
          빠르게 계산합니다.
        </p>
      </div>

      {phase === "input" ? (
        <SimpleInputForm
          input={input}
          onChange={setInput}
          onSubmit={() => setPhase("loading")}
        />
      ) : (
        <div className="grid gap-6">
          <ResultMetrics
            finalValue={result.finalValue}
            totalContributions={result.totalContributions}
            totalReturn={result.totalReturn}
            effectiveAnnualRate={result.effectiveAnnualRate}
          />

          <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
                  자산 추이
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  평가금액과 누적 원금을 연도별로 비교합니다
                </p>
              </div>
            </div>
            <AssetGrowthChart data={chartData} />
          </section>

          <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
            <div className="border-b border-neutral-200 p-5 dark:border-white/10">
              <h2 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
                연도별 상세
              </h2>
            </div>
            <div className="max-h-96 overflow-auto">
              <table className="w-full min-w-[42rem] border-collapse text-sm">
                <thead className="sticky top-0 bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">연차</th>
                    <th className="px-4 py-3 text-right font-medium">누적 원금</th>
                    <th className="px-4 py-3 text-right font-medium">평가금액</th>
                    <th className="px-4 py-3 text-right font-medium">그 해 이자</th>
                    <th className="px-4 py-3 text-right font-medium">누적 수익률</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-white/10">
                  {result.yearlyBreakdown.map((row) => (
                    <tr key={row.year}>
                      <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                        {row.year}년차
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300">
                        {formatKRW(row.cumulativeContributions)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-neutral-950 dark:text-neutral-50">
                        {formatKRW(row.endValue)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right ${
                          row.interest >= 0 ? "text-positive" : "text-negative"
                        }`}
                      >
                        {row.interest >= 0 ? "+" : ""}
                        {formatKRW(row.interest)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right ${
                          row.cumReturn >= 0 ? "text-positive" : "text-negative"
                        }`}
                      >
                        {row.cumReturn >= 0 ? "+" : ""}
                        {row.cumReturn.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setPhase("input")}
              className="inline-flex h-11 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-medium text-neutral-800 transition hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-info dark:border-white/10 dark:text-neutral-100 dark:hover:bg-white/5"
            >
              다시 계산하기
            </button>
            <Link
              href="/advanced/dates"
              className="inline-flex h-11 items-center justify-center rounded-md border border-neutral-900 bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-info dark:border-white/10 dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-neutral-200"
            >
              고급 모드 시도
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
