"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdvancedStepper } from "@/components/simulator/AdvancedStepper";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
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
  const [assetSymbol, setAssetSymbol] = useState("");
  const { startDate, endDate, options, setStartDate, setEndDate, updateOptions } =
    useSimulationStore();

  const today = todayString();
  const isEndDateInFuture = endDate > today;
  const validation = useMemo(() => {
    const months = monthDiff(startDate, endDate);

    if (!startDate || !endDate) {
      return { valid: false, error: "시작일과 종료일을 모두 입력하세요.", months };
    }
    if (startDate >= endDate) {
      return { valid: false, error: "시작일은 종료일보다 빨라야 합니다.", months };
    }
    if (endDate > today && !options.futureMode) {
      return {
        valid: false,
        error: "미래 종료일은 미래 시점 시뮬레이션 옵션을 켜야 사용할 수 있습니다.",
        months,
      };
    }
    if (months < 1) {
      return { valid: false, error: "최소 1개월 이상이어야 합니다.", months };
    }

    return { valid: true, months };
  }, [endDate, options.futureMode, startDate, today]);

  const years = Math.floor(Math.max(0, validation.months) / 12);
  const months = Math.max(0, validation.months) % 12;
  const warning =
    startDate < minExchangeRateDate
      ? "환율 데이터가 2003-12-01부터 제공되어 일부 해외 종목 시뮬레이션이 제한될 수 있습니다."
      : null;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setAssetSymbol(params.get("asset")?.trim().toUpperCase() ?? "");
  }, []);

  return (
    <section className="min-w-0 overflow-hidden py-4 sm:py-8">
      <AdvancedStepper currentStep={1} />
      <div>
        <h1 className="text-3xl font-bold text-primary sm:text-[40px]">
          시뮬레이션 기간
        </h1>
        <p className="mt-3 text-base leading-7 text-secondary">
          투자 시작일과 종료일을 정해주세요.
        </p>
        <p className="mt-1 text-sm leading-6 text-brand">
          과거 백테스트는 물론, 원한다면 미래 시점까지 확장한 시뮬레이션도 사용할 수 있습니다.
        </p>
      </div>

      {assetSymbol ? (
        <Card rounded="2xl" className="mt-6 bg-brand-bg">
          <Badge variant="brand">{assetSymbol}</Badge>
          <p className="mt-3 text-sm font-semibold text-primary">
            다음 종목 선택 단계에서 {assetSymbol}을 자동으로 추가합니다.
          </p>
        </Card>
      ) : null}

      <form
        className="mt-6 grid min-w-0 gap-5 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-subtle sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (assetSymbol) {
            window.sessionStorage.setItem("firelife.pendingAsset", assetSymbol);
          }
          if (validation.valid) {
            router.push(assetSymbol ? `/advanced/tickers?asset=${encodeURIComponent(assetSymbol)}` : "/advanced/tickers");
          }
        }}
      >
        <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2">
          <label className="block min-w-0 text-sm font-bold text-primary">
            시작 날짜
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="mt-2 h-11 w-full min-w-0 rounded-md border border-border bg-card px-3 text-sm text-primary outline-none focus:ring-2 focus:ring-brand/30"
            />
          </label>
          <label className="block min-w-0 text-sm font-bold text-primary">
            종료 날짜
            <input
              type="date"
              value={endDate}
              onChange={(event) => {
                const nextEndDate = event.target.value;
                setEndDate(nextEndDate);
                if (nextEndDate <= today && options.futureMode) {
                  updateOptions({ futureMode: false });
                }
              }}
              className="mt-2 h-11 w-full min-w-0 rounded-md border border-border bg-card px-3 text-sm text-primary outline-none focus:ring-2 focus:ring-brand/30"
            />
          </label>
        </div>

        {isEndDateInFuture ? (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-down-bg p-4">
            <input
              type="checkbox"
              checked={options.futureMode}
              onChange={(event) =>
                updateOptions({ futureMode: event.target.checked })
              }
              className="mt-1 accent-brand"
            />
            <span className="flex-1">
              <span className="block text-sm font-bold text-primary">
                미래 시점까지 시뮬레이션
              </span>
              <span className="mt-1 block text-sm leading-6 text-secondary">
                시작일 ~ 오늘까지는 실제 시장 데이터로 백테스트하고, 오늘 ~ 종료일까지는 과거 5년 평균 수익률 기반 단순 복리로 예측합니다.
              </span>
              <span className="mt-2 block text-xs leading-5 text-amber-600 dark:text-amber-400">
                미래 구간은 추정치입니다. 실제 시장은 변동이 크며 결과가 크게 다를 수 있습니다.
              </span>
            </span>
          </label>
        ) : null}

        <div className="rounded-xl bg-card-subtle p-4 text-sm">
          <p className="font-bold text-primary">
            총 {years}년 {months}개월
          </p>
          <p className="mt-2 text-secondary">
            시작 날짜에 상장되지 않은 종목은 다음 단계에서 자동으로 비활성화합니다.
          </p>
        </div>

        {!validation.valid ? (
          <p className="text-sm text-up">{validation.error}</p>
        ) : null}
        {warning ? <p className="text-sm text-brand">{warning}</p> : null}

        <div className="flex min-w-0 justify-end">
          <Button type="submit" disabled={!validation.valid} className="w-full sm:w-auto">
            다음
          </Button>
        </div>
      </form>
    </section>
  );
}
