"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ColorType,
  CrosshairMode,
  LineSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type LineData,
  type Time,
} from "lightweight-charts";
import { formatCompactKRW } from "@/components/result/format";

export type ResultChartPoint = {
  date: string;
  value: number;
  contributions: number;
  benchmarkValue?: number | null;
  isFuture?: boolean;
};

type ResultChartProps = {
  data: ResultChartPoint[];
  height?: number;
  mobileHeight?: number;
  className?: string;
  showLegend?: boolean;
};

declare global {
  interface Window {
    __firelifeResultChartScreenshot?: () => string | null;
  }
}

function normalizeTime(date: string): Time {
  return date.includes("T") ? (Math.floor(new Date(date).getTime() / 1000) as Time) : (date as Time);
}

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

function toLineData(data: ResultChartPoint[], key: "value" | "contributions" | "benchmarkValue") {
  return data
    .filter((point) => {
      const value = point[key];
      return typeof value === "number" && Number.isFinite(value);
    })
    .map((point) => ({
      time: normalizeTime(point.date),
      value: Number(point[key]),
    })) as LineData[];
}

export function ResultChart({
  data,
  height = 360,
  mobileHeight = 280,
  className = "",
  showLegend = true,
}: ResultChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const darkModeSignal = useDarkModeSignal();
  const safeData = useMemo(
    () => data.filter((point) => Number.isFinite(point.value) && Number.isFinite(point.contributions)),
    [data],
  );
  const hasBenchmark = safeData.some(
    (point) => point.benchmarkValue !== null && point.benchmarkValue !== undefined,
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || safeData.length === 0) return;

    chartRef.current?.remove();
    chartRef.current = null;

    const isDark = document.documentElement.classList.contains("dark");
    const chart = createChart(container, {
      autoSize: true,
      height: window.innerWidth < 640 ? mobileHeight : height,
      localization: {
        priceFormatter: (value: number) => formatCompactKRW(value),
      },
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: isDark ? "#B0B8C1" : "#6B7684",
        fontFamily: "inherit",
      },
      grid: {
        vertLines: { color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" },
        horzLines: { color: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.22)",
          style: LineStyle.Dashed,
          width: 1,
        },
        horzLine: {
          color: isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.22)",
          style: LineStyle.Dashed,
          width: 1,
        },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
      handleScroll: { vertTouchDrag: false },
    });

    chartRef.current = chart;

    const portfolioSeries = chart.addSeries(LineSeries, {
      color: "#FF6B35",
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      title: "포트폴리오",
    });
    portfolioSeries.setData(toLineData(safeData, "value"));

    const principalSeries = chart.addSeries(LineSeries, {
      color: isDark ? "#8B95A1" : "#6B7684",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      crosshairMarkerVisible: false,
      title: "원금",
    });
    principalSeries.setData(toLineData(safeData, "contributions"));

    if (hasBenchmark) {
      const benchmarkSeries = chart.addSeries(LineSeries, {
        color: "#8B95A1",
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        crosshairMarkerVisible: false,
        title: "S&P 500",
      });
      benchmarkSeries.setData(toLineData(safeData, "benchmarkValue"));
    }

    chart.timeScale().fitContent();

    window.__firelifeResultChartScreenshot = () => {
      try {
        return chart.takeScreenshot(true, true).toDataURL("image/png");
      } catch {
        return null;
      }
    };

    const handleResize = () => {
      chart.applyOptions({ height: window.innerWidth < 640 ? mobileHeight : height });
      chart.timeScale().fitContent();
    };
    const observer = new ResizeObserver(handleResize);
    observer.observe(container);
    window.addEventListener("resize", handleResize);

    return () => {
      if (window.__firelifeResultChartScreenshot) {
        delete window.__firelifeResultChartScreenshot;
      }
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [darkModeSignal, hasBenchmark, height, mobileHeight, safeData]);

  return (
    <div className={className}>
      {showLegend ? (
        <div className="mb-3 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-semibold text-secondary">
          <span className="inline-flex items-center gap-2">
            <span className="h-0.5 w-6 rounded-full bg-[#FF6B35]" />
            포트폴리오
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-0 w-6 border-t border-dashed border-[#8B95A1]" />
            원금
          </span>
          {hasBenchmark ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-0 w-6 border-t border-dotted border-[#8B95A1]" />
              S&P 500
            </span>
          ) : null}
        </div>
      ) : null}
      <div
        ref={containerRef}
        className="w-full"
        style={{ height: `clamp(${mobileHeight}px, 40vw, ${height}px)` }}
      />
    </div>
  );
}
