import type { SimulationResult } from "@/lib/simulation/types";

export type Contribution = {
  startMonth: string;
  endMonth: string;
  monthlyAmount: number;
};

export type AdvancedSimulationInput = {
  startDate: Date;
  endDate: Date;
  initialAmount: number;
  contributionSchedule: Contribution[];
  portfolio: { ticker: string; weight: number }[];
  options: {
    reinvestDividends: boolean;
    applyExchangeRate: boolean;
    rebalance: "none" | "quarterly" | "annually";
  };
};

export function simulateAdvanced(_input: AdvancedSimulationInput): SimulationResult {
  throw new Error("simulateAdvanced is implemented in Phase 4.");
}
