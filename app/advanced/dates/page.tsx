"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { AdvancedStepper } from "@/components/simulator/AdvancedStepper";
import { Button } from "@/components/ui/Button";
import { useSimulationStore } from "@/store/useSimulationStore";

const minExchangeRateDate = "2003-12-01";

function monthDiff(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  );
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdvancedDatesPage() {
  const router = useRouter();
  const { startDate, endDate, setStartDate, setEndDate } = useSimulationStore();

  const validation = useMemo(() => {
    const today = todayString();
    const months = monthDiff(startDate, endDate);

    if (!startDate || !endDate) {
      return { valid: false, error: "시작일과 종료일을 모두 입력하세요.", months };
    }
    if (startDate >= endDate) {
      return { valid: false, error: "시작일은 종료일보다 빨라야 합니다.", months };
    }
    if (endDate > today) {
      return { valid: false, error: "종료일은 오늘보다 늦을 수 없습니다.", months };
    }
    if (months < 1) {
      return { valid: false, error: "최소 1개월 이상이어야 합니다.", months };
    }

    return { valid: true, months };
  }, [endDate, startDate]);

  const years = Math.floor(Math.max(0, validation.months) / 12);
  const months = Math.max(0, validation.months) % 12;
  const warning =
    startDate < minExchangeRateDate
      ? "환율 데이터가 2003-12-01부터 제공되어 일부 해외 종목 시뮬레이션이 제한될 수 있습니다."
      : null;

  return (
    <section className="py-4 sm:py-8">
      <AdvancedStepper currentStep={1} />
      <div>
        <h1 className="text-3xl font-semibold text-neutral-950 dark:text-neutral-50">
          시뮬레이션 기간
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
          투자 시작·종료 시점을 정해주세요.
        </p>
      </div>

      <form
        className="mt-6 grid min-w-0 gap-5 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]"
        onSubmit={(event) => {
          event.preventDefault();
          if (validation.valid) {
            router.push("/advanced/tickers");
          }
        }}
      >
        <div className="grid min-w-0 gap-5 sm:grid-cols-2">
          <label className="min-w-0 text-sm font-medium text-neutral-800 dark:text-neutral-200">
            시작 날짜
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="mt-2 h-11 w-full min-w-0 rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none focus:ring-2 focus:ring-info dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-50"
            />
          </label>
          <label className="min-w-0 text-sm font-medium text-neutral-800 dark:text-neutral-200">
            종료 날짜
            <input
              type="date"
              max={todayString()}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="mt-2 h-11 w-full min-w-0 rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none focus:ring-2 focus:ring-info dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-50"
            />
          </label>
        </div>

        <div className="rounded-lg bg-neutral-50 p-4 text-sm dark:bg-white/[0.03]">
          <p className="font-medium text-neutral-950 dark:text-neutral-50">
            총 {years}년 {months}개월
          </p>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            시작 날짜에 상장되지 않은 종목은 다음 단계에서 자동으로 비활성화됩니다.
          </p>
        </div>

        {!validation.valid ? (
          <p className="text-sm text-negative">{validation.error}</p>
        ) : null}
        {warning ? <p className="text-sm text-info">{warning}</p> : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={!validation.valid}>
            다음
          </Button>
        </div>
      </form>
    </section>
  );
}
