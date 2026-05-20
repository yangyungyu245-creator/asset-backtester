"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
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
import { getHoldings, getPortfolios } from "@/lib/portfolio/actions";
import { isAuthConfigured } from "@/lib/auth/status";
import { createClient } from "@/lib/supabase/client";
import type { Portfolio, PortfolioHolding } from "@/lib/types/portfolio";
import {
  isWeightSumValid,
  validateContributionPeriods,
} from "@/lib/utils/validation";
import { useSimulationStore } from "@/store/useSimulationStore";

function holdingsToWeights(holdings: PortfolioHolding[]) {
  const totalCost = holdings.reduce(
    (sum, holding) => sum + Number(holding.shares) * Number(holding.avg_price),
    0,
  );

  if (holdings.length === 0) return [];

  if (totalCost <= 0) {
    const base = Math.floor((100 / holdings.length) * 100) / 100;
    return holdings.map((holding, index) => ({
      ticker: holding.symbol.toUpperCase(),
      weight:
        index === holdings.length - 1
          ? Number((100 - base * (holdings.length - 1)).toFixed(2))
          : base,
    }));
  }

  const weights = holdings.map((holding) => ({
    ticker: holding.symbol.toUpperCase(),
    weight: Number(
      (
        ((Number(holding.shares) * Number(holding.avg_price)) / totalCost) *
        100
      ).toFixed(2),
    ),
  }));
  const currentSum = weights.reduce((sum, item) => sum + item.weight, 0);
  weights[weights.length - 1].weight = Number(
    (weights[weights.length - 1].weight + (100 - currentSum)).toFixed(2),
  );
  return weights;
}

export default function AdvancedSetupPage() {
  const router = useRouter();
  const {
    startDate,
    endDate,
    selectedTickers,
    allocationMode,
    initialAmount,
    contributionSchedule,
    contributionFrequency,
    options,
    setInitialAmount,
    setAllocationMode,
    setContributionFrequency,
    addContributionPeriod,
    removeContributionPeriod,
    updateContributionPeriod,
    updateWeight,
    updateAllocationAmount,
    setSelectedTickers,
    distributeWeightsEqually,
    distributeAmountsEqually,
    updateOptions,
    setSimulationResult,
  } = useSimulationStore();
  const [tickers, setTickers] = useState<TickerMeta[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [showPortfolioPicker, setShowPortfolioPicker] = useState(false);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState("");
  const [portfolioMessage, setPortfolioMessage] = useState<string | null>(null);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const assetSymbol = params.get("asset")?.trim().toUpperCase() ?? "";
    const queryPortfolio = params.get("portfolio")?.trim() ?? "";
    if (assetSymbol) {
      window.sessionStorage.setItem("firelife.pendingAsset", assetSymbol);
    }
    if (queryPortfolio) {
      window.sessionStorage.setItem("firelife.pendingPortfolio", queryPortfolio);
    }

    if (!startDate || !endDate) {
      router.replace(
        queryPortfolio
          ? `/advanced/dates?portfolio=${encodeURIComponent(queryPortfolio)}`
          : assetSymbol
            ? `/advanced/dates?asset=${encodeURIComponent(assetSymbol)}`
            : "/advanced/dates",
      );
      return;
    }
    if (
      selectedTickers.length === 0 &&
      !queryPortfolio &&
      !window.sessionStorage.getItem("firelife.pendingPortfolio")
    ) {
      router.replace(
        assetSymbol
          ? `/advanced/tickers?asset=${encodeURIComponent(assetSymbol)}`
          : "/advanced/tickers",
      );
      return;
    }

    loadTickerIndex().then(setTickers).catch(() => setTickers([]));
  }, [endDate, router, selectedTickers.length, startDate]);

  useEffect(() => {
    if (!isAuthConfigured()) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        getPortfolios()
          .then((items) => {
            setPortfolios(items);
            setSelectedPortfolioId(items[0]?.id ?? "");
          })
          .catch(() => setPortfolios([]));
      }
    });
  }, []);

  async function loadFromPortfolio(portfolioId: string, closePicker = true) {
    if (!portfolioId) return;

    setLoadingPortfolio(true);
    setPortfolioMessage(null);
    try {
      const holdings = await getHoldings(portfolioId);
      const nextTickers = holdingsToWeights(holdings);
      if (nextTickers.length === 0) {
        setPortfolioMessage("불러올 보유 종목이 없습니다.");
        return;
      }

      setSelectedTickers(nextTickers);
      const portfolioName =
        portfolios.find((portfolio) => portfolio.id === portfolioId)?.name ??
        "포트폴리오";
      setPortfolioMessage(
        `${portfolioName}에서 ${nextTickers.length}개 종목을 불러왔습니다.`,
      );
      window.sessionStorage.removeItem("firelife.pendingPortfolio");
      if (closePicker) setShowPortfolioPicker(false);
    } catch (error) {
      setPortfolioMessage(
        error instanceof Error
          ? error.message
          : "포트폴리오를 불러오지 못했습니다.",
      );
    } finally {
      setLoadingPortfolio(false);
    }
  }

  useEffect(() => {
    if (!user) return;

    const pendingPortfolio = window.sessionStorage.getItem(
      "firelife.pendingPortfolio",
    );
    if (pendingPortfolio) {
      loadFromPortfolio(pendingPortfolio, false);
    }
  }, [user, portfolios]);

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
  const targetAllocationAmount = contributionSchedule[0]?.monthlyAmount ?? 0;
  const totalAllocatedAmount = selectedTickers.reduce(
    (sum, item) => sum + (item.amount ?? 0),
    0,
  );
  const amountAllocationValid =
    allocationMode === "percent" ||
    (targetAllocationAmount > 0 &&
      Math.abs(totalAllocatedAmount - targetAllocationAmount) <= 1);
  const canSubmit =
    selectedTickers.length > 0 &&
    initialAmountValid &&
    contributionValidation.valid &&
    amountAllocationValid &&
    (allocationMode === "amount" || isWeightSumValid(selectedTickers));

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

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {portfolioMessage ? (
          <p className="text-sm font-bold text-brand">{portfolioMessage}</p>
        ) : (
          <span />
        )}
        {user ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowPortfolioPicker(true)}
          >
            포트폴리오에서 불러오기
          </Button>
        ) : null}
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
          frequency={contributionFrequency}
          startDate={startDate}
          endDate={endDate}
          onFrequencyChange={setContributionFrequency}
          onAdd={addContributionPeriod}
          onRemove={removeContributionPeriod}
          onUpdate={updateContributionPeriod}
        />

        <WeightSlider
          selectedTickers={selectedTickers}
          tickerMap={tickerMap}
          allocationMode={allocationMode}
          targetAmount={targetAllocationAmount}
          onModeChange={setAllocationMode}
          onChange={updateWeight}
          onAmountChange={updateAllocationAmount}
          onDistribute={distributeWeightsEqually}
          onDistributeAmounts={() => distributeAmountsEqually(targetAllocationAmount)}
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

      {showPortfolioPicker ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-medium">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-primary">
                포트폴리오에서 불러오기
              </h2>
              <button
                type="button"
                onClick={() => setShowPortfolioPicker(false)}
                className="rounded-md px-2 py-1 text-lg font-bold text-secondary transition hover:bg-card-subtle hover:text-primary"
                aria-label="닫기"
              >
                x
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              {portfolios.length === 0 ? (
                <p className="rounded-xl bg-card-subtle p-4 text-sm text-secondary">
                  불러올 포트폴리오가 없습니다.
                </p>
              ) : (
                portfolios.map((portfolio) => (
                  <label
                    key={portfolio.id}
                    className="flex cursor-pointer items-start gap-3 rounded-xl bg-card-subtle p-4 transition hover:bg-brand-bg"
                  >
                    <input
                      type="radio"
                      name="portfolio"
                      checked={selectedPortfolioId === portfolio.id}
                      onChange={() => setSelectedPortfolioId(portfolio.id)}
                      className="mt-1 accent-brand"
                    />
                    <span>
                      <span className="block font-bold text-primary">
                        {portfolio.name}
                      </span>
                      {portfolio.description ? (
                        <span className="mt-1 block text-sm text-secondary">
                          {portfolio.description}
                        </span>
                      ) : null}
                    </span>
                  </label>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowPortfolioPicker(false)}
              >
                취소
              </Button>
              <Button
                type="button"
                disabled={!selectedPortfolioId || loadingPortfolio}
                onClick={() => loadFromPortfolio(selectedPortfolioId)}
              >
                불러오기
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
