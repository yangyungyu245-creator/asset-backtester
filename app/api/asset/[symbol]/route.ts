import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import type { TickerData } from "@/lib/simulation/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 900;

type AssetRouteContext = {
  params: { symbol: string };
};

type YahooQuote = {
  shortName?: string;
  longName?: string;
  quoteType?: string;
  currency?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  marketCap?: number;
  trailingAnnualDividendYield?: number;
  dividendYield?: number;
  totalAssets?: number;
  netAssets?: number;
  navPrice?: number;
  trailingPE?: number;
  priceToBook?: number;
  fiftyTwoWeekLow?: number;
  fiftyTwoWeekHigh?: number;
  regularMarketPreviousClose?: number;
  regularMarketTime?: number;
  averageDailyVolume3Month?: number;
  exchange?: string;
  exchangeTimezoneShortName?: string;
  fullExchangeName?: string;
  sector?: string;
  industry?: string;
};

type YahooSummaryValue<T = number> = {
  raw?: T;
  fmt?: string;
  longFmt?: string;
};

type YahooQuoteSummary = {
  quoteSummary?: {
    result?: Array<{
      summaryDetail?: {
        previousClose?: YahooSummaryValue;
        dividendYield?: YahooSummaryValue;
        totalAssets?: YahooSummaryValue;
        navPrice?: YahooSummaryValue;
        fiftyTwoWeekLow?: YahooSummaryValue;
        fiftyTwoWeekHigh?: YahooSummaryValue;
        trailingPE?: YahooSummaryValue;
      };
      defaultKeyStatistics?: {
        priceToBook?: YahooSummaryValue;
      };
      assetProfile?: {
        sector?: string;
        industry?: string;
      };
      fundProfile?: {
        feesExpensesInvestment?: {
          annualReportExpenseRatio?: YahooSummaryValue;
        };
        fundOverview?: {
          categoryName?: string;
        };
        topHoldings?: {
          equityHoldings?: {
            priceToBook?: YahooSummaryValue;
          };
        };
      };
    }>;
  };
};

const displayNameMap: Record<string, string> = {
  "^GSPC": "S&P 500",
  "^IXIC": "나스닥",
  "^KS11": "코스피",
  "^KQ11": "코스닥",
  "^VIX": "VIX",
  "KRW=X": "USD/KRW",
};

const periodMap: Record<string, { range: string; interval: string }> = {
  "1m": { range: "1mo", interval: "1d" },
  "3m": { range: "3mo", interval: "1d" },
  "6m": { range: "6mo", interval: "1d" },
  "1y": { range: "1y", interval: "1d" },
  "5y": { range: "5y", interval: "1wk" },
  max: { range: "max", interval: "1mo" },
};

const categoryLabels: Record<string, string> = {
  us_stock: "미국 주식",
  us_etf: "미국 ETF",
  kr_stock: "한국 주식",
  kr_etf: "한국 ETF",
  intl_stock: "해외 주식",
  intl_etf: "해외 ETF",
  crypto: "가상자산",
};

async function readLocalTicker(symbol: string) {
  try {
    const filePath = path.join(process.cwd(), "public", "data", `${symbol}.json`);
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as TickerData;
  } catch {
    return null;
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    next: { revalidate },
    signal: AbortSignal.timeout(8_000),
    headers: {
      Accept: "application/json",
      "User-Agent": "FIRE LIFE asset detail",
    },
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance responded with ${response.status}`);
  }

  return (await response.json()) as T;
}

async function fetchYahooQuote(symbol: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(
      symbol,
    )}`;
    const payload = await fetchJson<{
      quoteResponse?: { result?: YahooQuote[] };
    }>(url);

    return payload.quoteResponse?.result?.[0] ?? null;
  } catch {
    return null;
  }
}

async function fetchYahooSummary(symbol: string) {
  try {
    const modules = [
      "summaryDetail",
      "defaultKeyStatistics",
      "assetProfile",
      "fundProfile",
    ].join(",");
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(
      symbol,
    )}?modules=${modules}`;
    const payload = await fetchJson<YahooQuoteSummary>(url);

    return payload.quoteSummary?.result?.[0] ?? null;
  } catch {
    return null;
  }
}

async function fetchYahooChart(symbol: string, period: string) {
  const option = periodMap[period] ?? periodMap["1y"];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol,
  )}?range=${option.range}&interval=${option.interval}`;
  const payload = await fetchJson<{
    chart?: {
      result?: Array<{
        timestamp?: number[];
        indicators?: {
          quote?: Array<{
            open?: Array<number | null>;
            high?: Array<number | null>;
            low?: Array<number | null>;
            close?: Array<number | null>;
          }>;
        };
      }>;
    };
  }>(url);
  const result = payload.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const quote = result?.indicators?.quote?.[0];
  const opens = quote?.open ?? [];
  const highs = quote?.high ?? [];
  const lows = quote?.low ?? [];
  const closes = quote?.close ?? [];

  return timestamps.flatMap((timestamp, index) => {
    const close = closes[index];

    if (typeof close !== "number" || !Number.isFinite(close)) {
      return [];
    }

    return [
      {
        date: new Date(timestamp * 1000).toISOString().slice(0, 10),
        open:
          typeof opens[index] === "number" && Number.isFinite(opens[index])
            ? opens[index]
            : close,
        high:
          typeof highs[index] === "number" && Number.isFinite(highs[index])
            ? highs[index]
            : close,
        low:
          typeof lows[index] === "number" && Number.isFinite(lows[index])
            ? lows[index]
            : close,
        close,
      },
    ];
  });
}

function filterLocalPrices(
  prices: TickerData["prices"],
  period: string,
) {
  const rows = prices.map(([date, close]) => ({
    date,
    open: close,
    high: close,
    low: close,
    close,
  }));

  if (period === "max") {
    return rows;
  }

  const monthsByPeriod: Record<string, number> = {
    "1m": 1,
    "3m": 3,
    "6m": 6,
    "1y": 12,
    "5y": 60,
  };
  const lastDate = rows[rows.length - 1]?.date;

  if (!lastDate) {
    return [];
  }

  const since = new Date(`${lastDate}T00:00:00Z`);
  since.setUTCMonth(since.getUTCMonth() - (monthsByPeriod[period] ?? 12));
  const sinceDate = since.toISOString().slice(0, 10);

  return rows.filter((row) => row.date >= sinceDate);
}

function inferAssetType(symbol: string, local: TickerData | null, quote: YahooQuote | null) {
  if (local?.category) {
    return categoryLabels[local.category] ?? local.category;
  }

  if (symbol.includes("=X")) {
    return "환율";
  }

  if (symbol.startsWith("^")) {
    return "지수";
  }

  if (quote?.quoteType === "ETF") {
    return "ETF";
  }

  return quote?.quoteType === "EQUITY" ? "주식" : "데이터 준비 중";
}

function formatYield(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) {
    return null;
  }

  return value > 1 ? value : value * 100;
}

function rawValue(value: YahooSummaryValue | undefined) {
  return typeof value?.raw === "number" && Number.isFinite(value.raw)
    ? value.raw
    : null;
}

function getDisplayName(symbol: string, local: TickerData | null, quote: YahooQuote | null) {
  return (
    displayNameMap[symbol] ??
    local?.name_ko ??
    quote?.longName ??
    quote?.shortName ??
    local?.name ??
    symbol
  );
}

function getMarketName(symbol: string, local: TickerData | null, quote: YahooQuote | null) {
  if (symbol.includes("=X")) {
    return "외환시장";
  }

  if (symbol.startsWith("^")) {
    return quote?.fullExchangeName ?? local?.exchange ?? "시장 지수";
  }

  return quote?.fullExchangeName ?? quote?.exchange ?? local?.exchange ?? null;
}

export async function GET(request: Request, { params }: AssetRouteContext) {
  const url = new URL(request.url);
  const period = url.searchParams.get("period") ?? "1y";
  const symbol = decodeURIComponent(params.symbol).trim();
  const [local, quote, summary] = await Promise.all([
    readLocalTicker(symbol),
    fetchYahooQuote(symbol),
    fetchYahooSummary(symbol),
  ]);
  let chart = local ? filterLocalPrices(local.prices, period) : [];
  let chartSource: "local" | "yahoo" | "none" = chart.length > 0 ? "local" : "none";

  if (chart.length === 0) {
    try {
      chart = await fetchYahooChart(symbol, period);
      chartSource = chart.length > 0 ? "yahoo" : "none";
    } catch {
      chart = [];
    }
  }

  const latestLocalPrice = local?.prices[local.prices.length - 1]?.[1] ?? null;
  const latestChartPrice = chart[chart.length - 1]?.close ?? null;
  const latestPrice = quote?.regularMarketPrice ?? latestChartPrice ?? latestLocalPrice;
  const previousClose =
    quote?.regularMarketPreviousClose ??
    rawValue(summary?.summaryDetail?.previousClose);
  const chartChange =
    previousClose && latestPrice ? latestPrice - previousClose : null;
  const dividendYield = formatYield(
    quote?.dividendYield ??
      quote?.trailingAnnualDividendYield ??
      rawValue(summary?.summaryDetail?.dividendYield) ??
      undefined,
  );
  const assetType = inferAssetType(symbol, local, quote);
  const fiftyTwoWeekLow =
    quote?.fiftyTwoWeekLow ?? rawValue(summary?.summaryDetail?.fiftyTwoWeekLow);
  const fiftyTwoWeekHigh =
    quote?.fiftyTwoWeekHigh ?? rawValue(summary?.summaryDetail?.fiftyTwoWeekHigh);
  const latestChartDate = chart[chart.length - 1]?.date ?? null;
  const expenseRatio = rawValue(
    summary?.fundProfile?.feesExpensesInvestment?.annualReportExpenseRatio,
  );

  return NextResponse.json({
    symbol,
    displayName: getDisplayName(symbol, local, quote),
    name: quote?.longName ?? quote?.shortName ?? local?.name ?? symbol,
    nameKo: local?.name_ko ?? "",
    assetType,
    currency: quote?.currency ?? local?.currency ?? null,
    exchange: getMarketName(symbol, local, quote),
    latestPrice,
    previousClose: previousClose ?? null,
    change: quote?.regularMarketChange ?? chartChange,
    changePercent:
      quote?.regularMarketChangePercent ??
      (chartChange !== null && previousClose ? (chartChange / previousClose) * 100 : null),
    chart,
    chartSource,
    fields: {
      marketCap: quote?.marketCap ?? null,
      dividendYield,
      aum:
        quote?.totalAssets ??
        quote?.netAssets ??
        rawValue(summary?.summaryDetail?.totalAssets),
      nav: quote?.navPrice ?? rawValue(summary?.summaryDetail?.navPrice),
      premiumDiscount:
        latestPrice && quote?.navPrice
          ? ((latestPrice - quote.navPrice) / quote.navPrice) * 100
          : null,
      expenseRatio: expenseRatio !== null ? formatYield(expenseRatio) : null,
      underlyingIndex:
        summary?.fundProfile?.fundOverview?.categoryName ??
        (assetType === "지수" ? getDisplayName(symbol, local, quote) : null),
      issuer: null,
      peRatio: quote?.trailingPE ?? rawValue(summary?.summaryDetail?.trailingPE),
      priceToBook:
        quote?.priceToBook ??
        rawValue(summary?.defaultKeyStatistics?.priceToBook) ??
        rawValue(summary?.fundProfile?.topHoldings?.equityHoldings?.priceToBook),
      fiftyTwoWeekLow,
      fiftyTwoWeekHigh,
      sector: quote?.sector ?? summary?.assetProfile?.sector ?? null,
      industry: quote?.industry ?? summary?.assetProfile?.industry ?? null,
      previousClose: previousClose ?? null,
      latestTradingDate:
        quote?.regularMarketTime
          ? new Date(quote.regularMarketTime * 1000).toISOString().slice(0, 10)
          : latestChartDate,
      averageVolume: quote?.averageDailyVolume3Month ?? null,
    },
    updatedAt: new Date().toISOString(),
    warnings:
      chartSource === "none"
        ? ["차트 데이터를 불러오지 못했습니다. 기본 정보만 표시합니다."]
        : [],
  });
}
