"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SimulationResult } from "@/lib/simulation/types";

export type ContributionPeriod = {
  id: string;
  startYearMonth: string;
  endYearMonth: string;
  monthlyAmount: number;
};

export type SelectedTicker = {
  ticker: string;
  weight: number;
};

export type AdvancedOptions = {
  reinvestDividends: boolean;
  applyExchangeRate: boolean;
  inflationAdjusted: boolean;
  rebalance: "none" | "monthly" | "quarterly" | "annually";
  futureMode: boolean;
};

type SimulationState = {
  startDate: string;
  endDate: string;
  selectedTickers: SelectedTicker[];
  initialAmount: number;
  contributionSchedule: ContributionPeriod[];
  options: AdvancedOptions;
  simulationResult: SimulationResult | null;
  simulationError: string | null;
};

export type SimulationStore = SimulationState & {
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  addTicker: (ticker: string) => void;
  setSelectedTickers: (tickers: SelectedTicker[]) => void;
  removeTicker: (ticker: string) => void;
  updateWeight: (ticker: string, weight: number) => void;
  distributeWeightsEqually: () => void;
  setInitialAmount: (amount: number) => void;
  addContributionPeriod: () => void;
  removeContributionPeriod: (id: string) => void;
  updateContributionPeriod: (
    id: string,
    patch: Partial<ContributionPeriod>,
  ) => void;
  updateOptions: (patch: Partial<AdvancedOptions>) => void;
  loadScenario: (scenario: {
    startDate: string;
    endDate: string;
    selectedTickers: SelectedTicker[];
    initialAmount: number;
    contributionSchedule: Omit<ContributionPeriod, "id">[];
    options: AdvancedOptions;
  }) => void;
  setSimulationResult: (result: SimulationResult | null) => void;
  setSimulationError: (error: string | null) => void;
  reset: () => void;
};

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toYearMonth(date: string) {
  return date.slice(0, 7);
}

function addMonths(yearMonth: string, months: number) {
  const [year, month] = yearMonth.split("-").map(Number);
  const date = new Date(year, month - 1 + months, 1);
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
}

function normalizeScheduleRanges(
  periods: ContributionPeriod[],
  editedIndex: number,
) {
  const normalized = periods.map((period) => ({ ...period }));

  for (let index = editedIndex; index < normalized.length; index += 1) {
    const period = normalized[index];

    if (index < editedIndex) {
      continue;
    }

    const previous = normalized[index - 1];

    const startYearMonth =
      index > editedIndex && previous
        ? addMonths(previous.endYearMonth, 1)
        : period.startYearMonth;

    normalized[index] = {
      ...period,
      startYearMonth,
      endYearMonth:
        period.endYearMonth < startYearMonth ? startYearMonth : period.endYearMonth,
    };
  }

  return normalized;
}

function createPeriod(startDate: string, endDate: string, monthlyAmount = 0) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    startYearMonth: toYearMonth(startDate),
    endYearMonth: toYearMonth(endDate),
    monthlyAmount,
  };
}

function createDefaultState(): SimulationState {
  const today = new Date();
  const tenYearsAgo = new Date(today);
  tenYearsAgo.setFullYear(today.getFullYear() - 10);
  const startDate = formatDate(tenYearsAgo);
  const endDate = formatDate(today);

  return {
    startDate,
    endDate,
    selectedTickers: [],
    initialAmount: 0,
    contributionSchedule: [createPeriod(startDate, endDate)],
    options: {
      reinvestDividends: true,
      applyExchangeRate: true,
      inflationAdjusted: false,
      rebalance: "none",
      futureMode: false,
    },
    simulationResult: null,
    simulationError: null,
  };
}

function clampWeight(weight: number) {
  return Math.min(100, Math.max(0, Number.isFinite(weight) ? weight : 0));
}

function equalWeights(count: number) {
  if (count === 0) {
    return [];
  }

  const base = Math.floor((100 / count) * 100) / 100;
  const weights = Array.from({ length: count }, () => base);
  weights[count - 1] = Number((100 - base * (count - 1)).toFixed(2));
  return weights;
}

const defaultState = createDefaultState();

export const useSimulationStore = create<SimulationStore>()(
  persist(
    (set) => ({
      ...defaultState,
      setStartDate: (date) =>
        set((state) => ({
          startDate: date,
          contributionSchedule:
            state.contributionSchedule.length === 1
              ? [
                  {
                    ...state.contributionSchedule[0],
                    startYearMonth: toYearMonth(date),
                  },
                ]
              : state.contributionSchedule,
        })),
      setEndDate: (date) =>
        set((state) => ({
          endDate: date,
          contributionSchedule:
            state.contributionSchedule.length === 1
              ? [
                  {
                    ...state.contributionSchedule[0],
                    endYearMonth: toYearMonth(date),
                  },
                ]
              : state.contributionSchedule,
        })),
      addTicker: (ticker) =>
        set((state) => {
          if (
            state.selectedTickers.some((item) => item.ticker === ticker) ||
            state.selectedTickers.length >= 10
          ) {
            return state;
          }

          const tickers = [...state.selectedTickers, { ticker, weight: 0 }];
          const weights = equalWeights(tickers.length);

          return {
            selectedTickers: tickers.map((item, index) => ({
              ...item,
              weight: weights[index],
            })),
          };
        }),
      setSelectedTickers: (tickers) =>
        set({
          selectedTickers: tickers.slice(0, 10).map((item) => ({
            ticker: item.ticker.trim().toUpperCase(),
            weight: clampWeight(item.weight),
          })),
          simulationResult: null,
          simulationError: null,
        }),
      removeTicker: (ticker) =>
        set((state) => {
          const tickers = state.selectedTickers.filter(
            (item) => item.ticker !== ticker,
          );
          const weights = equalWeights(tickers.length);

          return {
            selectedTickers: tickers.map((item, index) => ({
              ...item,
              weight: weights[index] ?? 0,
            })),
          };
        }),
      updateWeight: (ticker, weight) =>
        set((state) => ({
          selectedTickers: state.selectedTickers.map((item) =>
            item.ticker === ticker ? { ...item, weight: clampWeight(weight) } : item,
          ),
        })),
      distributeWeightsEqually: () =>
        set((state) => {
          const weights = equalWeights(state.selectedTickers.length);

          return {
            selectedTickers: state.selectedTickers.map((item, index) => ({
              ...item,
              weight: weights[index],
            })),
          };
        }),
      setInitialAmount: (amount) =>
        set({ initialAmount: Math.min(10_000_000_000, Math.max(0, amount)) }),
      addContributionPeriod: () =>
        set((state) => {
          const periods = [...state.contributionSchedule];
          const simulationEnd = toYearMonth(state.endDate);
          const last = periods[periods.length - 1];
          const newStart = last
            ? addMonths(last.startYearMonth, 1)
            : toYearMonth(state.startDate);

          if (!last || newStart > simulationEnd || newStart > last.endYearMonth) {
            return state;
          }

          if (last) {
            last.endYearMonth = addMonths(newStart, -1);
          }

          periods.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            startYearMonth: newStart,
            endYearMonth: simulationEnd,
            monthlyAmount: last?.monthlyAmount ?? 0,
          });

          return { contributionSchedule: periods };
        }),
      removeContributionPeriod: (id) =>
        set((state) => {
          const periods = state.contributionSchedule.filter((item) => item.id !== id);
          if (periods.length === 0) {
            return { contributionSchedule: [createPeriod(state.startDate, state.endDate)] };
          }

          periods[0] = {
            ...periods[0],
            startYearMonth: toYearMonth(state.startDate),
          };
          periods[periods.length - 1] = {
            ...periods[periods.length - 1],
            endYearMonth: toYearMonth(state.endDate),
          };

          return { contributionSchedule: periods };
        }),
      updateContributionPeriod: (id, patch) =>
        set((state) => {
          const editedIndex = state.contributionSchedule.findIndex(
            (period) => period.id === id,
          );

          if (editedIndex === -1) {
            return state;
          }

          const periods = state.contributionSchedule.map((period) =>
            period.id === id ? { ...period, ...patch } : period,
          );

          return {
            contributionSchedule: normalizeScheduleRanges(periods, editedIndex),
          };
        }),
      updateOptions: (patch) =>
        set((state) => ({ options: { ...state.options, ...patch } })),
      loadScenario: (scenario) =>
        set({
          startDate: scenario.startDate,
          endDate: scenario.endDate,
          selectedTickers: scenario.selectedTickers,
          initialAmount: scenario.initialAmount,
          contributionSchedule: scenario.contributionSchedule.map((period, index) => ({
            ...period,
            id: `shared-${index}-${period.startYearMonth}`,
          })),
          options: {
            ...defaultState.options,
            ...scenario.options,
          },
          simulationResult: null,
          simulationError: null,
        }),
      setSimulationResult: (result) =>
        set({ simulationResult: result, simulationError: null }),
      setSimulationError: (error) => set({ simulationError: error }),
      reset: () => set(createDefaultState()),
    }),
    {
      name: "investment-simulation-store",
      version: 2,
    },
  ),
);
