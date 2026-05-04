import { NextResponse } from "next/server";

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

export async function GET() {
  const symbols = MARKET_INDICES.map((item) => item.symbol).join(",");
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(
    symbols,
  )}`;

  try {
    const response = await fetch(url, {
      next: { revalidate },
      headers: {
        "User-Agent": "FIRE LIFE market indices widget",
      },
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance responded with ${response.status}`);
    }

    const payload = (await response.json()) as {
      quoteResponse?: { result?: YahooQuote[] };
    };
    const quoteMap = new Map(
      (payload.quoteResponse?.result ?? []).map((quote) => [quote.symbol, quote]),
    );
    const indices = MARKET_INDICES.map((item) => {
      const quote = quoteMap.get(item.symbol);
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
      };
    });

    return NextResponse.json(
      {
        indices,
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "s-maxage=900, stale-while-revalidate=3600",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        indices: [],
        updatedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Failed to load market indices.",
      },
      { status: 502 },
    );
  }
}
