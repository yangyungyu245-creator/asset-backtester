import type { SimulationResult } from "@/lib/simulation/types";

export type CompoundFrequency = "monthly" | "quarterly" | "annually";

export type SimpleSimulationInput = {
  initialAmount: number;
  monthlyContribution: number;
  annualRate: number;
  years: number;
  compoundFrequency: CompoundFrequency;
};

export function simulateSimple(_input: SimpleSimulationInput): SimulationResult {
  throw new Error("simulateSimple is implemented in Phase 2.");
}
