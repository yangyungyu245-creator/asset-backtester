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
  exchange?: string;
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

async function fetchYahooChart(symbol: string, period: string) {
  const option = periodMap[period] ?? periodMap["1y"];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol,
  )}?range=${option.range}&interval=${option.interval}`;
  const payload = await fetchJson<{
    chart?: {
      result?: Array<{
        timestamp?: number[];
        indicators?: { quote?: Array<{ close?: Array<number | null> }> };
      }>;
    };
  }>(url);
  const result = payload.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];

  return timestamps.flatMap((timestamp, index) => {
    const close = closes[index];

    if (typeof close !== "number" || !Number.isFinite(close)) {
      return [];
    }

    return [
      {
        date: new Date(timestamp * 1000).toISOString().slice(0, 10),
        close,
      },
    ];
  });
}

function filterLocalPrices(
  prices: TickerData["prices"],
  period: string,
) {
  const rows = prices.map(([date, close]) => ({ date, close }));

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

export async function GET(request: Request, { params }: AssetRouteContext) {
  const url = new URL(request.url);
  const period = url.searchParams.get("period") ?? "1y";
  const symbol = decodeURIComponent(params.symbol).trim();
  const [local, quote] = await Promise.all([
    readLocalTicker(symbol),
    fetchYahooQuote(symbol),
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
  const latestPrice = quote?.regularMarketPrice ?? latestLocalPrice;
  const dividendYield = formatYield(
    quote?.dividendYield ?? quote?.trailingAnnualDividendYield,
  );

  return NextResponse.json({
    symbol,
    name: quote?.longName ?? quote?.shortName ?? local?.name ?? symbol,
    nameKo: local?.name_ko ?? "",
    assetType: inferAssetType(symbol, local, quote),
    currency: quote?.currency ?? local?.currency ?? "데이터 준비 중",
    exchange: quote?.exchange ?? local?.exchange ?? "데이터 준비 중",
    latestPrice,
    change: quote?.regularMarketChange ?? null,
    changePercent: quote?.regularMarketChangePercent ?? null,
    chart,
    chartSource,
    fields: {
      marketCap: quote?.marketCap ?? null,
      dividendYield,
      aum: quote?.totalAssets ?? quote?.netAssets ?? null,
      nav: quote?.navPrice ?? null,
      premiumDiscount:
        latestPrice && quote?.navPrice
          ? ((latestPrice - quote.navPrice) / quote.navPrice) * 100
          : null,
      expenseRatio: null,
      underlyingIndex: null,
      issuer: null,
      peRatio: quote?.trailingPE ?? null,
    },
    updatedAt: new Date().toISOString(),
    warnings:
      chartSource === "none"
        ? ["차트 데이터를 불러오지 못했습니다. 기본 정보만 표시합니다."]
        : [],
  });
}
