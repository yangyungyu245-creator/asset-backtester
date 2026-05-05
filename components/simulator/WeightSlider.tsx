"use client";

import type { TickerMeta } from "@/lib/data/tickerIndex";
import type { SelectedTicker } from "@/store/useSimulationStore";
import { Card } from "@/components/ui/Card";

type WeightSliderProps = {
  selectedTickers: SelectedTicker[];
  tickerMap: Map<string, TickerMeta>;
  onChange: (ticker: string, weight: number) => void;
  onDistribute: () => void;
};

export function WeightSlider({
  selectedTickers,
  tickerMap,
  onChange,
  onDistribute,
}: WeightSliderProps) {
  const totalWeight = selectedTickers.reduce(
    (total, ticker) => total + ticker.weight,
    0,
  );
  const diff = Number((100 - totalWeight).toFixed(2));
  const isValid = Math.abs(diff) <= 0.01;

  return (
    <Card rounded="2xl" padding="lg">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-primary">
            종목별 비중
          </h2>
          <p className="mt-1 text-sm text-secondary">
            모든 종목 비중의 합계가 100%여야 합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={onDistribute}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-3 text-sm font-bold text-brand transition hover:bg-brand-bg"
        >
          균등 분배
        </button>
      </div>

      <div className="mt-5 grid gap-4">
        {selectedTickers.map((item) => {
          const meta = tickerMap.get(item.ticker);

          return (
            <div
              key={item.ticker}
              className="grid gap-3 rounded-xl bg-card-subtle p-4 md:grid-cols-[10rem_minmax(0,1fr)_8rem] md:items-center"
            >
              <div className="min-w-0">
                <p className="font-bold text-primary">
                  {item.ticker}
                </p>
                <p className="truncate text-xs text-secondary">
                  {meta?.name_ko || meta?.name || "종목"}
                </p>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={item.weight}
                onChange={(event) => onChange(item.ticker, Number(event.target.value))}
                className="w-full accent-brand"
              />
              <label className="flex h-11 items-center rounded-md border border-border bg-card px-3 focus-within:ring-2 focus-within:ring-brand/30">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={item.weight}
                  onChange={(event) =>
                    onChange(item.ticker, Number(event.target.value))
                  }
                  className="min-w-0 flex-1 bg-transparent text-right text-sm text-primary outline-none"
                />
                <span className="ml-2 text-sm text-secondary">
                  %
                </span>
              </label>
            </div>
          );
        })}
      </div>

      <p className={`mt-4 text-sm font-bold ${isValid ? "text-brand" : "text-up"}`}>
        {isValid
          ? `합계 ${totalWeight.toFixed(2)}% ✓`
          : diff > 0
            ? `합계 ${totalWeight.toFixed(2)}% (${diff.toFixed(2)}% 부족)`
            : `합계 ${totalWeight.toFixed(2)}% (${Math.abs(diff).toFixed(2)}% 초과)`}
      </p>
    </Card>
  );
}
