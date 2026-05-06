"use client";

import Link from "next/link";
import { type TouchEvent, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StockLogo } from "@/components/asset/StockLogo";
import { WatchlistButton } from "@/components/watchlist/WatchlistButton";
import { formatCompactKRW, formatPercentValue } from "@/components/result/format";

type ChartPoint = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
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
    eps: number | null;
    priceToBook: number | null;
    fiftyTwoWeekLow: number | null;
    fiftyTwoWeekHigh: number | null;
    sector: string | null;
    industry: string | null;
    previousClose: number | null;
    latestTradingDate: string | null;
    volume: number | null;
    averageVolume: number | null;
    description: string | null;
    headquarters: string | null;
    employees: number | null;
    website: string | null;
    usdKrw: number | null;
  };
  warnings: string[];
};

type AssetDetailViewProps = {
  symbol: string;
};

type Tab = "chart" | "info" | "simulate";
type ChartMode = "line" | "candle";
type CurrencyMode = "native" | "krw";

const periods = [
  { value: "1d", label: "1일" },
  { value: "1w", label: "1주" },
  { value: "3m", label: "3달" },
  { value: "1y", label: "1년" },
  { value: "5y", label: "5년" },
  { value: "max", label: "전체" },
];

const periodLabelMap = new Map(periods.map((item) => [item.value, item.label]));

const tabs: Array<{ value: Tab; label: string }> = [
  { value: "chart", label: "차트" },
  { value: "info", label: "종목정보" },
  { value: "simulate", label: "시뮬레이션" },
];

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getDirection(value: number | null | undefined) {
  if ((value ?? 0) > 0) return "up";
  if ((value ?? 0) < 0) return "down";
  return "flat";
}

function getTrendClassName(value: number | null | undefined) {
  const direction = getDirection(value);
  if (direction === "up") return "text-up";
  if (direction === "down") return "text-down";
  return "text-secondary";
}

function getTrendHex(value: number | null | undefined) {
  const direction = getDirection(value);
  if (direction === "up") return "#F04452";
  if (direction === "down") return "#3182F6";
  return "#8B95A1";
}

function formatDateLabel(value: string) {
  if (value.includes("T")) {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(value));
  }

  return value;
}

function formatNumber(value: number | null | undefined, digits = 2) {
  if (!isFiniteNumber(value)) return "";
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: digits,
  }).format(value);
}

function formatCompact(value: number | null | undefined, currency?: string | null) {
  if (!isFiniteNumber(value)) return "";
  if (currency === "KRW") return formatCompactKRW(value);
  return `${new Intl.NumberFormat("ko-KR", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value)}${currency ? ` ${currency}` : ""}`;
}

function formatPercent(value: number | null | undefined) {
  if (!isFiniteNumber(value)) return "";
  return formatPercentValue(value, 2);
}

function formatSigned(value: number | null | undefined, digits = 2) {
  if (!isFiniteNumber(value)) return "";
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${prefix}${formatNumber(Math.abs(value), digits)}`;
}

function convertValue(
  value: number | null | undefined,
  asset: AssetDetail | null,
  mode: CurrencyMode,
) {
  if (!isFiniteNumber(value) || !asset) return null;
  if (mode === "krw" && asset.currency !== "KRW" && isFiniteNumber(asset.fields.usdKrw)) {
    return value * asset.fields.usdKrw;
  }
  return value;
}

function getDisplayCurrency(asset: AssetDetail | null, mode: CurrencyMode) {
  if (!asset) return "";
  if (mode === "krw" && asset.currency !== "KRW" && asset.fields.usdKrw) return "KRW";
  return asset.currency ?? "";
}

function formatMoney(
  value: number | null | undefined,
  asset: AssetDetail | null,
  mode: CurrencyMode,
  compact = false,
) {
  const converted = convertValue(value, asset, mode);
  const currency = getDisplayCurrency(asset, mode);
  if (!isFiniteNumber(converted)) return "";
  if (currency === "KRW") {
    return compact ? formatCompactKRW(converted) : formatNumber(converted, 0);
  }
  return formatNumber(converted, 2);
}

function getUnit(asset: AssetDetail | null, mode: CurrencyMode) {
  const currency = getDisplayCurrency(asset, mode);
  if (currency === "KRW") return "원";
  if (currency === "USD") return "$";
  return currency;
}

function getPointChange(data: ChartPoint[], index: number) {
  const current = data[index];
  const previous = data[index - 1];
  if (!current || !previous || previous.close <= 0) {
    return { change: null, changePercent: null };
  }

  const change = current.close - previous.close;
  return { change, changePercent: (change / previous.close) * 100 };
}

function getRangeChange(data: ChartPoint[]) {
  const first = data[0];
  const last = data[data.length - 1];
  if (!first || !last || first.close <= 0) {
    return { change: null, changePercent: null };
  }

  const change = last.close - first.close;
  return { change, changePercent: (change / first.close) * 100 };
}

function calculateDomain(data: ChartPoint[]) {
  const values = data.flatMap((point) => [point.high, point.low, point.close]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1] as const;
  const range = max - min || Math.abs(max) * 0.02 || 1;
  const padding = range * 0.1;
  return [min - padding, max + padding] as const;
}

function findHighLow(data: ChartPoint[]) {
  if (data.length === 0) return null;
  let highIndex = 0;
  let lowIndex = 0;
  data.forEach((point, index) => {
    if (point.high > data[highIndex].high) highIndex = index;
    if (point.low < data[lowIndex].low) lowIndex = index;
  });
  return { highIndex, lowIndex };
}

function AssetChartSvg({
  data,
  asset,
  mode,
  currencyMode,
}: {
  data: ChartPoint[];
  asset: AssetDetail;
  mode: ChartMode;
  currencyMode: CurrencyMode;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const width = 760;
  const height = 390;
  const padding = { top: 28, right: 18, bottom: 42, left: 64 };
  const volumeHeight = 64;
  const gap = 18;
  const plotWidth = width - padding.left - padding.right;
  const priceHeight = height - padding.top - padding.bottom - volumeHeight - gap;
  const [min, max] = calculateDomain(data);
  const maxVolume = Math.max(...data.map((point) => point.volume ?? 0), 1);
  const step = plotWidth / Math.max(data.length - 1, 1);
  const candleStep = plotWidth / Math.max(data.length, 1);
  const candleWidth = Math.max(3, Math.min(12, candleStep * 0.55));
  const extreme = findHighLow(data);
  const lineColor = getTrendHex(data[data.length - 1]?.close - data[0]?.close);

  const x = (index: number) =>
    padding.left + (data.length <= 1 ? plotWidth / 2 : index * step);
  const candleX = (index: number) => padding.left + index * candleStep + candleStep / 2;
  const y = (value: number) =>
    padding.top + ((max - value) / Math.max(max - min, 1)) * priceHeight;
  const volumeY = height - padding.bottom - volumeHeight;
  const volumeBarHeight = (value: number | null) =>
    ((value ?? 0) / maxVolume) * volumeHeight;
  const ticks = Array.from({ length: 4 }, (_, index) => min + ((max - min) * index) / 3);
  const points = data.map((point, index) => `${x(index)},${y(point.close)}`).join(" ");
  const areaPoints = `${padding.left},${padding.top + priceHeight} ${points} ${
    padding.left + plotWidth
  },${padding.top + priceHeight}`;
  const hovered =
    hoverIndex !== null ? data[Math.max(0, Math.min(data.length - 1, hoverIndex))] : null;
  const hoveredChange = hoverIndex !== null ? getPointChange(data, hoverIndex) : null;
  const hoverX = hoverIndex !== null ? x(hoverIndex) : padding.left;
  const tooltipLeft = hoverX > width - 250;

  function getIndexFromClientX(clientX: number, svg: SVGSVGElement) {
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = 0;
    const ctm = svg.getScreenCTM();
    if (!ctm) return hoverIndex ?? 0;

    const svgPoint = point.matrixTransform(ctm.inverse());
    const plotLeft = padding.left;
    const plotRight = padding.left + plotWidth;
    const plotX = Math.max(plotLeft, Math.min(plotRight, svgPoint.x));
    const ratio = (plotX - plotLeft) / Math.max(plotRight - plotLeft, 1);
    const raw = Math.round(ratio * Math.max(data.length - 1, 0));
    return Math.max(0, Math.min(data.length - 1, raw));
  }

  function setHoverFromTouch(event: TouchEvent<SVGSVGElement>) {
    const touch = event.touches[0];
    if (touch) setHoverIndex(getIndexFromClientX(touch.clientX, event.currentTarget));
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full touch-pan-y"
      onMouseMove={(event) => setHoverIndex(getIndexFromClientX(event.clientX, event.currentTarget))}
      onMouseLeave={() => setHoverIndex(null)}
      onTouchStart={setHoverFromTouch}
      onTouchMove={setHoverFromTouch}
    >
      <defs>
        <linearGradient id="asset-chart-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.22} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {ticks.map((tick) => {
        const tickY = y(tick);
        return (
          <g key={tick}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={tickY}
              y2={tickY}
              stroke="var(--border)"
              strokeDasharray="3 3"
            />
            <text
              x={padding.left - 10}
              y={tickY + 4}
              textAnchor="end"
              className="fill-secondary text-[11px]"
            >
              {formatMoney(tick, asset, currencyMode, true)}
            </text>
          </g>
        );
      })}

      {mode === "line" ? (
        <>
          <polygon points={areaPoints} fill="url(#asset-chart-fill)" />
          <polyline points={points} fill="none" stroke={lineColor} strokeWidth={3} strokeLinecap="round" />
        </>
      ) : (
        data.map((point, index) => {
          const cx = candleX(index);
          const isUp = point.close >= point.open;
          const color = isUp ? "#F04452" : "#3182F6";
          const top = y(Math.max(point.open, point.close));
          const bottom = y(Math.min(point.open, point.close));
          return (
            <g key={`${point.date}-${index}`}>
              <line x1={cx} x2={cx} y1={y(point.high)} y2={y(point.low)} stroke={color} strokeWidth={1.5} />
              <rect
                x={cx - candleWidth / 2}
                y={top}
                width={candleWidth}
                height={Math.max(2, bottom - top)}
                rx={2}
                fill={color}
              />
            </g>
          );
        })
      )}

      {data.map((point, index) => {
        const barHeight = volumeBarHeight(point.volume);
        const isUp = point.close >= point.open;
        return (
          <rect
            key={`volume-${point.date}-${index}`}
            x={candleX(index) - candleWidth / 2}
            y={volumeY + volumeHeight - barHeight}
            width={candleWidth}
            height={barHeight}
            rx={1}
            fill={isUp ? "rgba(240,68,82,0.28)" : "rgba(49,130,246,0.28)"}
          />
        );
      })}

      {extreme ? (
        <>
          <g>
            <rect
              x={Math.min(width - 132, Math.max(padding.left, x(extreme.highIndex) - 44))}
              y={Math.max(padding.top + 6, y(data[extreme.highIndex].high) - 28)}
              width={132}
              height={24}
              rx={7}
              fill="var(--bg-card)"
              opacity={0.86}
            />
            <text
              x={Math.min(width - 124, Math.max(padding.left + 8, x(extreme.highIndex) - 36))}
              y={Math.max(padding.top + 22, y(data[extreme.highIndex].high) - 12)}
              className="fill-primary text-[11px] font-semibold"
            >
              최고 {formatMoney(data[extreme.highIndex].high, asset, currencyMode, true)}
            </text>
          </g>
          <g>
            <rect
              x={Math.min(width - 132, Math.max(padding.left, x(extreme.lowIndex) - 44))}
              y={Math.min(volumeY - 30, y(data[extreme.lowIndex].low) + 2)}
              width={132}
              height={24}
              rx={7}
              fill="var(--bg-card)"
              opacity={0.86}
            />
            <text
              x={Math.min(width - 124, Math.max(padding.left + 8, x(extreme.lowIndex) - 36))}
              y={Math.min(volumeY - 14, y(data[extreme.lowIndex].low) + 18)}
              className="fill-primary text-[11px] font-semibold"
            >
              최저 {formatMoney(data[extreme.lowIndex].low, asset, currencyMode, true)}
            </text>
          </g>
        </>
      ) : null}

      {data.length > 0 ? (
        <>
          <text x={padding.left} y={height - 12} className="fill-secondary text-[11px]">
            {formatDateLabel(data[0].date)}
          </text>
          <text x={width - padding.right} y={height - 12} textAnchor="end" className="fill-secondary text-[11px]">
            {formatDateLabel(data[data.length - 1].date)}
          </text>
        </>
      ) : null}

      {hovered ? (
        <g>
          <line
            x1={hoverX}
            x2={hoverX}
            y1={padding.top}
            y2={height - padding.bottom}
            stroke="var(--text-secondary)"
            strokeDasharray="3 3"
            opacity={0.55}
          />
          <circle cx={hoverX} cy={y(hovered.close)} r={4} fill={lineColor} />
          <foreignObject
            x={tooltipLeft ? hoverX - 224 : hoverX + 12}
            y={Math.max(8, Math.min(height - 182, y(hovered.high) - 64))}
            width={212}
            height={174}
          >
            <div className="rounded-lg border border-border bg-card p-3 text-xs text-primary shadow-medium">
              <p className="font-semibold">{formatDateLabel(hovered.date)}</p>
              <div className="mt-2 grid gap-1.5 text-secondary">
                {mode === "candle" ? (
                  <>
                    <p>시가 {formatMoney(hovered.open, asset, currencyMode)} {getUnit(asset, currencyMode)}</p>
                    <p>고가 {formatMoney(hovered.high, asset, currencyMode)} {getUnit(asset, currencyMode)}</p>
                    <p>저가 {formatMoney(hovered.low, asset, currencyMode)} {getUnit(asset, currencyMode)}</p>
                  </>
                ) : null}
                <p className="font-bold text-primary">
                  종가 {formatMoney(hovered.close, asset, currencyMode)} {getUnit(asset, currencyMode)}
                </p>
                {hovered.volume ? <p>거래량 {formatCompact(hovered.volume)}</p> : null}
                {isFiniteNumber(hoveredChange?.changePercent) ? (
                  <p className={`font-bold ${getTrendClassName(hoveredChange?.changePercent)}`}>
                    {formatSigned(convertValue(hoveredChange?.change, asset, currencyMode))}{" "}
                    {getUnit(asset, currencyMode)} ({formatPercent(hoveredChange?.changePercent)})
                  </p>
                ) : null}
              </div>
            </div>
          </foreignObject>
        </g>
      ) : null}
    </svg>
  );
}

function KeyMetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card-subtle p-4">
      <p className="text-xs font-semibold text-secondary">{label}</p>
      <p className="mt-2 break-words text-base font-bold text-primary text-numeric">
        {value}
      </p>
    </div>
  );
}

function buildMetricItems(asset: AssetDetail, currencyMode: CurrencyMode) {
  const f = asset.fields;
  const items = [
    ["시가총액", formatCompact(f.marketCap, asset.currency)],
    ["PER (TTM)", isFiniteNumber(f.peRatio) ? f.peRatio.toFixed(2) : ""],
    ["배당수익률", formatPercent(f.dividendYield)],
    ["EPS (TTM)", isFiniteNumber(f.eps) ? `${formatNumber(f.eps, 2)} ${asset.currency ?? ""}`.trim() : ""],
    ["PBR", isFiniteNumber(f.priceToBook) ? f.priceToBook.toFixed(2) : ""],
    [
      "52주 최고/최저",
      isFiniteNumber(f.fiftyTwoWeekHigh) && isFiniteNumber(f.fiftyTwoWeekLow)
        ? `${formatMoney(f.fiftyTwoWeekHigh, asset, currencyMode)} / ${formatMoney(
            f.fiftyTwoWeekLow,
            asset,
            currencyMode,
          )} ${getUnit(asset, currencyMode)}`
        : "",
    ],
    ["일 거래량", formatCompact(f.volume)],
    ["평균 거래량", formatCompact(f.averageVolume)],
    ["운용자산", formatCompact(f.aum, asset.currency)],
    ["운용보수", formatPercent(f.expenseRatio)],
    ["NAV", f.nav ? `${formatNumber(f.nav, 2)} ${asset.currency ?? ""}`.trim() : ""],
  ];
  return items.filter(([, value]) => value) as Array<[string, string]>;
}

function buildCompanyItems(asset: AssetDetail) {
  const f = asset.fields;
  const items = [
    ["섹터", f.sector],
    ["산업", f.industry],
    ["거래소", asset.exchange],
    ["통화", asset.currency],
    ["본사", f.headquarters],
    ["직원 수", isFiniteNumber(f.employees) ? `${formatNumber(f.employees, 0)}명` : ""],
    ["운용사", f.issuer],
    ["기초지수", f.underlyingIndex],
    ["최근 거래일", f.latestTradingDate],
  ];
  return items.filter(([, value]) => value) as Array<[string, string]>;
}

function SimulationPanel({ symbol }: { symbol: string }) {
  return (
    <div className="grid gap-4">
      <Card rounded="2xl" padding="lg" className="bg-brand-bg">
        <h2 className="text-[22px] font-bold text-primary">
          이 종목으로 시뮬레이션
        </h2>
        <p className="mt-2 text-sm leading-6 text-secondary">
          실제 시장 데이터 또는 단순 복리 가정으로 미래 자산을 계산해보세요.
        </p>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card rounded="2xl" padding="lg">
          <div className="text-3xl" aria-hidden="true">📊</div>
          <h3 className="mt-4 text-lg font-bold text-primary">간단 백테스트</h3>
          <p className="mt-2 text-sm leading-6 text-secondary">
            가정한 수익률로 빠르게 복리 결과를 확인합니다.
          </p>
          <Button className="mt-5 w-full" href={`/simple?asset=${encodeURIComponent(symbol)}`}>
            시작 →
          </Button>
        </Card>
        <Card rounded="2xl" padding="lg">
          <div className="text-3xl" aria-hidden="true">📈</div>
          <h3 className="mt-4 text-lg font-bold text-primary">고급 백테스트</h3>
          <p className="mt-2 text-sm leading-6 text-secondary">
            실제 시장 데이터로 과거부터 현재까지 성과를 점검합니다.
          </p>
          <Button className="mt-5 w-full" href={`/advanced/dates?asset=${encodeURIComponent(symbol)}`}>
            시작 →
          </Button>
        </Card>
      </div>
    </div>
  );
}

export function AssetDetailView({ symbol }: AssetDetailViewProps) {
  const [period, setPeriod] = useState("1y");
  const [tab, setTab] = useState<Tab>("chart");
  const [chartMode, setChartMode] = useState<ChartMode>("line");
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>("native");
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
        if (!response.ok) throw new Error("자산 정보를 불러오지 못했습니다.");
        if (!cancelled) setAsset(payload);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "자산 정보를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadAsset();
    return () => {
      cancelled = true;
    };
  }, [period, symbol]);

  useEffect(() => {
    if (asset?.currency !== "KRW" && asset?.fields.usdKrw) {
      setCurrencyMode("krw");
    } else {
      setCurrencyMode("native");
    }
  }, [asset?.currency, asset?.fields.usdKrw]);

  const displayName = asset?.displayName || asset?.nameKo || asset?.name || symbol;
  const canConvert = Boolean(asset && asset.currency !== "KRW" && asset.fields.usdKrw);
  const latest = formatMoney(asset?.latestPrice, asset, currencyMode);
  const unit = getUnit(asset, currencyMode);
  const alternateMode: CurrencyMode = currencyMode === "krw" ? "native" : "krw";
  const alternatePrice =
    canConvert && asset
      ? `${getUnit(asset, alternateMode)}${formatMoney(asset.latestPrice, asset, alternateMode)}`
      : "";
  const convertedChange = convertValue(asset?.change, asset, currencyMode);
  const periodChange = useMemo(
    () => (asset ? getRangeChange(asset.chart) : { change: null, changePercent: null }),
    [asset],
  );
  const convertedPeriodChange = convertValue(periodChange.change, asset, currencyMode);
  const periodLabel = periodLabelMap.get(period) ?? period;
  const metricItems = asset ? buildMetricItems(asset, currencyMode) : [];
  const companyItems = asset ? buildCompanyItems(asset) : [];

  return (
    <div className="grid gap-5 py-4 pb-24 sm:gap-6 sm:py-8 md:pb-8">
      <Card rounded="2xl" padding="lg">
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StockLogo symbol={symbol} name={displayName} size="lg" />
              <h1 className="break-words text-[28px] font-bold leading-tight text-primary">
                {displayName}
              </h1>
              <Badge variant="neutral" className="font-mono">{symbol}</Badge>
              <Badge variant="brand">{asset?.assetType ?? "자산"}</Badge>
            </div>

            <div className="mt-5 flex flex-wrap items-baseline gap-2">
              {isLoading ? (
                <div className="h-12 w-48 animate-pulse rounded-lg bg-card-subtle" />
              ) : latest ? (
                <>
                  {unit === "$" ? <span className="text-[40px] font-bold leading-none text-primary text-numeric">$</span> : null}
                  <span className="text-[40px] font-bold leading-none text-primary text-numeric">
                    {latest}
                  </span>
                  {unit !== "$" ? <span className="text-lg font-semibold text-secondary">{unit}</span> : null}
                  {alternatePrice ? (
                    <span className="text-sm font-semibold text-secondary">
                      {alternatePrice}
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="text-base text-secondary">가격 데이터 준비 중</span>
              )}
            </div>

            {isFiniteNumber(asset?.changePercent) ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="neutral">전 거래일 대비</Badge>
                <span className={`font-bold text-numeric ${getTrendClassName(asset?.changePercent)}`}>
                  {formatSigned(convertedChange)} {unit} ({formatPercent(asset?.changePercent)})
                </span>
                {asset?.previousClose ? (
                  <span className="text-secondary">
                    전일종가 {formatMoney(asset.previousClose, asset, currencyMode)} {unit}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            {canConvert ? (
              <div className="grid grid-cols-2 rounded-lg bg-card-subtle p-1">
                {(["krw", "native"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setCurrencyMode(mode)}
                    className={`h-9 rounded-md px-4 text-sm font-bold transition ${
                      currencyMode === mode ? "bg-card text-primary shadow-subtle" : "text-secondary"
                    }`}
                  >
                    {mode === "krw" ? "원" : asset?.currency ?? "$"}
                  </button>
                ))}
              </div>
            ) : null}
            <WatchlistButton
              symbol={symbol}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-bold text-primary transition hover:bg-card-subtle focus:outline-none focus:ring-2 focus:ring-brand/35"
            />
            <Button href={`/advanced/dates?asset=${encodeURIComponent(symbol)}`} className="hidden md:inline-flex">
              시뮬레이션 시작 →
            </Button>
          </div>
        </div>
      </Card>

      <div className="sticky top-16 z-20 -mx-4 border-b border-border bg-page/95 px-4 backdrop-blur sm:-mx-6 sm:px-6">
        <nav className="mx-auto flex max-w-5xl gap-6" aria-label="자산 상세 탭">
          {tabs.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              className={`border-b-2 py-4 text-sm font-bold transition ${
                tab === item.value
                  ? "border-brand text-primary"
                  : "border-transparent text-secondary hover:text-primary"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === "chart" ? (
        <Card rounded="2xl" padding="lg">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div>
              <h2 className="text-[22px] font-bold text-primary">가격 차트</h2>
              <p className="mt-1 text-sm text-secondary">
                {asset?.chartSource === "local"
                  ? "FIRE LIFE 보유 가격 데이터를 사용합니다."
                  : asset?.chartSource === "yahoo"
                    ? "Yahoo Finance 차트 데이터를 사용합니다."
                    : "차트 데이터가 아직 준비되지 않았습니다."}
              </p>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-card-subtle p-1 sm:flex">
                {periods.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setPeriod(item.value)}
                    className={`h-8 rounded-md px-3 text-xs font-bold transition ${
                      period === item.value ? "bg-card text-primary shadow-subtle" : "text-secondary hover:text-primary"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {isFiniteNumber(periodChange.changePercent) ? (
                <div className="flex flex-wrap items-baseline justify-start gap-2 rounded-lg bg-card-subtle px-3 py-2 text-sm sm:justify-end">
                  <span className="text-secondary">{periodLabel} 등락</span>
                  <span className={`font-bold text-numeric ${getTrendClassName(periodChange.changePercent)}`}>
                    {formatSigned(convertedPeriodChange)} {unit} ({formatPercent(periodChange.changePercent)})
                  </span>
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-card-subtle p-1 sm:ml-auto sm:w-fit">
                {(["line", "candle"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setChartMode(mode)}
                    className={`h-8 rounded-md px-4 text-xs font-bold transition ${
                      chartMode === mode ? "bg-card text-primary shadow-subtle" : "text-secondary hover:text-primary"
                    }`}
                  >
                    {mode === "line" ? "라인" : "캔들"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 h-[390px] overflow-hidden">
            {isLoading ? (
              <div className="h-full animate-pulse rounded-xl bg-card-subtle" />
            ) : asset && asset.chart.length > 0 ? (
              <AssetChartSvg
                data={asset.chart}
                asset={asset}
                mode={chartMode}
                currencyMode={currencyMode}
              />
            ) : (
              <div className="grid h-full place-items-center rounded-xl bg-card-subtle text-sm text-secondary">
                차트 데이터 없음
              </div>
            )}
          </div>
          {error ? <p className="mt-4 text-sm font-semibold text-up">{error}</p> : null}
          {asset?.warnings.map((warning) => (
            <p key={warning} className="mt-4 text-sm text-secondary">{warning}</p>
          ))}
        </Card>
      ) : null}

      {tab === "info" && asset ? (
        <div className="grid gap-5">
          {asset.fields.description ? (
            <Card rounded="2xl" padding="lg">
              <div className="flex items-center gap-2">
                <h2 className="text-[22px] font-bold text-primary">기업 개요</h2>
                <Badge variant="neutral">원문</Badge>
              </div>
              <p className="mt-3 line-clamp-[8] text-sm leading-7 text-secondary">
                {asset.fields.description}
              </p>
            </Card>
          ) : null}

          <Card rounded="2xl" padding="lg">
            <h2 className="text-[22px] font-bold text-primary">주요 지표</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {metricItems.map(([label, value]) => (
                <KeyMetricCard key={label} label={label} value={value} />
              ))}
            </div>
          </Card>

          <Card rounded="2xl" padding="lg">
            <h2 className="text-[22px] font-bold text-primary">기업 정보</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {companyItems.map(([label, value]) => (
                <KeyMetricCard key={label} label={label} value={String(value)} />
              ))}
              {asset.fields.website ? (
                <Link
                  href={asset.fields.website}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-card-subtle p-4 transition hover:bg-brand-bg"
                >
                  <p className="text-xs font-semibold text-secondary">홈페이지</p>
                  <p className="mt-2 break-words text-base font-bold text-brand">
                    바로가기 →
                  </p>
                </Link>
              ) : null}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "simulate" ? <SimulationPanel symbol={symbol} /> : null}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-page/95 p-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-5xl gap-2">
          <WatchlistButton
            symbol={symbol}
            className="inline-flex h-[52px] flex-1 items-center justify-center rounded-lg border border-border px-4 text-sm font-bold text-primary transition hover:bg-card-subtle"
          />
          <Button
            size="lg"
            className="flex-[1.5]"
            href={`/advanced/dates?asset=${encodeURIComponent(symbol)}`}
          >
            시뮬레이션 시작 →
          </Button>
        </div>
      </div>
    </div>
  );
}
