export type Portfolio = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type PortfolioHolding = {
  id: string;
  portfolio_id: string;
  symbol: string;
  shares: number;
  avg_price: number;
  currency: string;
  created_at: string;
};

export type PortfolioWithStats = Portfolio & {
  holdings: HoldingWithStats[];
  totalValue: number;
  totalCost: number;
  totalReturn: number;
  totalReturnPercent: number;
  monthlyDividend: number;
  annualDividend: number;
};

export type HoldingWithStats = PortfolioHolding & {
  name: string;
  currentPrice: number;
  currentValue: number;
  returnAmount: number;
  returnPercent: number;
  dividendYield: number;
  annualDividendPerShare: number;
  annualDividend: number;
};
