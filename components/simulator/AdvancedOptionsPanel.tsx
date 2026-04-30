"use client";

import type { AdvancedOptions } from "@/store/useSimulationStore";

type AdvancedOptionsPanelProps = {
  options: AdvancedOptions;
  showExchangeRate: boolean;
  onChange: (patch: Partial<AdvancedOptions>) => void;
};

export function AdvancedOptionsPanel({
  options,
  showExchangeRate,
  onChange,
}: AdvancedOptionsPanelProps) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
      <h2 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
        고급 옵션
      </h2>
      <div className="mt-5 grid gap-4">
        <label className="flex items-start gap-3 text-sm text-neutral-800 dark:text-neutral-200">
          <input
            type="checkbox"
            checked={options.reinvestDividends}
            onChange={(event) =>
              onChange({ reinvestDividends: event.target.checked })
            }
            className="mt-1 accent-info"
          />
          <span>
            배당 재투자
            <span
              className="ml-2 text-xs text-neutral-500 dark:text-neutral-400"
              title="발생한 배당금을 같은 종목에 자동 재투자"
            >
              ⓘ
            </span>
          </span>
        </label>

        {showExchangeRate ? (
          <label className="flex items-start gap-3 text-sm text-neutral-800 dark:text-neutral-200">
            <input
              type="checkbox"
              checked={options.applyExchangeRate}
              onChange={(event) =>
                onChange({ applyExchangeRate: event.target.checked })
              }
              className="mt-1 accent-info"
            />
            <span>환율 적용</span>
          </label>
        ) : null}

        <label className="flex items-start gap-3 text-sm text-neutral-800 dark:text-neutral-200">
          <input
            type="checkbox"
            checked={options.inflationAdjusted}
            onChange={(event) =>
              onChange({ inflationAdjusted: event.target.checked })
            }
            className="mt-1 accent-info"
          />
          <span>
            인플레이션 보정
            <span
              className="ml-2 text-xs text-neutral-500 dark:text-neutral-400"
              title="결과를 시작 시점 가치로 환산"
            >
              ⓘ
            </span>
          </span>
        </label>

        <label className="grid gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-200 sm:max-w-xs">
          리밸런싱 주기
          <select
            value={options.rebalance}
            onChange={(event) =>
              onChange({
                rebalance: event.target.value as AdvancedOptions["rebalance"],
              })
            }
            className="h-11 rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none focus:ring-2 focus:ring-info dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-50"
          >
            <option value="none">없음</option>
            <option value="monthly">월</option>
            <option value="quarterly">분기</option>
            <option value="annually">연</option>
          </select>
        </label>
      </div>
    </section>
  );
}
