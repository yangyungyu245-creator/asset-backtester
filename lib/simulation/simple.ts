import type { SimpleContributionPeriod } from "@/lib/simulation/types";

export type CompoundFrequency = "monthly" | "quarterly" | "annually";

export type SimpleSimulationInput = {
  initialAmount: number;
  annualRatePercent: number;
  compoundFrequency: CompoundFrequency;
  contributionSchedule: SimpleContributionPeriod[];
};

export type SimpleSimulationResult = {
  finalValue: number;
  totalContributions: number;
  totalReturn: number;
  effectiveAnnualRate: number;
  timeSeries: {
    period: number;
    date: string;
    contributions: number;
    value: number;
  }[];
  yearlyBreakdown: {
    year: number;
    startValue: number;
    contributions: number;
    interest: number;
    endValue: number;
    cumulativeContributions: number;
    cumReturn: number;
  }[];
};

const monthsByFrequency: Record<CompoundFrequency, number> = {
  monthly: 1,
  quarterly: 3,
  annually: 12,
};

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function formatYearMonth(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

export function simulateSimple(input: SimpleSimulationInput): SimpleSimulationResult {
  const monthsPerPeriod = monthsByFrequency[input.compoundFrequency];
  const periodicRate = input.annualRatePercent / 100 / (12 / monthsPerPeriod);
  const startDate = new Date();
  const schedule =
    input.contributionSchedule.length > 0
      ? input.contributionSchedule
      : [{ id: "default", durationYears: 1, monthlyAmount: 0 }];

  let value = input.initialAmount;
  let totalContributions = input.initialAmount;
  const timeSeries: SimpleSimulationResult["timeSeries"] = [
    {
      period: 0,
      date: formatYearMonth(startDate),
      contributions: totalContributions,
      value,
    },
  ];
  const yearlyBreakdown: SimpleSimulationResult["yearlyBreakdown"] = [];

  let yearStartValue = value;
  let yearContributions = 0;
  let yearInterest = 0;
  let currentMonth = 0;

  for (const contributionPeriod of schedule) {
    const monthsInPeriod = Math.round(contributionPeriod.durationYears * 12);

    for (let month = 1; month <= monthsInPeriod; month += 1) {
      currentMonth += 1;

      let interest = 0;
      if (currentMonth % monthsPerPeriod === 0) {
        const beforeInterest = value;
        value *= 1 + periodicRate;
        interest = value - beforeInterest;
      }

      value += contributionPeriod.monthlyAmount;
      totalContributions += contributionPeriod.monthlyAmount;
      yearInterest += interest;
      yearContributions += contributionPeriod.monthlyAmount;

      const date = addMonths(startDate, currentMonth);
      timeSeries.push({
        period: currentMonth,
        date: formatYearMonth(date),
        contributions: totalContributions,
        value,
      });

      if (currentMonth % 12 === 0) {
        const year = currentMonth / 12;
        const cumReturn =
          totalContributions === 0
            ? 0
            : ((value - totalContributions) / totalContributions) * 100;

        yearlyBreakdown.push({
          year,
          startValue: yearStartValue,
          contributions: yearContributions,
          interest: yearInterest,
          endValue: value,
          cumulativeContributions: totalContributions,
          cumReturn,
        });

        yearStartValue = value;
        yearContributions = 0;
        yearInterest = 0;
      }
    }
  }

  const totalReturn = value - totalContributions;
  const effectiveAnnualRate = (Math.pow(1 + periodicRate, 12 / monthsPerPeriod) - 1) * 100;

  return {
    finalValue: value,
    totalContributions,
    totalReturn,
    effectiveAnnualRate,
    timeSeries,
    yearlyBreakdown,
  };
}
