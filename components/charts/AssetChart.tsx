"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  type Time,
} from "lightweight-charts";

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
  data: OHLCVData[];
  currentPeriod: Period;
  onPeriodChange: (period: Period) => void;
  className?: string;
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

export default function AssetChart({
  data,
  currentPeriod,
  onPeriodChange,
  className = "",
}: AssetChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [mode, setMode] = useState<ChartMode>("line");
  const [showMA5, setShowMA5] = useState(false);
  const [showMA20, setShowMA20] = useState(false);
  const [showMA60, setShowMA60] = useState(false);
  const darkModeSignal = useDarkModeSignal();
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

  useEffect(() => {
    const container = containerRef.current;
    if (!container || safeData.length === 0) return;

    chartRef.current?.remove();
    chartRef.current = null;

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
      const candleData: CandlestickData[] = safeData.map((point) => ({
        time: normalizeTime(point.date),
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close,
      }));
      candleSeries.setData(candleData);
    } else {
      const lineSeries = chart.addSeries(LineSeries, {
        color: "#FF6B35",
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBackgroundColor: "#FF6B35",
      });
      lineSeries.setData(
        safeData.map((point) => ({
          time: normalizeTime(point.date),
          value: point.close,
        })),
      );
    }

    movingAverageSeries
      .filter(({ period }) => {
        if (period === 5) return showMA5;
        if (period === 20) return showMA20;
        return showMA60;
      })
      .forEach(({ period, color }) => {
        const maData = movingAverage(safeData, period);
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

    const volumeData: HistogramData[] = safeData.map((point, index) => {
      const previousClose = index > 0 ? safeData[index - 1].close : point.open;
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
      chart.remove();
      chartRef.current = null;
    };
  }, [currentPeriod, darkModeSignal, mode, safeData, showMA5, showMA20, showMA60]);

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

      <div ref={containerRef} className="mt-3 h-[280px] w-full sm:h-[400px]" />
    </div>
  );
}
