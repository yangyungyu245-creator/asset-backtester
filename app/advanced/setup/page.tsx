"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdvancedOptionsPanel } from "@/components/simulator/AdvancedOptionsPanel";
import { AdvancedStepper } from "@/components/simulator/AdvancedStepper";
import { ContributionScheduler } from "@/components/simulator/ContributionScheduler";
import { WeightSlider } from "@/components/simulator/WeightSlider";
import { SaveActionButton } from "@/components/saved/SaveActionButton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
    setSimulationResult,
  } = useSimulationStore();
  const [tickers, setTickers] = useState<TickerMeta[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const assetSymbol = params.get("asset")?.trim().toUpperCase() ?? "";
    if (assetSymbol) {
      window.sessionStorage.setItem("firelife.pendingAsset", assetSymbol);
    }

    if (!startDate || !endDate) {
      router.replace(assetSymbol ? `/advanced/dates?asset=${encodeURIComponent(assetSymbol)}` : "/advanced/dates");
      return;
    }
    if (selectedTickers.length === 0) {
      router.replace(assetSymbol ? `/advanced/tickers?asset=${encodeURIComponent(assetSymbol)}` : "/advanced/tickers");
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

  function handleSubmit() {
    if (!canSubmit) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      alert(contributionValidation.error ?? "입력값을 확인해 주세요.");
      return;
    }

    setSimulationResult(null);
    router.push("/advanced/loading");
  }

  return (
    <section className="py-4 sm:py-8">
      <AdvancedStepper currentStep={3} />
      <div>
        <h1 className="text-3xl font-bold text-primary sm:text-[40px]">
          투자 금액과 비중
        </h1>
        <p className="mt-3 text-base leading-7 text-secondary">
          선택한 종목 {selectedTickers.length}개
        </p>
      </div>

      <div className="mt-6 grid gap-6">
        <Card rounded="2xl" padding="lg">
          <NumberInput
            id="initialAmount"
            label="초기 투자금"
            value={initialAmount}
            onChange={setInitialAmount}
            min={0}
            max={10_000_000_000}
            placeholder="예: 10,000,000"
            suffix="원"
            error={
              initialAmountValid
                ? undefined
                : "초기 투자금은 0원 이상 100억 원 이하로 입력해 주세요."
            }
          />
        </Card>

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

        <Card rounded="2xl" padding="lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[22px] font-bold text-primary">
                포트폴리오 저장
              </h2>
              <p className="mt-1 text-sm text-secondary">
                로그인하면 선택 종목과 비중을 저장해 다시 불러올 수 있습니다.
              </p>
            </div>
            <SaveActionButton label="포트폴리오 저장" />
          </div>
        </Card>

        <AdvancedOptionsPanel
          options={options}
          showExchangeRate={hasForeignTicker}
          onChange={updateOptions}
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button asChild href="/advanced/tickers" variant="outline">
          이전
        </Button>
        <Button type="button" disabled={!canSubmit} onClick={handleSubmit}>
          결과 보기
        </Button>
      </div>
    </section>
  );
}
