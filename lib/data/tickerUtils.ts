import tickerIndex from "@/public/data/index.json";

type TickerInfo = {
  ticker: string;
  name: string;
  name_ko?: string;
  exchange?: string;
};

const tickerMap = new Map(
  (tickerIndex.tickers as TickerInfo[]).map((ticker) => [
    ticker.ticker.toUpperCase(),
    ticker,
  ]),
);

export function getTickerInfo(symbol: string) {
  return tickerMap.get(symbol.toUpperCase());
}

export function getTickerName(symbol: string) {
  const info = getTickerInfo(symbol);
  return info?.name_ko || info?.name || symbol;
}
