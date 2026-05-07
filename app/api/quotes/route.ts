import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";
import type { AssetMeta } from "@/lib/types/quotes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SYMBOLS = 100;
const CHUNK_SIZE = 25;
const yahoo = new yahooFinance({ suppressNotices: ["yahooSurvey"] });

type YahooFinanceQuote = Record<string, unknown>;
type YahooFinanceSummary = {
  summaryDetail?: Record<string, unknown>;
  defaultKeyStatistics?: Record<string, unknown>;
};

function numberOrZero(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function stringOrDefault(value: unknown, fallback: string) {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function toUnixTimestamp(value: unknown): number | null {
  if (!value) return null;

  const time = value instanceof Date ? value.getTime() : new Date(String(value)).getTime();
  return Number.isFinite(time) ? Math.floor(time / 1000) : null;
}

function parseQuote(symbol: string, quote: YahooFinanceQuote): AssetMeta {
  const price = numberOrZero(quote.regularMarketPrice);
  const previousClose = numberOrZero(quote.regularMarketPreviousClose);
  const change =
    typeof quote.regularMarketChange === "number" && Number.isFinite(quote.regularMarketChange)
      ? quote.regularMarketChange
      : price - previousClose;
  const changePercent =
    typeof quote.regularMarketChangePercent === "number" &&
    Number.isFinite(quote.regularMarketChangePercent)
      ? quote.regularMarketChangePercent
      : previousClose > 0
        ? (change / previousClose) * 100
        : 0;
  const quoteSymbol = stringOrDefault(quote.symbol, symbol);
  const shortName = stringOrDefault(quote.shortName, quoteSymbol);
  const longName = stringOrDefault(quote.longName, shortName);

  return {
    symbol: quoteSymbol,
    price,
    previousClose,
    change,
    changePercent,
    currency: stringOrDefault(quote.currency, "USD"),
    marketState: stringOrDefault(quote.marketState, "CLOSED"),
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
    dividendDate: toUnixTimestamp(quote.dividendDate),
    exDividendDate: toUnixTimestamp(quote.exDividendDate),
    shortName,
    longName,
    exchange: stringOrDefault(quote.fullExchangeName, stringOrDefault(quote.exchange, "")),
    quoteType: stringOrDefault(quote.quoteType, "EQUITY"),
    beta: numberOrZero(quote.beta),
  };
}

function needsFundDividendFallback(quote: AssetMeta) {
  return (
    (quote.quoteType === "ETF" || quote.quoteType === "MUTUALFUND") &&
    quote.trailingAnnualDividendRate === 0 &&
    quote.trailingAnnualDividendYield === 0
  );
}

async function enrichFundDividendData(quote: AssetMeta): Promise<AssetMeta> {
  if (!needsFundDividendFallback(quote)) {
    return quote;
  }

  try {
    const summary = (await yahoo.quoteSummary(
      quote.symbol,
      { modules: ["summaryDetail", "defaultKeyStatistics"] },
      { validateResult: false },
    )) as YahooFinanceSummary;
    const rawYield =
      numberOrZero(summary.summaryDetail?.yield) ||
      numberOrZero(summary.defaultKeyStatistics?.yield);

    if (rawYield <= 0) {
      return quote;
    }

    return {
      ...quote,
      trailingAnnualDividendRate: quote.price > 0 ? quote.price * rawYield : 0,
      trailingAnnualDividendYield: rawYield * 100,
    };
  } catch {
    return quote;
  }
}

async function fetchMetaForSymbols(symbols: string[]): Promise<AssetMeta[]> {
  const results = await yahoo.quote(symbols, {}, { validateResult: false });
  const quotes = Array.isArray(results) ? results : [results];

  const parsedQuotes = quotes.map((quote, index) =>
    parseQuote(symbols[index] ?? symbols[0] ?? "", quote as YahooFinanceQuote),
  );

  return Promise.all(parsedQuotes.map(enrichFundDividendData));
}

async function fetchMetaInChunks(symbols: string[]): Promise<AssetMeta[]> {
  const chunks: string[][] = [];

  for (let i = 0; i < symbols.length; i += CHUNK_SIZE) {
    chunks.push(symbols.slice(i, i + CHUNK_SIZE));
  }

  const results = await Promise.allSettled(
    chunks.map((chunk) => fetchMetaForSymbols(chunk)),
  );

  return results
    .filter((result): result is PromiseFulfilledResult<AssetMeta[]> => result.status === "fulfilled")
    .flatMap((result) => result.value);
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
    const quotes = await fetchMetaInChunks(limitedSymbols);

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
