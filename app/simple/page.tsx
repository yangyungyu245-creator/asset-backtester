"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AssetGrowthChart } from "@/components/charts/AssetGrowthChart";
import { LoadingScreen } from "@/components/simulator/LoadingScreen";
import { SimpleInputForm } from "@/components/simulator/SimpleInputForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
  const [assetSymbol, setAssetSymbol] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [input, setInput] = useState<SimpleSimulationInput>(defaultInput);
  const result = useMemo(() => simulateSimple(input), [input]);

  const handleLoadingDone = useCallback(() => {
    setPhase("result");
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setAssetSymbol(params.get("asset")?.trim().toUpperCase() ?? "");
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
    <section className="grid gap-6 py-4 pb-24 sm:gap-8 sm:py-8 md:pb-8">
      <div>
        <Link
          href="/"
          className="text-sm font-semibold text-secondary transition hover:text-brand"
        >
          ← 모드 선택으로
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-primary sm:text-[40px]">
          간단 백테스트
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-secondary">
          복리 시뮬레이션으로 미래 자산을 빠르게 계산합니다.
        </p>
      </div>

      {assetSymbol && phase === "input" ? (
        <Card rounded="2xl" className="bg-brand-bg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge variant="brand">{assetSymbol}</Badge>
              <p className="mt-3 text-sm font-semibold text-primary">
                종목 기반 시뮬레이션은 고급 백테스트에서 더 정확하게 계산할 수 있어요.
              </p>
              <p className="mt-1 text-sm text-secondary">
                간단 모드는 종목 가격을 쓰지 않고 입력한 수익률 가정만 사용합니다.
              </p>
            </div>
            <Button href={`/advanced/dates?asset=${encodeURIComponent(assetSymbol)}`} variant="secondary">
              고급으로 이동 →
            </Button>
          </div>
        </Card>
      ) : null}

      {phase === "input" ? (
        <SimpleInputForm
          input={input}
          onChange={setInput}
          onSubmit={() => setPhase("loading")}
        />
      ) : (
        <div className="grid gap-6">
          <Card rounded="2xl" padding="lg">
            <p className="text-sm font-semibold text-secondary">최종 자산</p>
            <p className="mt-2 text-[40px] font-bold leading-tight text-primary text-numeric">
              {formatKRW(result.finalValue)}
            </p>
            <p
              className={`mt-2 text-base font-bold text-numeric ${
                result.totalReturn >= 0 ? "text-up" : "text-down"
              }`}
            >
              {result.totalReturn >= 0 ? "+" : ""}
              {formatKRW(result.totalReturn)} (
              {result.totalContributions > 0
                ? ((result.totalReturn / result.totalContributions) * 100).toFixed(1)
                : "0.0"}
              %)
            </p>
          </Card>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["원금 합계", formatKRW(result.totalContributions)],
              ["이자 합계", formatKRW(result.totalReturn)],
              ["연 환산 수익률", `${result.effectiveAnnualRate.toFixed(2)}%`],
              [
                "투자 기간",
                `${input.contributionSchedule.reduce(
                  (sum, item) => sum + item.durationYears,
                  0,
                )}년`,
              ],
            ].map(([label, value]) => (
              <Card key={label} rounded="xl" padding="sm">
                <p className="text-xs font-semibold text-secondary">{label}</p>
                <p className="mt-2 break-words text-lg font-bold text-primary text-numeric">
                  {value}
                </p>
              </Card>
            ))}
          </div>

          <Card rounded="2xl" padding="lg">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-[22px] font-bold text-primary">
                  자산 추이
                </h2>
                <p className="text-sm text-secondary">
                  평가금액과 누적 원금을 연도별로 비교합니다
                </p>
              </div>
            </div>
            <AssetGrowthChart data={chartData} />
          </Card>

          <Card rounded="2xl" padding="sm" className="overflow-hidden">
            <div className="border-b border-border p-5">
              <h2 className="text-[22px] font-bold text-primary">
                연도별 상세
              </h2>
            </div>
            <div className="max-h-96 overflow-auto">
              <table className="w-full min-w-[42rem] border-collapse text-sm">
                <thead className="sticky top-0 bg-card-subtle text-secondary">
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
                      <td className="px-4 py-3 text-secondary">
                        {row.year}년차
                      </td>
                      <td className="px-4 py-3 text-right text-secondary">
                        {formatKRW(row.cumulativeContributions)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-primary">
                        {formatKRW(row.endValue)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right ${
                          row.interest >= 0 ? "text-up" : "text-down"
                        }`}
                      >
                        {row.interest >= 0 ? "+" : ""}
                        {formatKRW(row.interest)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right ${
                          row.cumReturn >= 0 ? "text-up" : "text-down"
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
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" onClick={() => setPhase("input")} variant="secondary">
              다시 계산하기
            </Button>
            <Button href="/advanced/dates">
              고급 모드 시도
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
