import type {
  AllocationMode,
  AdvancedOptions,
  ContributionPeriod,
  SelectedTicker,
} from "@/store/useSimulationStore";
import type { InvestmentFrequency } from "@/lib/simulation/types";

export type ShareScenario = {
  v: 1;
  startDate: string;
  endDate: string;
  selectedTickers: SelectedTicker[];
  allocationMode?: AllocationMode;
  initialAmount: number;
  contributionSchedule: Omit<ContributionPeriod, "id">[];
  contributionFrequency?: InvestmentFrequency;
  options: AdvancedOptions;
};

function toBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

export function encodeScenario(scenario: ShareScenario) {
  return toBase64Url(JSON.stringify(scenario));
}

export function decodeScenario(encoded: string): ShareScenario {
  const scenario = JSON.parse(fromBase64Url(encoded)) as ShareScenario;

  if (
    scenario.v !== 1 ||
    !scenario.startDate ||
    !scenario.endDate ||
    !Array.isArray(scenario.selectedTickers) ||
    !Array.isArray(scenario.contributionSchedule)
  ) {
    throw new Error("공유 URL 형식이 올바르지 않습니다.");
  }

  return scenario;
}
