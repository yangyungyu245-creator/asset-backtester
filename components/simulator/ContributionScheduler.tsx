"use client";

import { NumberInput } from "@/components/ui/NumberInput";
import { validateContributionPeriods } from "@/lib/utils/validation";
import type { ContributionPeriod } from "@/store/useSimulationStore";

type ContributionSchedulerProps = {
  periods: ContributionPeriod[];
  startDate: string;
  endDate: string;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<ContributionPeriod>) => void;
};

export function ContributionScheduler({
  periods,
  startDate,
  endDate,
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
    <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
            월 적립액 (기간별)
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            시뮬레이션 기간 전체가 빈틈없이 이어져야 합니다.
          </p>
          <p className="mt-1 text-xs text-info">
            앞 구간의 종료 년월을 바꾸면 다음 구간 시작 년월이 자동으로 이어집니다.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 px-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-100 dark:border-white/10 dark:text-neutral-100 dark:hover:bg-white/5"
        >
          + 구간 추가
        </button>
      </div>

      <div className="mt-5 grid gap-3">
        {periods.map((period, index) => (
          <div
            key={period.id}
            className="grid gap-3 rounded-lg border border-neutral-200 p-4 dark:border-white/10 md:grid-cols-[1fr_1fr_1.3fr_auto] md:items-end"
          >
            <label className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              시작 년월
              <input
                type="month"
                value={period.startYearMonth}
                onChange={(event) =>
                  onUpdate(period.id, { startYearMonth: event.target.value })
                }
                className="mt-2 h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none focus:ring-2 focus:ring-info dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-50"
              />
            </label>
            <label className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              종료 년월
              <input
                type="month"
                value={period.endYearMonth}
                onChange={(event) =>
                  onUpdate(period.id, { endYearMonth: event.target.value })
                }
                className="mt-2 h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none focus:ring-2 focus:ring-info dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-50"
              />
            </label>
            <NumberInput
              id={`monthlyAmount-${period.id}`}
              label="월 적립액"
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
              className="inline-flex h-11 items-center justify-center rounded-md border border-neutral-300 px-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-neutral-200 dark:hover:bg-white/5"
            >
              삭제
            </button>
            <span className="sr-only">구간 {index + 1}</span>
          </div>
        ))}
      </div>

      <p
        className={`mt-4 text-sm ${
          validation.valid ? "text-positive" : "text-negative"
        }`}
      >
        {validation.valid ? "적립 구간 검증 통과" : validation.error}
      </p>
    </section>
  );
}
