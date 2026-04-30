import { create } from "zustand";

type SimulationStore = {
  mode: "simple" | "advanced" | null;
  setMode: (mode: "simple" | "advanced") => void;
};

export const useSimulationStore = create<SimulationStore>((set) => ({
  mode: null,
  setMode: (mode) => set({ mode }),
}));
