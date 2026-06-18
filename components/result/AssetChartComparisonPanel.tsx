"use client";

import { useEffect, useMemo, useState } from "react";
import { AssetChart } from "@/components/result/AssetChart";
import { getHoldings, getPortfolios } from "@/lib/portfolio/actions";
import { simulateAdvancedWithBenchmark } from "@/lib/simulation/advanced";
import type {
  AdvancedSimulationInput,
  ContributionPeriod,
  InvestmentFrequency,
  SimulationPoint,
  SimulationResult,
} from "@/lib/simulation/types";
import type { Portfolio } from "@/lib/types/portfolio";
import type { ComparisonSeries } from "@/lib/types/comparison";
import { useComparisonExportStore } from "@/store/useComparisonExportStore";
import { formatCompactKRW, formatPercentValue } from "./format";

const COLORS = ["#3182F6", "#06C167", "#8B5CF6"];

type Slot = {
  id: string;
  label: string;
  portfolioId: string;
  enabled: boolean;
  color: string;
};

type AssetChartComparisonPanelProps = {
  data: SimulationPoint[];
  futureStartDate?: string;
  baseInput: AdvancedSimulationInput;
};

function makeSlots(portfolios: Portfolio[]): Slot[] {
  if (portfolios.length === 0) return [];

  const main = portfolios.find((portfolio) => portfolio.is_primary) ?? portfolios[0];
  const others = portfolios.filter((portfolio) => portfolio.id !== main.id);
  const slots: Slot[] = [
    {
      id: "main",
      label: "메인",
      portfolioId: main.id,
      enabled: true,
      color: COLORS[0],
    },
  ];

  if (portfolios.length >= 2 && others[0]) {
    slots.push({
      id: "port1",
      label: "포트1",
      portfolioId: others[0].id,
      enabled: true,
      color: COLORS[1],
    });
  }

  if (portfolios.length >= 4 && others[1]) {
    slots.push({
      id: "port2",
      label: "포트2",
      portfolioId: others[1].id,
      enabled: true,
      color: COLORS[2],
    });
  }

  return slots;
}

function buildComparisonSeries(
  slot: Slot,
  portfolio: Portfolio | undefined,
  result: SimulationResult | undefined,
): ComparisonSeries | null {
  if (!portfolio || !result) return null;

  return {
    id: slot.id,
    name: `${slot.label}: ${portfolio.name}`,
    color: slot.color,
    enabled: slot.enabled,
    timeSeries: result.timeSeries,
    finalValue: result.finalValue,
    cagr: result.cagr,
    maxDrawdownPercent: result.maxDrawdown.percent,
  };
}

export function AssetChartComparisonPanel({
  data,
  futureStartDate,
  baseInput,
}: AssetChartComparisonPanelProps) {
  const setExportSeries = useComparisonExportStore((state) => state.setSeries);
  const clearExportSeries = useComparisonExportStore((state) => state.clear);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
  const [results, setResults] = useState<Record<string, SimulationResult>>({});
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const loaded = await getPortfolios();
        if (cancelled) return;
        setPortfolios(loaded);
        setSlots(makeSlots(loaded));
      } catch {
        if (!cancelled) {
          setPortfolios([]);
          setSlots([]);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeSeries = useMemo(
    () =>
      slots
        .map((slot) =>
          buildComparisonSeries(
            slot,
            portfolios.find((portfolio) => portfolio.id === slot.portfolioId),
            results[slot.portfolioId],
          ),
        )
        .filter((series): series is ComparisonSeries => Boolean(series)),
    [portfolios, results, slots],
  );

  useEffect(() => {
    if (comparisonEnabled) {
      setExportSeries(activeSeries.filter((series) => series.enabled));
    } else {
      clearExportSeries();
    }

    return () => {
      clearExportSeries();
    };
  }, [activeSeries, clearExportSeries, comparisonEnabled, setExportSeries]);

  useEffect(() => {
    if (!comparisonEnabled) return;

    let cancelled = false;
    const selectedIds = Array.from(new Set(slots.map((slot) => slot.portfolioId)));
    const missingIds = selectedIds.filter((portfolioId) => !results[portfolioId]);

    async function runMissing() {
      for (const portfolioId of missingIds) {
        try {
          setLoadingIds((current) => new Set([...Array.from(current), portfolioId]));
          const holdings = await getHoldings(portfolioId);
          const totalCost = holdings.reduce(
            (sum, holding) => sum + holding.shares * holding.avg_price,
            0,
          );

          if (totalCost <= 0) {
            continue;
          }

          const result = await simulateAdvancedWithBenchmark({
            ...baseInput,
            initialAllocations: undefined,
            portfolio: holdings.map((holding) => ({
              ticker: holding.symbol,
              weight: ((holding.shares * holding.avg_price) / totalCost) * 100,
            })),
          });

          if (!cancelled) {
            setResults((current) => ({ ...current, [portfolioId]: result }));
          }
        } catch {
          if (!cancelled) {
            setError("비교 포트폴리오 계산 중 일부 항목을 불러오지 못했습니다.");
          }
        } finally {
          if (!cancelled) {
            setLoadingIds((current) => {
              const next = new Set(current);
              next.delete(portfolioId);
              return next;
            });
          }
        }
      }
    }

    runMissing();
    return () => {
      cancelled = true;
    };
  }, [baseInput, comparisonEnabled, results, slots]);

  const visibleSeries = comparisonEnabled
    ? activeSeries.filter((series) => series.enabled)
    : [];
  const hasPortfolios = portfolios.length > 0;
  const isLoading = loadingIds.size > 0;

  function updateSlot(slotId: string, patch: Partial<Slot>) {
    setSlots((current) =>
      current.map((slot) => (slot.id === slotId ? { ...slot, ...patch } : slot)),
    );
  }

  return (
    <section className="grid gap-3">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-subtle sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-primary">자산 추이</h2>
          <p className="mt-1 text-sm text-secondary">
            저장된 포트폴리오와 현재 시나리오를 같은 기간과 적립 조건으로 비교합니다.
          </p>
        </div>
        <button
          type="button"
          disabled={!hasPortfolios}
          onClick={() => setComparisonEnabled((current) => !current)}
          className={`h-10 rounded-lg border px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
            comparisonEnabled
              ? "border-brand bg-brand text-white"
              : "border-border bg-card-subtle text-primary hover:bg-card"
          }`}
        >
          {hasPortfolios ? "비교" : "비교 불가"}
        </button>
      </div>

      {comparisonEnabled ? (
        <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-subtle">
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => {
              const selectedPortfolio = portfolios.find(
                (portfolio) => portfolio.id === slot.portfolioId,
              );

              return (
                <div
                  key={slot.id}
                  className="flex min-w-0 flex-wrap items-center gap-2 rounded-full border border-border bg-card-subtle px-3 py-2"
                >
                  <button
                    type="button"
                    onClick={() => updateSlot(slot.id, { enabled: !slot.enabled })}
                    className="flex items-center gap-2 text-sm font-bold"
                    style={{ color: slot.enabled ? slot.color : undefined }}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: slot.color }}
                    />
                    {slot.label}
                  </button>
                  <select
                    value={slot.portfolioId}
                    onChange={(event) =>
                      updateSlot(slot.id, { portfolioId: event.target.value })
                    }
                    className="max-w-[180px] truncate rounded border border-border bg-card px-2 py-1 text-xs font-semibold text-primary"
                    aria-label={`${slot.label} 비교 포트폴리오 선택`}
                  >
                    {portfolios.map((portfolio) => (
                      <option key={portfolio.id} value={portfolio.id}>
                        {portfolio.name}
                      </option>
                    ))}
                  </select>
                  {selectedPortfolio && loadingIds.has(selectedPortfolio.id) ? (
                    <span className="text-xs font-bold text-secondary">계산 중</span>
                  ) : null}
                </div>
              );
            })}
          </div>
          {isLoading ? (
            <p className="text-xs font-semibold text-secondary">
              선택한 포트폴리오 백테스트를 계산하고 있습니다.
            </p>
          ) : null}
          {error ? <p className="text-xs font-bold text-up">{error}</p> : null}
        </div>
      ) : null}

      <AssetChart
        data={data}
        futureStartDate={futureStartDate}
        comparisons={visibleSeries}
      />

      {visibleSeries.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-subtle">
          <h3 className="text-sm font-bold text-primary">비교 메트릭</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-[520px] w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-secondary">
                  <th className="py-2 pr-4">항목</th>
                  {visibleSeries.map((series) => (
                    <th key={series.id} className="py-2 pr-4">
                      {series.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-2 pr-4 font-bold text-primary">CAGR</td>
                  {visibleSeries.map((series) => (
                    <td key={series.id} className="py-2 pr-4 text-secondary">
                      {formatPercentValue(series.cagr * 100, 2)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-bold text-primary">MDD</td>
                  {visibleSeries.map((series) => (
                    <td key={series.id} className="py-2 pr-4 text-secondary">
                      {formatPercentValue(series.maxDrawdownPercent, 1)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-bold text-primary">최종 자산</td>
                  {visibleSeries.map((series) => (
                    <td key={series.id} className="py-2 pr-4 text-secondary">
                      {formatCompactKRW(series.finalValue)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
