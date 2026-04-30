export type CompoundFrequency = "monthly" | "quarterly" | "annually";

export type SimpleSimulationInput = {
  initialAmount: number;
  monthlyContribution: number;
  annualRatePercent: number;
  years: number;
  compoundFrequency: CompoundFrequency;
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
  const periodsPerYear = 12 / monthsPerPeriod;
  const periodicRate = input.annualRatePercent / 100 / periodsPerYear;
  const contributionPerPeriod = input.monthlyContribution * monthsPerPeriod;
  const totalPeriods = input.years * periodsPerYear;
  const startDate = new Date();

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

  for (let period = 1; period <= totalPeriods; period += 1) {
    const beforeInterest = value;
    value *= 1 + periodicRate;
    const interest = value - beforeInterest;
    value += contributionPerPeriod;
    totalContributions += contributionPerPeriod;

    yearInterest += interest;
    yearContributions += contributionPerPeriod;

    const date = addMonths(startDate, period * monthsPerPeriod);
    timeSeries.push({
      period,
      date: formatYearMonth(date),
      contributions: totalContributions,
      value,
    });

    if (period % periodsPerYear === 0) {
      const year = period / periodsPerYear;
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
        cumReturn,
      });

      yearStartValue = value;
      yearContributions = 0;
      yearInterest = 0;
    }
  }

  const totalReturn = value - totalContributions;
  const effectiveAnnualRate = (Math.pow(1 + periodicRate, periodsPerYear) - 1) * 100;

  return {
    finalValue: value,
    totalContributions,
    totalReturn,
    effectiveAnnualRate,
    timeSeries,
    yearlyBreakdown,
  };
}
