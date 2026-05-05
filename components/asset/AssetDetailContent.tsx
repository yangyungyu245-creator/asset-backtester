"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactKRW, formatPercentValue } from "@/components/result/format";
import { SaveActionButton } from "@/components/saved/SaveActionButton";

type ChartPoint = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

type AssetDetail = {
  symbol: string;
  kind: "stock" | "etf" | "index" | "fx" | "crypto" | "other";
  displayName?: string;
  name: string;
  nameKo: string;
  assetType: string;
  currency: string | null;
  exchange: string | null;
  latestPrice: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  chart: ChartPoint[];
  chartSource: "local" | "yahoo" | "none";
  fields: {
    marketCap: number | null;
    dividendYield: number | null;
    aum: number | null;
    nav: number | null;
    premiumDiscount: number | null;
    expenseRatio: number | null;
    underlyingIndex: string | null;
    issuer: string | null;
    peRatio: number | null;
    priceToBook: number | null;
    fiftyTwoWeekLow: number | null;
    fiftyTwoWeekHigh: number | null;
    sector: string | null;
    industry: string | null;
    previousClose: number | null;
    latestTradingDate: string | null;
    averageVolume: number | null;
    description: string | null;
  };
  warnings: string[];
};

type AssetDetailViewProps = {
  symbol: string;
};

const periods = [
  { value: "1m", label: "1개월" },
  { value: "3m", label: "3개월" },
  { value: "6m", label: "6개월" },
  { value: "1y", label: "1년" },
  { value: "5y", label: "5년" },
  { value: "max", label: "전체" },
];

const upColor = "#ef4444";
const downColor = "#3b82f6";
const neutralColor = "#737373";

function formatNumber(value: number | null, currency?: string | null) {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  if (currency === "KRW") {
    return formatCompactKRW(value);
  }

  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatLargeNumber(value: number | null, currency?: string | null) {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  if (currency === "KRW") {
    return formatCompactKRW(value);
  }

  return `${new Intl.NumberFormat("ko-KR", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value)} ${currency ?? ""}`.trim();
}

function formatPercent(value: number | null, digits = 2) {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  return formatPercentValue(value, digits);
}

function formatPlainNumber(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  return new Intl.NumberFormat("ko-KR", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function getTrendColor(value: number) {
  if (value > 0) {
    return upColor;
  }

  if (value < 0) {
    return downColor;
  }

  return neutralColor;
}

function getTrendClassName(value: number | null | undefined) {
  if ((value ?? 0) > 0) {
    return "text-red-500";
  }

  if ((value ?? 0) < 0) {
    return "text-blue-500";
  }

  return "text-neutral-500 dark:text-neutral-400";
}

function calculateDomain(chart: ChartPoint[]) {
  const values = chart.flatMap((point) => [point.high, point.low, point.close]);
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return ["auto", "auto"] as ["auto", "auto"];
  }

  const range = max - min || Math.abs(max) * 0.02 || 1;
  const padding = Math.max(range * 0.08, Math.abs(max) * 0.01, 0.01);

  return [min - padding, max + padding] as [number, number];
}

function calculateChartSummary(chart: ChartPoint[]) {
  const first = chart[0];
  const last = chart[chart.length - 1];
  const high = chart.reduce(
    (max, point) => Math.max(max, point.high),
    Number.NEGATIVE_INFINITY,
  );
  const low = chart.reduce(
    (min, point) => Math.min(min, point.low),
    Number.POSITIVE_INFINITY,
  );

  if (!first || !last) {
    return null;
  }

  const change = last.close - first.close;
  const returnRate = first.close > 0 ? (change / first.close) * 100 : 0;

  return {
    start: first.close,
    end: last.close,
    change,
    returnRate,
    high,
    low,
  };
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-neutral-50 p-4 dark:bg-white/[0.04]">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-neutral-950 dark:text-neutral-50">
        {value}
      </p>
    </div>
  );
}

function CandleChart({
  data,
  domain,
  currency,
}: {
  data: ChartPoint[];
  domain: [number, number];
  currency: string | null | undefined;
}) {
  const width = 720;
  const height = 320;
  const padding = { top: 18, right: 12, bottom: 34, left: 54 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const [min, max] = domain;
  const y = (value: number) =>
    padding.top + ((max - value) / Math.max(max - min, 1)) * plotHeight;
  const step = plotWidth / Math.max(data.length - 1, 1);
  const candleWidth = Math.max(3, Math.min(12, step * 0.55));
  const ticks = Array.from({ length: 5 }, (_, index) => min + ((max - min) * index) / 4);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
      {ticks.map((tick) => {
        const tickY = y(tick);

        return (
          <g key={tick}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={tickY}
              y2={tickY}
              stroke="rgba(148,163,184,0.22)"
              strokeDasharray="3 3"
            />
            <text
              x={padding.left - 8}
              y={tickY + 4}
              textAnchor="end"
              className="fill-neutral-500 text-[11px] dark:fill-neutral-400"
            >
              {formatNumber(tick, currency)}
            </text>
          </g>
        );
      })}
      {data.map((point, index) => {
        const x = padding.left + index * step;
        const isUp = point.close >= point.open;
        const color = isUp ? upColor : downColor;
        const bodyTop = y(Math.max(point.open, point.close));
        const bodyBottom = y(Math.min(point.open, point.close));
        const bodyHeight = Math.max(2, bodyBottom - bodyTop);

        return (
          <g key={`${point.date}-${index}`}>
            <line x1={x} x2={x} y1={y(point.high)} y2={y(point.low)} stroke={color} />
            <rect
              x={x - candleWidth / 2}
              y={bodyTop}
              width={candleWidth}
              height={bodyHeight}
              rx={1}
              fill={color}
            />
          </g>
        );
      })}
      {data.length > 0 ? (
        <>
          <text
            x={padding.left}
            y={height - 10}
            className="fill-neutral-500 text-[11px] dark:fill-neutral-400"
          >
            {data[0].date}
          </text>
          <text
            x={width - padding.right}
            y={height - 10}
            textAnchor="end"
            className="fill-neutral-500 text-[11px] dark:fill-neutral-400"
          >
            {data[data.length - 1].date}
          </text>
        </>
      ) : null}
    </svg>
  );
}

function createInfoItems(asset: AssetDetail) {
  const fields = asset.fields;

  if (asset.kind === "fx") {
    return [
      ["통화쌍", asset.displayName ?? asset.symbol],
      ["현재가", formatNumber(asset.latestPrice, asset.currency)],
      ["일간 등락률", formatPercent(asset.changePercent)],
      ["52주 범위", `${formatNumber(fields.fiftyTwoWeekLow, asset.currency)} - ${formatNumber(fields.fiftyTwoWeekHigh, asset.currency)}`],
      ["시장", asset.exchange ?? "외환시장"],
      ["최근 거래일", fields.latestTradingDate ?? "-"],
    ];
  }

  if (asset.kind === "etf") {
    return [
      ["거래소", asset.exchange ?? "-"],
      ["통화", asset.currency ?? "-"],
      ["운용자산(AUM)", formatLargeNumber(fields.aum, asset.currency)],
      ["운용보수", formatPercent(fields.expenseRatio)],
      ["배당수익률", formatPercent(fields.dividendYield)],
      ["NAV", formatNumber(fields.nav, asset.currency)],
      ["괴리율", formatPercent(fields.premiumDiscount)],
      ["운용사/분류", fields.issuer ?? fields.underlyingIndex ?? "-"],
    ];
  }

  if (asset.kind === "index") {
    return [
      ["자산 유형", asset.assetType],
      ["통화", asset.currency ?? "-"],
      ["현재가", formatNumber(asset.latestPrice, asset.currency)],
      ["일간 등락률", formatPercent(asset.changePercent)],
      ["52주 범위", `${formatNumber(fields.fiftyTwoWeekLow, asset.currency)} - ${formatNumber(fields.fiftyTwoWeekHigh, asset.currency)}`],
      ["최근 거래일", fields.latestTradingDate ?? "-"],
    ];
  }

  return [
    ["거래소", asset.exchange ?? "-"],
    ["통화", asset.currency ?? "-"],
    ["시가총액", formatLargeNumber(fields.marketCap, asset.currency)],
    ["배당수익률", formatPercent(fields.dividendYield)],
    ["PER", fields.peRatio ? fields.peRatio.toFixed(2) : "-"],
    ["52주 범위", `${formatNumber(fields.fiftyTwoWeekLow, asset.currency)} - ${formatNumber(fields.fiftyTwoWeekHigh, asset.currency)}`],
    ["섹터/산업", fields.sector ?? fields.industry ?? "-"],
  ];
}

export function AssetDetailView({ symbol }: AssetDetailViewProps) {
  const [period, setPeriod] = useState("1y");
  const [chartMode, setChartMode] = useState<"line" | "candle">("line");
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAsset() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/asset/${encodeURIComponent(symbol)}?period=${period}`,
          { cache: "no-store" },
        );
        const payload = (await response.json()) as AssetDetail;

        if (!response.ok) {
          throw new Error("자산 정보를 불러오지 못했습니다.");
        }

        if (!cancelled) {
          setAsset(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "자산 정보를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadAsset();

    return () => {
      cancelled = true;
    };
  }, [period, symbol]);

  const chartSummary = useMemo(
    () => (asset ? calculateChartSummary(asset.chart) : null),
    [asset],
  );
  const yDomain = useMemo(
    () => (asset ? calculateDomain(asset.chart) : (["auto", "auto"] as ["auto", "auto"])),
    [asset],
  );
  const chartColor = getTrendColor(chartSummary?.change ?? 0);
  const infoItems = asset ? createInfoItems(asset) : [];
  const displayName = asset?.displayName || asset?.nameKo || asset?.name || symbol;
  const hasOhlc = Boolean(
    asset?.chart.some(
      (point) =>
        point.open !== point.close || point.high !== point.close || point.low !== point.close,
    ),
  );
  const canShowCandle = hasOhlc && (asset?.kind === "stock" || asset?.kind === "etf");

  return (
    <section className="grid gap-6 py-4 sm:py-8">
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
        <div className="grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div className="min-w-0">
            <span className="inline-flex rounded-full border border-info/40 px-2.5 py-1 text-xs font-semibold text-info">
              {asset?.assetType ?? "자산 상세"}
            </span>
            <h1 className="mt-3 break-words text-3xl font-semibold tracking-normal text-neutral-950 dark:text-neutral-50">
              {displayName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
              <span className="font-mono">{symbol}</span>
              {asset?.exchange ? <span>{asset.exchange}</span> : null}
              {asset?.currency ? <span>{asset.currency}</span> : null}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-3xl font-semibold tabular-nums text-neutral-950 dark:text-neutral-50">
              {formatNumber(asset?.latestPrice ?? null, asset?.currency)}
            </p>
            <p
              className={`mt-2 text-base font-semibold tabular-nums ${getTrendClassName(
                asset?.changePercent,
              )}`}
            >
              {formatNumber(asset?.change ?? null, asset?.currency)} (
              {formatPercent(asset?.changePercent ?? null)})
            </p>
            {asset?.previousClose ? (
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                전일종가 {formatNumber(asset.previousClose, asset.currency)}
              </p>
            ) : null}
            <div className="mt-4 sm:flex sm:justify-end">
              <SaveActionButton label="관심 종목 추가" />
            </div>
          </div>
        </div>
        {asset?.fields.description ? (
          <div className="border-t border-neutral-200 px-5 py-4 text-sm leading-6 text-neutral-600 dark:border-white/10 dark:text-neutral-300">
            {asset.fields.description}
          </div>
        ) : null}
      </div>

      <section className="min-w-0 overflow-hidden rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a] sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div>
            <h2 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
              가격 차트
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {asset?.chartSource === "local"
                ? "FIRE LIFE 보유 가격 데이터를 사용합니다."
                : asset?.chartSource === "yahoo"
                  ? "Yahoo Finance 차트 데이터를 사용합니다."
                  : "차트 데이터가 아직 준비되지 않았습니다."}
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 gap-2 sm:flex">
              {periods.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setPeriod(item.value)}
                  className={`h-9 rounded-md border px-3 text-xs font-medium transition ${
                    period === item.value
                      ? "border-info bg-info text-white"
                      : "border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-white/10 dark:text-neutral-200 dark:hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
              {(["line", "candle"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  disabled={mode === "candle" && !canShowCandle}
                  onClick={() => setChartMode(mode)}
                  className={`h-9 rounded-md border px-3 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    chartMode === mode
                      ? "border-neutral-950 bg-neutral-950 text-white dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950"
                      : "border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-white/10 dark:text-neutral-200 dark:hover:bg-white/5"
                  }`}
                >
                  {mode === "line" ? "라인" : "캔들"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {chartSummary ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DetailField
              label="선택 기간 수익률"
              value={formatPercent(chartSummary.returnRate)}
            />
            <DetailField
              label="선택 기간 변화"
              value={formatNumber(chartSummary.change, asset?.currency)}
            />
            <DetailField
              label="시작 → 현재"
              value={`${formatNumber(chartSummary.start, asset?.currency)} → ${formatNumber(
                chartSummary.end,
                asset?.currency,
              )}`}
            />
            <DetailField
              label="기간 고가 / 저가"
              value={`${formatNumber(chartSummary.high, asset?.currency)} / ${formatNumber(
                chartSummary.low,
                asset?.currency,
              )}`}
            />
          </div>
        ) : null}

        <div className="mt-5 h-80 min-w-0 overflow-hidden">
          {isLoading ? (
            <div className="h-full animate-pulse rounded-lg bg-neutral-100 dark:bg-white/5" />
          ) : asset && asset.chart.length > 0 ? (
            chartMode === "candle" && canShowCandle && typeof yDomain[0] === "number" ? (
              <CandleChart
                data={asset.chart}
                domain={yDomain}
                currency={asset.currency}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={asset.chart} margin={{ left: -18, right: 4, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="asset-detail-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.28} />
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} minTickGap={28} />
                  <YAxis
                    domain={yDomain}
                    tick={{ fontSize: 12 }}
                    width={54}
                    tickFormatter={(value) =>
                      new Intl.NumberFormat("ko-KR", {
                        notation: "compact",
                        maximumFractionDigits: 1,
                      }).format(Number(value))
                    }
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatNumber(Number(value), asset.currency),
                      "가격",
                    ]}
                    labelFormatter={(label) => `날짜 ${label}`}
                  />
                  <Area
                    dataKey="close"
                    type="monotone"
                    stroke={chartColor}
                    strokeWidth={2}
                    fill="url(#asset-detail-fill)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )
          ) : (
            <div className="grid h-full place-items-center rounded-lg bg-neutral-50 text-sm text-neutral-500 dark:bg-white/[0.04] dark:text-neutral-400">
              차트 데이터 없음
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
        <h2 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
          기본 정보
        </h2>
        {isLoading ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-lg bg-neutral-100 dark:bg-white/5"
              />
            ))}
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {infoItems.map(([label, value]) => (
              <DetailField key={label} label={label} value={value} />
            ))}
          </div>
        )}
        {error ? <p className="mt-4 text-sm text-negative">{error}</p> : null}
        {asset?.warnings.map((warning) => (
          <p key={warning} className="mt-4 text-sm text-info">
            {warning}
          </p>
        ))}
      </section>
    </section>
  );
}
