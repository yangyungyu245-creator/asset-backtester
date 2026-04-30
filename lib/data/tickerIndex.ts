export type TickerMeta = {
  ticker: string;
  name: string;
  name_ko: string;
  exchange: string;
  currency: "USD" | "KRW" | "JPY" | "EUR";
  ipo_date: string;
  category:
    | "us_stock"
    | "us_etf"
    | "kr_stock"
    | "kr_etf"
    | "intl_stock"
    | "intl_etf";
};

type TickerIndexResponse = {
  tickers: TickerMeta[];
  last_updated?: string;
};

let cachedTickers: TickerMeta[] | null = null;

export async function loadTickerIndex(): Promise<TickerMeta[]> {
  if (cachedTickers) {
    return cachedTickers;
  }

  const response = await fetch("/data/index.json");
  if (!response.ok) {
    throw new Error("종목 인덱스를 불러오지 못했습니다.");
  }

  const data = (await response.json()) as TickerIndexResponse;
  cachedTickers = data.tickers;
  return cachedTickers;
}
