"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const REFRESH_INTERVAL = 15 * 60 * 1000;

type MarketIndex = {
  symbol: string;
  label: string;
  decimals: number;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  error?: string;
};

type MarketIndicesResponse = {
  indices: MarketIndex[];
  updatedAt: string;
  error?: string;
};

function formatNumber(value: number | null, decimals: number) {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  return new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function formatRelativeTime(value: Date | null) {
  if (!value) {
    return "15분 지연";
  }

  const diffMs = Date.now() - value.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60_000));

  if (diffMinutes < 1) {
    return "방금 갱신";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}분 전 갱신`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours}시간 전 갱신`;
}

export function MarketIndicesWidget() {
  const [data, setData] = useState<MarketIndicesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [hasError, setHasError] = useState(false);

  const loadIndices = useCallback(async (background = false) => {
    if (background) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await fetch("/api/market-indices", {
        cache: "no-store",
      });
      const payload = (await response.json()) as MarketIndicesResponse;

      setData(payload);
      setUpdatedAt(new Date());
      setHasError(!response.ok || Boolean(payload.error));
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadIndices();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadIndices(true);
      }
    }, REFRESH_INTERVAL);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadIndices(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadIndices]);

  const indices = data?.indices ?? [];
  const displayItems: Array<MarketIndex | null> = isLoading
    ? Array.from({ length: 6 }, () => null)
    : indices;

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-950 dark:text-neutral-50">
            시장 지수
          </h2>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            USD/KRW, VIX, 미국·한국 주요 지수
          </p>
        </div>
        <span className="shrink-0 text-xs text-neutral-500 dark:text-neutral-400">
          {isLoading
            ? "불러오는 중"
            : isRefreshing
              ? "갱신 중"
              : formatRelativeTime(updatedAt)}
        </span>
      </div>

      {hasError && !isLoading ? (
        <div className="mt-4 rounded-md bg-neutral-50 px-3 py-4 text-sm text-neutral-500 dark:bg-white/5 dark:text-neutral-400">
          일부 지수 데이터를 불러오지 못했습니다. 표시 가능한 항목만 보여드립니다.
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {displayItems.map((item, index) => {
          if (!item) {
            return (
              <div
                key={index}
                className="h-[104px] animate-pulse rounded-lg bg-neutral-100 dark:bg-white/5"
              />
            );
          }

          const isUp = (item.change ?? 0) > 0;
          const isDown = (item.change ?? 0) < 0;
          const changeClassName = isUp
            ? "text-red-500"
            : isDown
              ? "text-blue-500"
              : "text-neutral-500 dark:text-neutral-400";

          return (
            <Link
              key={item.symbol}
              href={`/asset/${encodeURIComponent(item.symbol)}`}
              className="rounded-lg bg-neutral-50 p-3 dark:bg-white/5"
            >
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                {item.label}
              </p>
              <p className="mt-2 text-base font-semibold text-neutral-950 dark:text-neutral-50">
                {formatNumber(item.price, item.decimals)}
              </p>
              <p className={`mt-1 text-xs font-medium ${changeClassName}`}>
                {isUp ? "▲" : isDown ? "▼" : "-"}{" "}
                {formatNumber(Math.abs(item.change ?? 0), item.decimals)} (
                {formatNumber(Math.abs(item.changePercent ?? 0), 2)}%)
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
