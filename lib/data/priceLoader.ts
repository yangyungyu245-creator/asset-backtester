import type { TickerData } from "@/lib/simulation/types";

const cache = new Map<string, TickerData>();

export async function loadTickerData(ticker: string): Promise<TickerData> {
  const normalized = ticker.trim();

  if (cache.has(normalized)) {
    return cache.get(normalized)!;
  }

  const res = await fetch(`/data/${normalized}.json`);
  if (!res.ok) {
    throw new Error(`Failed to load ${normalized}: ${res.status}`);
  }

  const data: TickerData = await res.json();
  cache.set(normalized, data);
  return data;
}

export async function loadMultipleTickers(
  tickers: string[],
): Promise<Map<string, TickerData>> {
  const uniqueTickers = Array.from(new Set(tickers.map((ticker) => ticker.trim())));
  const results = await Promise.all(
    uniqueTickers.map(async (ticker) => [ticker, await loadTickerData(ticker)] as const),
  );

  return new Map(results);
}
