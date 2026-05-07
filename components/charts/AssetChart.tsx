"use client";

import { type MutableRefObject, type RefObject, useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createChart,
  type CandlestickData,
  type HistogramData,
  type IChartApi,
  type LineData,
  type MouseEventParams,
  type Time,
} from "lightweight-charts";
import { useQuotes } from "@/hooks/useQuotes";

export type ChartMode = "line" | "candle";
export type Period = "1d" | "1w" | "3m" | "1y" | "5y" | "max";

export type OHLCVData = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
};

type AssetChartProps = {
  symbol?: string;
  data: OHLCVData[];
  currentPeriod: Period;
  onPeriodChange: (period: Period) => void;
  realtimePriceMultiplier?: number;
  priceLabel?: string;
  className?: string;
};

type RealtimeSeries = {
  update: (data: LineData | CandlestickData) => void;
  priceToCoordinate: (price: number) => number | null;
};

type PulseDotProps = {
  chartRef: MutableRefObject<IChartApi | null>;
  seriesRef: MutableRefObject<RealtimeSeries | null>;
  containerRef: RefObject<HTMLDivElement>;
  price: number | null;
  time: Time | null;
};

type HoverData = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
};

const periods: Array<{ value: Period; label: string }> = [
  { value: "1d", label: "1일" },
  { value: "1w", label: "1주" },
  { value: "3m", label: "3달" },
  { value: "1y", label: "1년" },
  { value: "5y", label: "5년" },
  { value: "max", label: "전체" },
];

const movingAverageSeries = [
  { period: 5, color: "#FFBB00", label: "MA5" },
  { period: 20, color: "#06C167", label: "MA20" },
  { period: 60, color: "#8B5CF6", label: "MA60" },
] as const;

function useDarkModeSignal() {
  const [signal, setSignal] = useState(0);

  useEffect(() => {
    const observer = new MutationObserver(() => setSignal((value) => value + 1));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return signal;
}

function normalizeTime(date: string): Time {
  return date.includes("T") ? (Math.floor(new Date(date).getTime() / 1000) as Time) : (date as Time);
}

function getTimeKey(time: Time) {
  if (typeof time === "string" || typeof time === "number") {
    return String(time);
  }

  return `${time.year}-${String(time.month).padStart(2, "0")}-${String(time.day).padStart(2, "0")}`;
}

function toMillis(date: string) {
  return new Date(date.includes("T") ? date : `${date}T00:00:00Z`).getTime();
}

function getDisplayData(data: OHLCVData[], period: Period) {
  if (period === "max" || data.length === 0) return data;
  if (period === "1d") return data.slice(-78);
  if (period === "1w") return data.slice(-130);

  const daysByPeriod: Record<Exclude<Period, "1d" | "1w" | "max">, number> = {
    "3m": 92,
    "1y": 366,
    "5y": 365 * 5 + 2,
  };
  const last = data[data.length - 1];
  const since = new Date(toMillis(last.date));
  since.setUTCDate(since.getUTCDate() - daysByPeriod[period]);
  const sinceTime = since.getTime();

  return data.filter((point) => toMillis(point.date) >= sinceTime);
}

function movingAverage(data: OHLCVData[], period: number): LineData[] {
  if (data.length < period) return [];

  const points: LineData[] = [];
  let rolling = 0;

  data.forEach((point, index) => {
    rolling += point.close;

    if (index >= period) {
      rolling -= data[index - period].close;
    }

    if (index >= period - 1) {
      points.push({
        time: normalizeTime(point.date),
        value: rolling / period,
      });
    }
  });

  return points;
}

function formatTooltipNumber(value: number, suffix?: string) {
  const formatted = new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);

  return suffix ? `${formatted} ${suffix}` : formatted;
}

function formatTooltipVolume(value: number | null) {
  if (!value) return "-";

  return new Intl.NumberFormat("ko-KR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function TooltipRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 justify-between gap-3">
      <span className="text-secondary">{label}</span>
      <span className="text-right font-semibold text-primary text-numeric">{value}</span>
    </div>
  );
}

function PulseDot({ chartRef, seriesRef, containerRef, price, time }: PulseDotProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!price || !time) {
      setPosition(null);
      return undefined;
    }

    let rafId = 0;
    let nestedRafId = 0;

    const updatePosition = () => {
      const chart = chartRef.current;
      const series = seriesRef.current;
      const container = containerRef.current;
      if (!chart || !series || !container) return;

      const y = series.priceToCoordinate(price);
      if (y === null) {
        setPosition(null);
        return;
      }

      const x = chart.timeScale().timeToCoordinate(time) ?? container.clientWidth - 80;
      setPosition({ x, y });
    };

    rafId = requestAnimationFrame(() => {
      nestedRafId = requestAnimationFrame(updatePosition);
    });

    const subscribedChart = chartRef.current;
    subscribedChart?.subscribeCrosshairMove(updatePosition);
    subscribedChart?.timeScale().subscribeVisibleTimeRangeChange(updatePosition);
    window.addEventListener("resize", updatePosition);

    return () => {
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(nestedRafId);
      subscribedChart?.unsubscribeCrosshairMove(updatePosition);
      subscribedChart?.timeScale().unsubscribeVisibleTimeRangeChange(updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [chartRef, containerRef, price, seriesRef, time]);

  if (!position) return null;

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
        zIndex: 10,
      }}
    >
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF6B35] opacity-75" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-[#FF6B35]" />
      </span>
    </div>
  );
}

export default function AssetChart({
  symbol,
  data,
  currentPeriod,
  onPeriodChange,
  realtimePriceMultiplier = 1,
  priceLabel,
  className = "",
}: AssetChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<RealtimeSeries | null>(null);
  const latestCandleRef = useRef<CandlestickData | null>(null);
  const latestLineTimeRef = useRef<Time | null>(null);
  const [mode, setMode] = useState<ChartMode>("line");
  const [showMA5, setShowMA5] = useState(false);
  const [showMA20, setShowMA20] = useState(false);
  const [showMA60, setShowMA60] = useState(false);
  const [hoverData, setHoverData] = useState<HoverData | null>(null);
  const darkModeSignal = useDarkModeSignal();
  const { quotes } = useQuotes(symbol ? [symbol] : [], 60_000);
  const latestQuote = symbol ? quotes.get(symbol.toUpperCase()) : undefined;
  const latestRealtimePrice = latestQuote
    ? latestQuote.price * realtimePriceMultiplier
    : null;
  const safeData = useMemo(
    () =>
      data.filter(
        (point) =>
          Number.isFinite(point.open) &&
          Number.isFinite(point.high) &&
          Number.isFinite(point.low) &&
          Number.isFinite(point.close),
      ),
    [data],
  );
  const displayData = useMemo(
    () => getDisplayData(safeData, currentPeriod),
    [currentPeriod, safeData],
  );
  const displayDataByTime = useMemo(() => {
    return new Map(displayData.map((point) => [getTimeKey(normalizeTime(point.date)), point]));
  }, [displayData]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || displayData.length === 0) return;

    chartRef.current?.remove();
    chartRef.current = null;
    mainSeriesRef.current = null;
    latestCandleRef.current = null;
    latestLineTimeRef.current = null;

    const isDark = document.documentElement.classList.contains("dark");
    const chart = createChart(container, {
      autoSize: true,
      height: window.innerWidth < 640 ? 280 : 400,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: isDark ? "#B0B8C1" : "#6B7684",
        fontFamily: "inherit",
      },
      grid: {
        vertLines: { color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" },
        horzLines: { color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: isDark ? "rgba(255,255,255,0.24)" : "rgba(0,0,0,0.22)",
          style: LineStyle.Dashed,
        },
        horzLine: {
          width: 1,
          color: isDark ? "rgba(255,255,255,0.24)" : "rgba(0,0,0,0.22)",
          style: LineStyle.Dashed,
        },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.08, bottom: 0.24 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: currentPeriod === "1d",
      },
      handleScroll: { vertTouchDrag: false },
    });

    chartRef.current = chart;

    if (mode === "candle") {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#F04452",
        downColor: "#3182F6",
        borderUpColor: "#F04452",
        borderDownColor: "#3182F6",
        wickUpColor: "#F04452",
        wickDownColor: "#3182F6",
      });
      const candleData: CandlestickData[] = displayData.map((point) => ({
        time: normalizeTime(point.date),
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close,
      }));
      candleSeries.setData(candleData);
      latestCandleRef.current = candleData[candleData.length - 1] ?? null;
      mainSeriesRef.current = candleSeries;
    } else {
      const lineSeries = chart.addSeries(LineSeries, {
        color: "#FF6B35",
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBackgroundColor: "#FF6B35",
      });
      const lineData = displayData.map((point) => ({
        time: normalizeTime(point.date),
        value: point.close,
      }));
      lineSeries.setData(lineData);
      latestLineTimeRef.current = lineData[lineData.length - 1]?.time ?? null;
      mainSeriesRef.current = lineSeries;
    }

    const displayStart = displayData[0];
    const displayStartTime = displayStart ? toMillis(displayStart.date) : 0;
    movingAverageSeries
      .filter(({ period }) => {
        if (period === 5) return showMA5;
        if (period === 20) return showMA20;
        return showMA60;
      })
      .forEach(({ period, color }) => {
        const maData = movingAverage(safeData, period).filter((point) => {
          const time =
            typeof point.time === "number"
              ? point.time * 1000
              : toMillis(String(point.time));
          return time >= displayStartTime;
        });
        if (maData.length === 0) return;
        const maSeries = chart.addSeries(LineSeries, {
          color,
          lineWidth: 1,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
          autoscaleInfoProvider: () => ({
            priceRange: null,
          }),
        });
        maSeries.setData(maData);
      });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
      lastValueVisible: false,
      priceLineVisible: false,
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    const volumeData: HistogramData[] = displayData.map((point, index) => {
      const previousClose = index > 0 ? displayData[index - 1].close : point.open;
      const isUp = point.close >= previousClose;
      return {
        time: normalizeTime(point.date),
        value: point.volume ?? 0,
        color: isUp
          ? isDark
            ? "rgba(240,68,82,0.34)"
            : "rgba(240,68,82,0.24)"
          : isDark
            ? "rgba(49,130,246,0.34)"
            : "rgba(49,130,246,0.24)",
      };
    });
    volumeSeries.setData(volumeData);

    const handleCrosshairMove = (param: MouseEventParams<Time>) => {
      if (!param.time || !param.point) {
        setHoverData(null);
        return;
      }

      const point = displayDataByTime.get(getTimeKey(param.time));
      setHoverData(point ?? null);
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);

    chart.timeScale().fitContent();

    const handleResize = () => {
      chart.applyOptions({ height: window.innerWidth < 640 ? 280 : 400 });
      chart.timeScale().fitContent();
    };
    const observer = new ResizeObserver(handleResize);
    observer.observe(container);
    window.addEventListener("resize", handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.remove();
      chartRef.current = null;
      mainSeriesRef.current = null;
      latestCandleRef.current = null;
      latestLineTimeRef.current = null;
    };
  }, [currentPeriod, darkModeSignal, displayData, displayDataByTime, mode, safeData, showMA5, showMA20, showMA60]);

  useEffect(() => {
    if (!latestRealtimePrice || !mainSeriesRef.current) return;

    if (mode === "candle" && latestCandleRef.current) {
      const current = latestCandleRef.current;
      const next = {
        ...current,
        high: Math.max(current.high, latestRealtimePrice),
        low: Math.min(current.low, latestRealtimePrice),
        close: latestRealtimePrice,
      };
      latestCandleRef.current = next;
      mainSeriesRef.current.update(next);
    } else if (latestLineTimeRef.current) {
      mainSeriesRef.current.update({
        time: latestLineTimeRef.current,
        value: latestRealtimePrice,
      });
    }
  }, [latestRealtimePrice, mode]);

  const pulseTime = mode === "candle"
    ? latestCandleRef.current?.time ?? null
    : latestLineTimeRef.current;

  return (
    <div className={className}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-card-subtle p-1 sm:flex">
          {periods.map((period) => (
            <button
              key={period.value}
              type="button"
              onClick={() => onPeriodChange(period.value)}
              className={`h-8 rounded-md px-3 text-xs font-bold transition ${
                currentPeriod === period.value
                  ? "bg-card text-primary shadow-subtle"
                  : "text-secondary hover:text-primary"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-card-subtle p-1 sm:w-fit">
          {(["line", "candle"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`h-8 rounded-md px-4 text-xs font-bold transition ${
                mode === item ? "bg-card text-primary shadow-subtle" : "text-secondary hover:text-primary"
              }`}
            >
              {item === "line" ? "라인" : "캔들"}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg bg-card-subtle p-1 sm:w-fit">
          {movingAverageSeries.map(({ period, color, label }) => {
            const active = period === 5 ? showMA5 : period === 20 ? showMA20 : showMA60;
            const toggle = period === 5 ? setShowMA5 : period === 20 ? setShowMA20 : setShowMA60;

            return (
              <button
                key={period}
                type="button"
                onClick={() => toggle((value) => !value)}
                aria-pressed={active}
                className="h-8 rounded-md border px-2.5 text-xs font-semibold transition-colors"
                style={{
                  backgroundColor: active ? `${color}33` : "transparent",
                  borderColor: active ? `${color}66` : "transparent",
                  color: active ? color : "var(--text-secondary)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative mt-3">
        {hoverData ? (
          <div className="pointer-events-none absolute left-2 top-2 z-20 w-[230px] rounded-lg border border-border bg-card/95 px-3 py-2 text-xs shadow-medium backdrop-blur-sm">
            <div className="mb-1.5 font-semibold text-secondary">{hoverData.date}</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <TooltipRow label="시가" value={formatTooltipNumber(hoverData.open, priceLabel)} />
              <TooltipRow label="종가" value={formatTooltipNumber(hoverData.close, priceLabel)} />
              <TooltipRow label="고가" value={formatTooltipNumber(hoverData.high, priceLabel)} />
              <TooltipRow label="저가" value={formatTooltipNumber(hoverData.low, priceLabel)} />
              <div className="col-span-2 mt-1 border-t border-border pt-1">
                <TooltipRow label="거래량" value={formatTooltipVolume(hoverData.volume)} />
              </div>
            </div>
          </div>
        ) : null}
        <div ref={containerRef} className="h-[280px] w-full sm:h-[400px]" />
        <PulseDot
          chartRef={chartRef}
          seriesRef={mainSeriesRef}
          containerRef={containerRef}
          price={latestRealtimePrice}
          time={pulseTime}
        />
      </div>
    </div>
  );
}
