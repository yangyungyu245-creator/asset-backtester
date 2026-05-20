import type {
  AdvancedOptions,
  ContributionPeriod,
  SelectedTicker,
} from "@/store/useSimulationStore";
import type { InvestmentFrequency } from "@/lib/simulation/types";

const compactKrwFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 1,
});

export function formatCompactKRW(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const absolute = Math.abs(Math.round(amount));

  if (absolute >= 100_000_000) {
    return `${sign}${(absolute / 100_000_000).toFixed(2)}억`;
  }

  if (absolute >= 10_000_000) {
    return `${sign}${compactKrwFormatter.format(absolute / 10_000_000)}천만`;
  }

  if (absolute >= 10_000) {
    return `${sign}${compactKrwFormatter.format(absolute / 10_000)}만`;
  }

  return `${sign}${compactKrwFormatter.format(absolute)}원`;
}

export function formatSignedKRW(amount: number): string {
  return `${amount >= 0 ? "+" : ""}${formatCompactKRW(amount)}`;
}

export function formatPercentValue(value: number, digits = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

export function getMonthSpan(startDate: string, endDate: string) {
  const [startYear, startMonth] = startDate.split("-").map(Number);
  const [endYear, endMonth] = endDate.split("-").map(Number);

  if (!startYear || !startMonth || !endYear || !endMonth) {
    return { years: 0, months: 0, totalMonths: 0 };
  }

  const totalMonths = Math.max(
    0,
    (endYear - startYear) * 12 + (endMonth - startMonth),
  );

  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
    totalMonths,
  };
}

export function formatScenarioSummary({
  startDate,
  endDate,
  selectedTickers,
  initialAmount,
  contributionSchedule,
  contributionFrequency = "monthly",
}: {
  startDate: string;
  endDate: string;
  selectedTickers: SelectedTicker[];
  initialAmount: number;
  contributionSchedule: ContributionPeriod[];
  contributionFrequency?: InvestmentFrequency;
}) {
  const { years, months } = getMonthSpan(startDate, endDate);
  const frequencyLabel = {
    daily: "일",
    weekly: "주",
    monthly: "월",
  }[contributionFrequency];
  const activeSchedules = contributionSchedule.filter(
    (period) => period.monthlyAmount > 0,
  );
  const contributionText =
    activeSchedules.length === 0
      ? "적립 없음"
      : activeSchedules.length === 1
        ? `${frequencyLabel} ${formatCompactKRW(activeSchedules[0].monthlyAmount)}`
        : `적립 ${activeSchedules.length}개 구간`;

  return `${startDate} ~ ${endDate} (${years}년 ${months}개월) · 종목 ${selectedTickers.length}개 · 적립 주기 ${frequencyLabel} · 초기 ${formatCompactKRW(initialAmount)} + ${contributionText}`;
}

export function formatContributionBreakdown(
  initialAmount: number,
  totalContributions: number,
) {
  const recurringTotal = Math.max(0, totalContributions - initialAmount);

  if (recurringTotal <= 0) {
    return `초기 ${formatCompactKRW(initialAmount)} 투자`;
  }

  return `초기 ${formatCompactKRW(initialAmount)} + 적립 ${formatCompactKRW(recurringTotal)}`;
}

export function getOptionBadges(options: AdvancedOptions) {
  const rebalanceLabel = {
    none: "리밸런싱 없음",
    monthly: "월 리밸런싱",
    quarterly: "분기 리밸런싱",
    annually: "연간 리밸런싱",
  }[options.rebalance];

  return [
    `배당 재투자 ${options.reinvestDividends ? "ON" : "OFF"}`,
    `환율 적용 ${options.applyExchangeRate ? "ON" : "OFF"}`,
    rebalanceLabel,
    `인플레이션 보정 ${options.inflationAdjusted ? "ON" : "OFF"}`,
  ];
}
