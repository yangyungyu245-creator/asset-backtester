"use client";

import { AssetLogo } from "@/components/common/AssetLogo";
import { Card } from "@/components/ui/Card";
import type {
  InitialAllocations,
  SelectedTicker,
} from "@/store/useSimulationStore";

type InitialAllocationCardProps = {
  selectedTickers: SelectedTicker[];
  initialAmount: number;
  customInitialAlloc: boolean;
  initialAllocations: InitialAllocations;
  onToggle: (enabled: boolean) => void;
  onAmountChange: (ticker: string, amount: number) => void;
  onDistribute: () => void;
};

export function getInitialAllocationTotal(allocations: InitialAllocations) {
  return Object.values(allocations).reduce((sum, amount) => sum + amount, 0);
}

export function isInitialAllocationBalanced(
  initialAmount: number,
  allocations: InitialAllocations,
) {
  return Math.abs(initialAmount - getInitialAllocationTotal(allocations)) <= 1;
}

export function InitialAllocationCard({
  selectedTickers,
  initialAmount,
  customInitialAlloc,
  initialAllocations,
  onToggle,
  onAmountChange,
  onDistribute,
}: InitialAllocationCardProps) {
  const totalAllocated = getInitialAllocationTotal(initialAllocations);
  const remaining = initialAmount - totalAllocated;
  const isBalanced = isInitialAllocationBalanced(
    initialAmount,
    initialAllocations,
  );
  const canCustomize = initialAmount > 0 && selectedTickers.length > 0;

  return (
    <Card rounded="2xl" padding="lg">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-primary">
            초기 투자금 배분
          </h2>
          <p className="mt-1 text-sm text-secondary">
            기본값은 적립 비중과 동일하게 초기 투자금을 나눕니다.
          </p>
        </div>
        {customInitialAlloc ? (
          <button
            type="button"
            onClick={onDistribute}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-3 text-sm font-bold text-brand transition hover:bg-brand-bg"
          >
            균등 분배
          </button>
        ) : null}
      </div>

      <label
        className={`mt-5 flex items-center gap-3 rounded-xl bg-card-subtle p-4 ${
          canCustomize ? "cursor-pointer" : "opacity-55"
        }`}
      >
        <input
          type="checkbox"
          checked={customInitialAlloc}
          disabled={!canCustomize}
          onChange={(event) => onToggle(event.target.checked)}
          className="h-4 w-4 rounded border-border accent-brand"
        />
        <span className="text-sm font-bold text-primary">
          종목별 초기 투자금 직접 설정
        </span>
      </label>

      {customInitialAlloc ? (
        <div className="mt-4 grid gap-3 border-l-2 border-brand/30 pl-4">
          {selectedTickers.map((item) => {
            const amount = initialAllocations[item.ticker] ?? 0;
            const percent =
              initialAmount > 0 ? (amount / initialAmount) * 100 : 0;

            return (
              <div
                key={item.ticker}
                className="grid min-w-0 gap-3 rounded-xl bg-card-subtle p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_4.5rem] sm:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <AssetLogo symbol={item.ticker} size={28} />
                  <span className="truncate font-bold text-primary">
                    {item.ticker}
                  </span>
                </div>
                <label className="flex h-11 min-w-0 items-center rounded-md border border-border bg-card px-3 focus-within:ring-2 focus-within:ring-brand/30">
                  <input
                    type="number"
                    min={0}
                    max={10_000_000_000}
                    step={1000}
                    value={amount}
                    onChange={(event) =>
                      onAmountChange(item.ticker, Number(event.target.value))
                    }
                    className="min-w-0 flex-1 bg-transparent text-right text-sm text-primary outline-none"
                  />
                  <span className="ml-2 text-sm text-secondary">원</span>
                </label>
                <span className="text-right text-xs font-bold text-secondary">
                  {percent.toFixed(1)}%
                </span>
              </div>
            );
          })}

          <div
            className={`flex flex-col gap-2 rounded-xl border border-border bg-card p-4 text-sm font-bold sm:flex-row sm:items-center sm:justify-between ${
              isBalanced
                ? "text-brand"
                : remaining > 0
                  ? "text-yellow-500"
                  : "text-up"
            }`}
          >
            <span>
              {isBalanced
                ? "배분 완료 ✓"
                : remaining > 0
                  ? `남은 금액: ${remaining.toLocaleString("ko-KR")}원`
                  : `초과: ${Math.abs(remaining).toLocaleString("ko-KR")}원`}
            </span>
            <span className="text-xs text-secondary">
              {totalAllocated.toLocaleString("ko-KR")}원 /{" "}
              {initialAmount.toLocaleString("ko-KR")}원
            </span>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
