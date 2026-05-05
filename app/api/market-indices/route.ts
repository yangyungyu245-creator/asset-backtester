import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 900;

const MARKET_INDICES = [
  { symbol: "KRW=X", label: "USD/KRW", decimals: 2 },
  { symbol: "^VIX", label: "VIX", decimals: 2 },
  { symbol: "^GSPC", label: "S&P 500", decimals: 2 },
  { symbol: "^IXIC", label: "나스닥", decimals: 2 },
  { symbol: "^KS11", label: "코스피", decimals: 2 },
  { symbol: "^KQ11", label: "코스닥", decimals: 2 },
] as const;

type YahooQuote = {
  symbol?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketPreviousClose?: number;
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    next: { revalidate },
    signal: AbortSignal.timeout(8_000),
    headers: {
      Accept: "application/json",
      "User-Agent": "FIRE LIFE market indices widget",
    },
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance responded with ${response.status}`);
  }

  return (await response.json()) as T;
}

async function fetchQuote(symbol: string) {
  const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(
    symbol,
  )}`;
  const payload = await fetchJson<{
    quoteResponse?: { result?: YahooQuote[] };
  }>(quoteUrl);
  const quote = payload.quoteResponse?.result?.[0];

  if (!quote) {
    throw new Error(`No quote returned for ${symbol}`);
  }

  return quote;
}

async function fetchChartQuote(symbol: string): Promise<YahooQuote> {
  const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol,
  )}?range=5d&interval=1d`;
  const payload = await fetchJson<{
    chart?: {
      result?: Array<{
        meta?: {
          symbol?: string;
          regularMarketPrice?: number;
          previousClose?: number;
        };
        indicators?: { quote?: Array<{ close?: Array<number | null> }> };
      }>;
    };
  }>(chartUrl);
  const result = payload.chart?.result?.[0];
  const closes =
    result?.indicators?.quote?.[0]?.close?.filter(
      (value): value is number => typeof value === "number" && Number.isFinite(value),
    ) ?? [];
  const price =
    result?.meta?.regularMarketPrice ?? closes[closes.length - 1] ?? undefined;
  const previousClose =
    result?.meta?.previousClose ?? closes[closes.length - 2] ?? undefined;

  if (price === undefined) {
    throw new Error(`No chart price returned for ${symbol}`);
  }

  const change =
    previousClose !== undefined && previousClose > 0 ? price - previousClose : undefined;

  return {
    symbol: result?.meta?.symbol ?? symbol,
    regularMarketPrice: price,
    regularMarketPreviousClose: previousClose,
    regularMarketChange: change,
    regularMarketChangePercent:
      change !== undefined && previousClose ? (change / previousClose) * 100 : undefined,
  };
}

async function fetchMarketIndex(symbol: string) {
  try {
    return await fetchQuote(symbol);
  } catch (quoteError) {
    console.error(`[market-indices] quote failed for ${symbol}`, quoteError);
    return fetchChartQuote(symbol);
  }
}

export async function GET() {
  const results = await Promise.allSettled(
    MARKET_INDICES.map((item) => fetchMarketIndex(item.symbol)),
  );
  const indices = MARKET_INDICES.map((item, index) => {
    const result = results[index];
    const quote = result.status === "fulfilled" ? result.value : null;

    if (result.status === "rejected") {
      console.error(`[market-indices] failed for ${item.symbol}`, result.reason);
    }

    const price = quote?.regularMarketPrice ?? null;
    const change =
      quote?.regularMarketChange ??
      (price !== null && quote?.regularMarketPreviousClose
        ? price - quote.regularMarketPreviousClose
        : null);
    const changePercent =
      quote?.regularMarketChangePercent ??
      (change !== null && quote?.regularMarketPreviousClose
        ? (change / quote.regularMarketPreviousClose) * 100
        : null);

    return {
      symbol: item.symbol,
      label: item.label,
      decimals: item.decimals,
      price,
      change,
      changePercent,
      error: quote ? undefined : "quote unavailable",
    };
  });
  const hasAnyPrice = indices.some((item) => item.price !== null);

  return NextResponse.json(
    {
      indices,
      updatedAt: new Date().toISOString(),
      error: hasAnyPrice ? undefined : "Failed to load market indices.",
    },
    {
      headers: {
        "Cache-Control": "s-maxage=900, stale-while-revalidate=3600",
      },
    },
  );
}
