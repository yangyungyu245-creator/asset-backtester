"use client";

import { NumberInput } from "@/components/ui/NumberInput";
import { Card } from "@/components/ui/Card";
import { validateContributionPeriods } from "@/lib/utils/validation";
import type { ContributionPeriod } from "@/store/useSimulationStore";
import type { InvestmentFrequency } from "@/lib/simulation/types";

type ContributionSchedulerProps = {
  periods: ContributionPeriod[];
  frequency: InvestmentFrequency;
  startDate: string;
  endDate: string;
  onFrequencyChange: (frequency: InvestmentFrequency) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<ContributionPeriod>) => void;
};

const frequencyOptions: Array<{ value: InvestmentFrequency; label: string }> = [
  { value: "daily", label: "매일" },
  { value: "weekly", label: "매주" },
  { value: "monthly", label: "매월" },
];

const amountLabel: Record<InvestmentFrequency, string> = {
  daily: "일 적립액",
  weekly: "주 적립액",
  monthly: "월 적립액",
};

export function ContributionScheduler({
  periods,
  frequency,
  startDate,
  endDate,
  onFrequencyChange,
  onAdd,
  onRemove,
  onUpdate,
}: ContributionSchedulerProps) {
  const validation = validateContributionPeriods(
    periods,
    startDate.slice(0, 7),
    endDate.slice(0, 7),
  );

  return (
    <Card rounded="2xl" padding="lg">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-primary">
            적립액 (기간별)
          </h2>
          <p className="mt-1 text-sm text-secondary">
            시뮬레이션 기간 전체가 빈틈없이 이어져야 합니다.
          </p>
          <p className="mt-1 text-xs text-brand">
            앞 구간의 종료 년월을 바꾸면 다음 구간 시작 년월이 자동으로 이어집니다.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-3 text-sm font-bold text-brand transition hover:bg-brand-bg"
        >
          + 구간 추가
        </button>
      </div>

      <div className="mt-5">
        <p className="text-sm font-bold text-primary">적립 주기</p>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:flex">
          {frequencyOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onFrequencyChange(option.value)}
              className={`h-10 rounded-lg px-4 text-sm font-bold transition ${
                frequency === option.value
                  ? "bg-brand text-white"
                  : "bg-card-subtle text-secondary hover:text-primary"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {periods.map((period, index) => (
          <div
            key={period.id}
          className="grid min-w-0 grid-cols-1 gap-3 overflow-hidden rounded-xl bg-card-subtle p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)_auto] md:items-end"
        >
            <label className="block min-w-0 text-sm font-bold text-primary">
              시작 년월
              <input
                type="month"
                value={period.startYearMonth}
                onChange={(event) =>
                  onUpdate(period.id, { startYearMonth: event.target.value })
                }
                className="mt-2 h-11 w-full min-w-0 rounded-md border border-border bg-card px-3 text-sm text-primary outline-none focus:ring-2 focus:ring-brand/30"
              />
            </label>
            <label className="block min-w-0 text-sm font-bold text-primary">
              종료 년월
              <input
                type="month"
                value={period.endYearMonth}
                onChange={(event) =>
                  onUpdate(period.id, { endYearMonth: event.target.value })
                }
                className="mt-2 h-11 w-full min-w-0 rounded-md border border-border bg-card px-3 text-sm text-primary outline-none focus:ring-2 focus:ring-brand/30"
              />
            </label>
            <NumberInput
              id={`monthlyAmount-${period.id}`}
              label={amountLabel[frequency]}
              value={period.monthlyAmount}
              onChange={(monthlyAmount) => onUpdate(period.id, { monthlyAmount })}
              min={0}
              max={100_000_000}
              placeholder="예: 300,000"
              suffix="원"
            />
            <button
              type="button"
              onClick={() => onRemove(period.id)}
              disabled={periods.length < 2}
              className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-border px-3 text-sm font-bold text-secondary transition hover:bg-card disabled:cursor-not-allowed disabled:opacity-40 md:w-auto"
            >
              삭제
            </button>
            <span className="sr-only">구간 {index + 1}</span>
          </div>
        ))}
      </div>

      <p
        className={`mt-4 text-sm ${
          validation.valid ? "text-brand" : "text-up"
        }`}
      >
        {validation.valid ? "적립 구간 검증 통과" : validation.error}
      </p>
    </Card>
  );
}
