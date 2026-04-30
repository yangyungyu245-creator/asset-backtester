export type SimulationPoint = {
  date: string;
  value: number;
  contributions: number;
};

export type YearlyBreakdown = {
  year: number;
  contributions: number;
  value: number;
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
