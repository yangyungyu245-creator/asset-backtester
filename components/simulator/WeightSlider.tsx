"use client";

import type { TickerMeta } from "@/lib/data/tickerIndex";
import type {
  AllocationMode,
  SelectedTicker,
} from "@/store/useSimulationStore";
import { Card } from "@/components/ui/Card";

type WeightSliderProps = {
  selectedTickers: SelectedTicker[];
  tickerMap: Map<string, TickerMeta>;
  allocationMode: AllocationMode;
  targetAmount: number;
  onModeChange: (mode: AllocationMode) => void;
  onChange: (ticker: string, weight: number) => void;
  onAmountChange: (ticker: string, amount: number) => void;
  onDistribute: () => void;
  onDistributeAmounts: () => void;
};

export function WeightSlider({
  selectedTickers,
  tickerMap,
  allocationMode,
  targetAmount,
  onModeChange,
  onChange,
  onAmountChange,
  onDistribute,
  onDistributeAmounts,
}: WeightSliderProps) {
  const totalWeight = selectedTickers.reduce(
    (total, ticker) => total + ticker.weight,
    0,
  );
  const totalAmount = selectedTickers.reduce(
    (total, ticker) => total + (ticker.amount ?? 0),
    0,
  );
  const diff = Number((100 - totalWeight).toFixed(2));
  const isValid = Math.abs(diff) <= 0.01;
  const amountDiff = targetAmount - totalAmount;
  const isAmountValid = targetAmount > 0 && Math.abs(amountDiff) <= 1;

  return (
    <Card rounded="2xl" padding="lg">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-primary">
            종목별 비중
          </h2>
          <p className="mt-1 text-sm text-secondary">
            비율 또는 적립 금액으로 종목별 배분을 설정합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={allocationMode === "percent" ? onDistribute : onDistributeAmounts}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-3 text-sm font-bold text-brand transition hover:bg-brand-bg"
        >
          균등 분배
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:flex">
        {[
          { value: "percent", label: "비율 (%)" },
          { value: "amount", label: "금액 (원)" },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onModeChange(option.value as AllocationMode)}
            className={`h-10 rounded-lg px-4 text-sm font-bold transition ${
              allocationMode === option.value
                ? "bg-brand text-white"
                : "bg-card-subtle text-secondary hover:text-primary"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4">
        {selectedTickers.map((item) => {
          const meta = tickerMap.get(item.ticker);
          const amount = item.amount ?? 0;
          const amountPercent = targetAmount > 0 ? (amount / targetAmount) * 100 : 0;

          return (
            <div
              key={item.ticker}
              className="grid min-w-0 gap-3 overflow-hidden rounded-xl bg-card-subtle p-4 md:grid-cols-[10rem_minmax(0,1fr)_8rem] md:items-center"
            >
              <div className="min-w-0">
                <p className="font-bold text-primary">
                  {item.ticker}
                </p>
                <p className="truncate text-xs text-secondary">
                  {meta?.name_ko || meta?.name || "종목"}
                </p>
              </div>
              {allocationMode === "percent" ? (
                <>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={item.weight}
                    onChange={(event) => onChange(item.ticker, Number(event.target.value))}
                    className="w-full min-w-0 accent-brand"
                  />
                  <label className="flex h-11 min-w-0 items-center rounded-md border border-border bg-card px-3 focus-within:ring-2 focus-within:ring-brand/30">
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
                </>
              ) : (
                <div className="md:col-span-2 grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_7rem] sm:items-center">
                  <label className="flex h-11 min-w-0 items-center rounded-md border border-border bg-card px-3 focus-within:ring-2 focus-within:ring-brand/30">
                    <input
                      type="number"
                      min={0}
                      max={100_000_000}
                      step={1000}
                      value={amount}
                      onChange={(event) =>
                        onAmountChange(item.ticker, Number(event.target.value))
                      }
                      className="min-w-0 flex-1 bg-transparent text-right text-sm text-primary outline-none"
                    />
                    <span className="ml-2 text-sm text-secondary">
                      원
                    </span>
                  </label>
                  <span className="text-right text-xs font-bold text-secondary">
                    {amountPercent.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {allocationMode === "percent" ? (
        <p className={`mt-4 text-sm font-bold ${isValid ? "text-brand" : "text-up"}`}>
          {isValid
            ? `합계 ${totalWeight.toFixed(2)}% ✓`
            : diff > 0
              ? `합계 ${totalWeight.toFixed(2)}% (${diff.toFixed(2)}% 부족)`
              : `합계 ${totalWeight.toFixed(2)}% (${Math.abs(diff).toFixed(2)}% 초과)`}
        </p>
      ) : (
        <p className={`mt-4 text-sm font-bold ${isAmountValid ? "text-brand" : "text-up"}`}>
          {isAmountValid
            ? `합계 ${totalAmount.toLocaleString("ko-KR")}원 / ${targetAmount.toLocaleString("ko-KR")}원 ✓`
            : `합계 ${totalAmount.toLocaleString("ko-KR")}원 / ${targetAmount.toLocaleString("ko-KR")}원 (불일치)`}
        </p>
      )}
      {allocationMode === "amount" ? (
        <p className="mt-2 text-xs text-secondary">
          금액 모드는 첫 번째 적립 구간의 적립액을 기준으로 비율을 자동 계산합니다.
        </p>
      ) : null}
    </Card>
  );
}
