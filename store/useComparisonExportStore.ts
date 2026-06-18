"use client";

import { create } from "zustand";
import type { ComparisonSeries } from "@/lib/types/comparison";

type ComparisonExportState = {
  series: ComparisonSeries[];
  setSeries: (series: ComparisonSeries[]) => void;
  clear: () => void;
};

export const useComparisonExportStore = create<ComparisonExportState>((set) => ({
  series: [],
  setSeries: (series) => set({ series }),
  clear: () => set({ series: [] }),
}));
