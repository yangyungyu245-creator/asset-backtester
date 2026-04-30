"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdvancedOptionsPanel } from "@/components/simulator/AdvancedOptionsPanel";
import { AdvancedStepper } from "@/components/simulator/AdvancedStepper";
import { ContributionScheduler } from "@/components/simulator/ContributionScheduler";
import { WeightSlider } from "@/components/simulator/WeightSlider";
import { Button } from "@/components/ui/Button";
import { NumberInput } from "@/components/ui/NumberInput";
import { loadTickerIndex, type TickerMeta } from "@/lib/data/tickerIndex";
import {
  isWeightSumValid,
  validateContributionPeriods,
} from "@/lib/utils/validation";
import { useSimulationStore } from "@/store/useSimulationStore";

export default function AdvancedSetupPage() {
  const router = useRouter();
  const {
    startDate,
    endDate,
    selectedTickers,
    initialAmount,
    contributionSchedule,
    options,
    setInitialAmount,
    addContributionPeriod,
    removeContributionPeriod,
    updateContributionPeriod,
    updateWeight,
    distributeWeightsEqually,
    updateOptions,
  } = useSimulationStore();
  const [tickers, setTickers] = useState<TickerMeta[]>([]);

  useEffect(() => {
    if (!startDate || !endDate) {
      router.replace("/advanced/dates");
      return;
    }
    if (selectedTickers.length === 0) {
      router.replace("/advanced/tickers");
      return;
    }

    loadTickerIndex().then(setTickers).catch(() => setTickers([]));
  }, [endDate, router, selectedTickers.length, startDate]);

  const tickerMap = useMemo(
    () => new Map(tickers.map((ticker) => [ticker.ticker, ticker])),
    [tickers],
  );
  const hasForeignTicker = selectedTickers.some((item) => {
    const meta = tickerMap.get(item.ticker);
    return meta ? meta.currency !== "KRW" : true;
  });
  const contributionValidation = validateContributionPeriods(
    contributionSchedule,
    startDate.slice(0, 7),
    endDate.slice(0, 7),
  );
  const initialAmountValid = initialAmount >= 0 && initialAmount <= 10_000_000_000;
  const canSubmit =
    selectedTickers.length > 0 &&
    initialAmountValid &&
    contributionValidation.valid &&
    isWeightSumValid(selectedTickers);

  return (
    <section className="py-4 sm:py-8">
      <AdvancedStepper currentStep={3} />
      <div>
        <h1 className="text-3xl font-semibold text-neutral-950 dark:text-neutral-50">
          투자 금액과 비중
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
          선택된 종목 {selectedTickers.length}개
        </p>
      </div>

      <div className="mt-6 grid gap-6">
        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
          <NumberInput
            id="initialAmount"
            label="초기 투자금"
            value={initialAmount}
            onChange={setInitialAmount}
            min={0}
            max={10_000_000_000}
            suffix="원"
            error={
              initialAmountValid ? undefined : "초기 투자금은 0원 이상 100억 이하로 입력하세요."
            }
          />
        </section>

        <ContributionScheduler
          periods={contributionSchedule}
          startDate={startDate}
          endDate={endDate}
          onAdd={addContributionPeriod}
          onRemove={removeContributionPeriod}
          onUpdate={updateContributionPeriod}
        />

        <WeightSlider
          selectedTickers={selectedTickers}
          tickerMap={tickerMap}
          onChange={updateWeight}
          onDistribute={distributeWeightsEqually}
        />

        <AdvancedOptionsPanel
          options={options}
          showExchangeRate={hasForeignTicker}
          onChange={updateOptions}
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button asChild href="/advanced/tickers" className="border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100 dark:bg-transparent dark:text-neutral-100 dark:hover:bg-white/5">
          이전
        </Button>
        <Button
          type="button"
          disabled={!canSubmit}
          onClick={() => {
            console.log("Advanced simulation input", {
              startDate,
              endDate,
              selectedTickers,
              initialAmount,
              contributionSchedule,
              options,
            });
            alert("Phase 4 시뮬레이션 엔진 구현 후 동작합니다");
          }}
        >
          결과 보기
        </Button>
      </div>
    </section>
  );
}
