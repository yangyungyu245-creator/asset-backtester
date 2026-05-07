import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type QuoteResult = {
  symbol: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  currency: string;
  marketState: string;
};

type YahooQuote = {
  symbol?: string;
  regularMarketPrice?: number;
  regularMarketPreviousClose?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  currency?: string;
  marketState?: string;
};

function numberOrZero(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function toQuoteResult(symbol: string, quote: YahooQuote): QuoteResult {
  const price = numberOrZero(quote.regularMarketPrice);
  const previousClose = numberOrZero(quote.regularMarketPreviousClose);
  const change =
    typeof quote.regularMarketChange === "number" && Number.isFinite(quote.regularMarketChange)
      ? quote.regularMarketChange
      : price - previousClose;
  const changePercent =
    typeof quote.regularMarketChangePercent === "number" && Number.isFinite(quote.regularMarketChangePercent)
      ? quote.regularMarketChangePercent
      : previousClose > 0
        ? (change / previousClose) * 100
        : 0;

  return {
    symbol: quote.symbol ?? symbol,
    price,
    previousClose,
    change,
    changePercent,
    currency: quote.currency ?? "USD",
    marketState: quote.marketState ?? "CLOSED",
  };
}

async function fetchYahooQuotes(symbols: string[]): Promise<QuoteResult[]> {
  const symbolStr = symbols.map((symbol) => encodeURIComponent(symbol)).join(",");
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolStr}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 FIRE-LIFE/1.0",
    },
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    return fetchYahooQuotesFallback(symbols);
  }

  const json = (await response.json()) as {
    quoteResponse?: { result?: YahooQuote[] };
  };
  const results = json.quoteResponse?.result ?? [];

  if (results.length === 0) {
    return fetchYahooQuotesFallback(symbols);
  }

  return results.map((quote) => toQuoteResult(quote.symbol ?? "", quote));
}

async function fetchYahooQuotesFallback(symbols: string[]): Promise<QuoteResult[]> {
  const results: QuoteResult[] = [];

  await Promise.allSettled(
    symbols.map(async (symbol) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
          symbol,
        )}?range=1d&interval=1m`;
        const response = await fetch(url, {
          headers: {
            Accept: "application/json",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 FIRE-LIFE/1.0",
          },
          next: { revalidate: 60 },
          signal: AbortSignal.timeout(8_000),
        });

        if (!response.ok) return;

        const json = (await response.json()) as {
          chart?: {
            result?: Array<{
              meta?: {
                symbol?: string;
                regularMarketPrice?: number;
                previousClose?: number;
                chartPreviousClose?: number;
                currency?: string;
                marketState?: string;
              };
            }>;
          };
        };
        const meta = json.chart?.result?.[0]?.meta;
        if (!meta) return;

        const price = numberOrZero(meta.regularMarketPrice);
        const previousClose = numberOrZero(meta.previousClose ?? meta.chartPreviousClose);
        const change = price - previousClose;

        results.push({
          symbol: meta.symbol ?? symbol,
          price,
          previousClose,
          change,
          changePercent: previousClose > 0 ? (change / previousClose) * 100 : 0,
          currency: meta.currency ?? "USD",
          marketState: meta.marketState ?? "CLOSED",
        });
      } catch {
        // Skip failed symbols and return the quotes that did resolve.
      }
    }),
  );

  return results;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols =
    searchParams
      .get("symbols")
      ?.split(",")
      .map((symbol) => symbol.trim().toUpperCase())
      .filter(Boolean) ?? [];

  if (symbols.length === 0) {
    return NextResponse.json({ quotes: [], updatedAt: new Date().toISOString() });
  }

  const limitedSymbols = Array.from(new Set(symbols)).slice(0, 20);

  try {
    const quotes = await fetchYahooQuotes(limitedSymbols);
    return NextResponse.json(
      {
        quotes,
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    console.error("[quotes] failed to fetch quotes", error);
    return NextResponse.json(
      {
        quotes: [],
        error: "Failed to fetch quotes",
        updatedAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  }
}
