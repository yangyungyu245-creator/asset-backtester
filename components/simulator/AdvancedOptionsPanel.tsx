"use client";

import type { AdvancedOptions } from "@/store/useSimulationStore";
import { Card } from "@/components/ui/Card";

type AdvancedOptionsPanelProps = {
  options: AdvancedOptions;
  showExchangeRate: boolean;
  onChange: (patch: Partial<AdvancedOptions>) => void;
};

function TooltipIcon({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label}
        className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-border text-xs font-semibold leading-none text-secondary transition hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
      >
        ?
      </button>
      <span className="pointer-events-none absolute left-1/2 top-7 z-10 hidden w-56 -translate-x-1/2 rounded-md border border-border bg-card px-3 py-2 text-xs font-normal leading-5 text-secondary shadow-medium group-focus-within:block group-hover:block">
        {description}
      </span>
    </span>
  );
}

export function AdvancedOptionsPanel({
  options,
  showExchangeRate,
  onChange,
}: AdvancedOptionsPanelProps) {
  return (
    <Card rounded="2xl" padding="lg">
      <h2 className="text-[22px] font-bold text-primary">
        고급 옵션
      </h2>
      <div className="mt-5 grid gap-4">
        <label className="flex items-start gap-3 text-sm text-primary">
          <input
            type="checkbox"
            checked={options.reinvestDividends}
            onChange={(event) =>
              onChange({ reinvestDividends: event.target.checked })
            }
            className="mt-1 accent-brand"
          />
          <span>
            배당 재투자
            <TooltipIcon
              label="배당 재투자 설명"
              description="배당금을 현금으로 두지 않고 다시 같은 자산에 투자한다고 가정합니다."
            />
          </span>
        </label>

        {showExchangeRate ? (
          <label className="flex items-start gap-3 text-sm text-primary">
            <input
              type="checkbox"
              checked={options.applyExchangeRate}
              onChange={(event) =>
                onChange({ applyExchangeRate: event.target.checked })
              }
              className="mt-1 accent-brand"
            />
            <span>환율 적용</span>
          </label>
        ) : null}

        <label className="flex items-start gap-3 text-sm text-primary">
          <input
            type="checkbox"
            checked={options.inflationAdjusted}
            onChange={(event) =>
              onChange({ inflationAdjusted: event.target.checked })
            }
            className="mt-1 accent-brand"
          />
          <span>
            인플레이션 보정
            <TooltipIcon
              label="인플레이션 보정 설명"
              description="물가 상승을 반영해 실질 구매력 기준으로 결과를 비교합니다."
            />
          </span>
        </label>

        <label className="grid gap-2 text-sm font-bold text-primary sm:max-w-xs">
          리밸런싱 주기
          <select
            value={options.rebalance}
            onChange={(event) =>
              onChange({
                rebalance: event.target.value as AdvancedOptions["rebalance"],
              })
            }
            className="h-11 rounded-md border border-border bg-card px-3 text-sm text-primary outline-none focus:ring-2 focus:ring-brand/30"
          >
            <option value="none">없음</option>
            <option value="monthly">매월</option>
            <option value="quarterly">분기</option>
            <option value="annually">매년</option>
          </select>
        </label>
      </div>
    </Card>
  );
}
