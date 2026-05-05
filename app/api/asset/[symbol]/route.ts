import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import {
  assetDescriptionMap,
  getAssetDisplayName,
  getAssetKind,
  getAssetKindLabel,
} from "@/lib/data/assetDetail";
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
  regularMarketVolume?: number;
  trailingEps?: number;
  exchange?: string;
  exchangeTimezoneShortName?: string;
  fullExchangeName?: string;
  sector?: string;
  industry?: string;
  fundFamily?: string;
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
        longBusinessSummary?: string;
        city?: string;
        state?: string;
        country?: string;
        fullTimeEmployees?: number;
        website?: string;
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

type YahooAssetProfile = NonNullable<
  NonNullable<YahooQuoteSummary["quoteSummary"]>["result"]
>[number]["assetProfile"];

const periodMap: Record<string, { range: string; interval: string }> = {
  "1d": { range: "1d", interval: "5m" },
  "1w": { range: "5d", interval: "15m" },
  "1m": { range: "1mo", interval: "1d" },
  "3m": { range: "3mo", interval: "1d" },
  "6m": { range: "6mo", interval: "1d" },
  "1y": { range: "1y", interval: "1d" },
  "5y": { range: "5y", interval: "1wk" },
  max: { range: "max", interval: "1mo" },
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
            volume?: Array<number | null>;
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
  const volumes = quote?.volume ?? [];

  return timestamps.flatMap((timestamp, index) => {
    const close = closes[index];

    if (typeof close !== "number" || !Number.isFinite(close)) {
      return [];
    }

    return [
      {
          date:
            period === "1d" || period === "1w"
              ? new Date(timestamp * 1000).toISOString()
              : new Date(timestamp * 1000).toISOString().slice(0, 10),
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
        volume:
          typeof volumes[index] === "number" && Number.isFinite(volumes[index])
            ? volumes[index]
            : null,
      },
    ];
  });
}

function getHeadquarters(profile?: YahooAssetProfile) {
  if (!profile) {
    return null;
  }

  return [profile.city, profile.state, profile.country].filter(Boolean).join(", ") || null;
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
    volume: null as number | null,
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
  const [local, quote, summary, usdKrwQuote] = await Promise.all([
    readLocalTicker(symbol),
    fetchYahooQuote(symbol),
    fetchYahooSummary(symbol),
    symbol === "KRW=X" ? Promise.resolve(null) : fetchYahooQuote("KRW=X"),
  ]);
  const kind = getAssetKind(symbol, local?.category, quote?.quoteType);
  const displayName = getAssetDisplayName({
    symbol,
    localNameKo: local?.name_ko,
    localName: local?.name,
    quoteLongName: quote?.longName,
    quoteShortName: quote?.shortName,
  });
  const localChart = local ? filterLocalPrices(local.prices, period) : [];
  let yahooChart: Awaited<ReturnType<typeof fetchYahooChart>> = [];

  try {
    yahooChart = await fetchYahooChart(symbol, period);
  } catch {
    yahooChart = [];
  }

  const yahooHasOhlc = yahooChart.some(
    (point) =>
      point.open !== point.close || point.high !== point.close || point.low !== point.close,
  );
  const chart =
    yahooHasOhlc || localChart.length === 0
      ? yahooChart
      : localChart;
  const chartSource: "local" | "yahoo" | "none" =
    chart.length === 0 ? "none" : chart === yahooChart ? "yahoo" : "local";
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
  const assetType = getAssetKindLabel(kind);
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
    kind,
    displayName,
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
        (kind === "index" ? displayName : null),
      issuer: quote?.fundFamily ?? null,
      peRatio: quote?.trailingPE ?? rawValue(summary?.summaryDetail?.trailingPE),
      eps: quote?.trailingEps ?? null,
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
      volume: quote?.regularMarketVolume ?? null,
      averageVolume: quote?.averageDailyVolume3Month ?? null,
      description:
        summary?.assetProfile?.longBusinessSummary ??
        assetDescriptionMap[symbol] ??
        null,
      headquarters: getHeadquarters(summary?.assetProfile),
      employees: summary?.assetProfile?.fullTimeEmployees ?? null,
      website: summary?.assetProfile?.website ?? null,
      usdKrw: usdKrwQuote?.regularMarketPrice ?? null,
    },
    updatedAt: new Date().toISOString(),
    warnings:
      chartSource === "none"
        ? ["차트 데이터를 불러오지 못했습니다. 기본 정보만 표시합니다."]
        : [],
  });
}
