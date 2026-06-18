import type { SimulationPoint } from "@/lib/simulation/types";

export type ComparisonSeries = {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
  timeSeries: SimulationPoint[];
  finalValue: number;
  cagr: number;
  maxDrawdownPercent: number;
};
