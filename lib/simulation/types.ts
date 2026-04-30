export type SimulationPoint = {
  date: string;
  value: number;
  contributions: number;
};

export type YearlyBreakdown = {
  year: number;
  startValue: number;
  contributionsThisYear: number;
  endValue: number;
  yearReturn: number;
  cumReturn: number;
};

export type SimulationResult = {
  finalValue: number;
  totalContributions: number;
  totalReturn: number;
  cagr: number;
  timeSeries: SimulationPoint[];
  yearlyBreakdown: YearlyBreakdown[];
  warnings: string[];
  dataIssues: {
    ticker: string;
    issue: string;
  }[];
};

export type ContributionPeriod = {
  startYearMonth: string;
  endYearMonth: string;
  monthlyAmount: number;
};

export type PortfolioItem = {
  ticker: string;
  weight: number;
};

export type AdvancedOptions = {
  reinvestDividends: boolean;
  applyExchangeRate: boolean;
  inflationAdjusted: boolean;
  rebalance: "none" | "quarterly" | "annually";
};

export type AdvancedSimulationInput = {
  startDate: string;
  endDate: string;
  initialAmount: number;
  contributionSchedule: ContributionPeriod[];
  portfolio: PortfolioItem[];
  options: AdvancedOptions;
};

export type TickerData = {
  ticker: string;
  name: string;
  name_ko: string;
  exchange: string;
  currency: string;
  ipo_date: string;
  data_start: string;
  data_end: string;
  price_schema: string[];
  prices: [string, number][];
  dividends: [string, number][];
};
