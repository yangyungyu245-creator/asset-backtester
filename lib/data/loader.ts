export type TickerMeta = {
  ticker: string;
  name: string;
  name_ko: string;
  exchange: string;
  currency: string;
  ipo_date: string;
};

export type TickerIndex = {
  tickers: TickerMeta[];
  last_updated: string;
};
