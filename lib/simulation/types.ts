export type SimulationPoint = {
  date: string;
  value: number;
  contributions: number;
  benchmarkValue?: number | null;
  isFuture?: boolean;
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
  maxDrawdown: {
    percent: number;
    peakDate: string;
    troughDate: string;
    peakValue: number;
    troughValue: number;
  };
  timeSeries: SimulationPoint[];
  benchmark?: Omit<SimulationResult, "benchmark">;
  yearlyBreakdown: YearlyBreakdown[];
  initialPortfolio: PortfolioSnapshot[];
  finalPortfolio: PortfolioSnapshot[];
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

export type SimpleContributionPeriod = {
  id: string;
  durationYears: number;
  monthlyAmount: number;
};

export type PortfolioItem = {
  ticker: string;
  weight: number;
};

export type PortfolioSnapshot = {
  ticker: string;
  name: string;
  name_ko: string;
  shares: number;
  value: number;
  weight: number;
};

export type AdvancedOptions = {
  reinvestDividends: boolean;
  applyExchangeRate: boolean;
  inflationAdjusted: boolean;
  rebalance: "none" | "monthly" | "quarterly" | "annually";
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
  category?:
    | "us_stock"
    | "us_etf"
    | "kr_stock"
    | "kr_etf"
    | "intl_stock"
    | "intl_etf"
    | "crypto";
  ipo_date: string;
  data_start: string;
  data_end: string;
  price_schema: string[];
  prices: [string, number][];
  dividends: [string, number][];
};
