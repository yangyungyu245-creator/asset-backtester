import { NextResponse } from "next/server";
import type { AssetMeta } from "@/lib/types/quotes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 60;

const MAX_SYMBOLS = 100;
const CHUNK_SIZE = 25;

type YahooQuote = {
  symbol?: string;
  regularMarketPrice?: number;
  regularMarketPreviousClose?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  currency?: string;
  marketState?: string;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  regularMarketVolume?: number;
  averageDailyVolume3Month?: number;
  marketCap?: number;
  trailingPE?: number;
  forwardPE?: number;
  priceToBook?: number;
  epsTrailingTwelveMonths?: number;
  epsForward?: number;
  trailingAnnualDividendRate?: number;
  trailingAnnualDividendYield?: number;
  dividendDate?: number;
  exDividendDate?: number;
  shortName?: string;
  longName?: string;
  exchange?: string;
  quoteType?: string;
  beta?: number;
};

function numberOrZero(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function toAssetMeta(symbol: string, quote: YahooQuote): AssetMeta {
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
    dayHigh: numberOrZero(quote.regularMarketDayHigh),
    dayLow: numberOrZero(quote.regularMarketDayLow),
    fiftyTwoWeekHigh: numberOrZero(quote.fiftyTwoWeekHigh),
    fiftyTwoWeekLow: numberOrZero(quote.fiftyTwoWeekLow),
    volume: numberOrZero(quote.regularMarketVolume),
    averageDailyVolume3Month: numberOrZero(quote.averageDailyVolume3Month),
    marketCap: numberOrZero(quote.marketCap),
    trailingPE: numberOrZero(quote.trailingPE),
    forwardPE: numberOrZero(quote.forwardPE),
    priceToBook: numberOrZero(quote.priceToBook),
    trailingEps: numberOrZero(quote.epsTrailingTwelveMonths),
    forwardEps: numberOrZero(quote.epsForward),
    trailingAnnualDividendRate: numberOrZero(quote.trailingAnnualDividendRate),
    trailingAnnualDividendYield: numberOrZero(quote.trailingAnnualDividendYield) * 100,
    dividendDate: numberOrZero(quote.dividendDate) || null,
    exDividendDate: numberOrZero(quote.exDividendDate) || null,
    shortName: quote.shortName ?? quote.symbol ?? symbol,
    longName: quote.longName ?? quote.shortName ?? quote.symbol ?? symbol,
    exchange: quote.exchange ?? "",
    quoteType: quote.quoteType ?? "EQUITY",
    beta: numberOrZero(quote.beta),
  };
}

async function fetchYahooQuotes(symbols: string[]): Promise<AssetMeta[]> {
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

  return results.map((quote) => toAssetMeta(quote.symbol ?? "", quote));
}

async function fetchYahooQuotesFallback(symbols: string[]): Promise<AssetMeta[]> {
  const results: AssetMeta[] = [];

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
          dayHigh: 0,
          dayLow: 0,
          fiftyTwoWeekHigh: 0,
          fiftyTwoWeekLow: 0,
          volume: 0,
          averageDailyVolume3Month: 0,
          marketCap: 0,
          trailingPE: 0,
          forwardPE: 0,
          priceToBook: 0,
          trailingEps: 0,
          forwardEps: 0,
          trailingAnnualDividendRate: 0,
          trailingAnnualDividendYield: 0,
          dividendDate: null,
          exDividendDate: null,
          shortName: meta.symbol ?? symbol,
          longName: meta.symbol ?? symbol,
          exchange: "",
          quoteType: "EQUITY",
          beta: 0,
        });
      } catch {
        // Skip failed symbols and return the quotes that did resolve.
      }
    }),
  );

  return results;
}

async function fetchYahooQuotesInChunks(symbols: string[]) {
  const chunks: string[][] = [];

  for (let i = 0; i < symbols.length; i += CHUNK_SIZE) {
    chunks.push(symbols.slice(i, i + CHUNK_SIZE));
  }

  const results = await Promise.all(chunks.map((chunk) => fetchYahooQuotes(chunk)));
  return results.flat();
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

  const limitedSymbols = Array.from(new Set(symbols)).slice(0, MAX_SYMBOLS);

  try {
    const quotes = await fetchYahooQuotesInChunks(limitedSymbols);
    return NextResponse.json(
      {
        quotes,
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=3600",
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
