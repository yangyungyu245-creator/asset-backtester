"use client";

import { ResultChart } from "@/components/charts/ResultChart";
import type { SimulationPoint } from "@/lib/simulation/types";

type AssetChartProps = {
  data: SimulationPoint[];
  futureStartDate?: string;
};

export function AssetChart({ data }: AssetChartProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-subtle sm:p-5">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-primary">자산 추이</h2>
          <p className="mt-1 text-sm text-secondary">
            평가금액, 누적 원금, 같은 조건의 S&P 500 결과를 비교합니다.
          </p>
        </div>
      </div>
      <ResultChart data={data} height={360} mobileHeight={280} />
    </section>
  );
}
