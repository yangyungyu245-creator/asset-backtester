"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const REFRESH_INTERVAL = 15 * 60 * 1000;
const STALE_AFTER = 30 * 60 * 1000;

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

function formatUpdateTime(value: Date | null) {
  if (!value) {
    return "갱신 대기 중";
  }

  return value.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getDirection(item: MarketIndex) {
  const change = item.change ?? 0;
  if (change > 0) return "up";
  if (change < 0) return "down";
  return "flat";
}

function getChangeClassName(direction: "up" | "down" | "flat") {
  if (direction === "up") return "text-up";
  if (direction === "down") return "text-down";
  return "text-secondary";
}

function formatSigned(value: number | null, decimals: number) {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${prefix}${formatNumber(Math.abs(value), decimals)}`;
}

function useMarketIndices() {
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
      setUpdatedAt(payload.updatedAt ? new Date(payload.updatedAt) : new Date());
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

  return {
    indices: data?.indices ?? [],
    isLoading,
    isRefreshing,
    updatedAt,
    hasError,
    reload: loadIndices,
  };
}

function MarketCardSkeleton() {
  return (
    <div className="h-[118px] animate-pulse rounded-xl bg-card-subtle p-4">
      <div className="h-4 w-16 rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="mt-4 h-7 w-24 rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="mt-3 h-4 w-20 rounded bg-neutral-200 dark:bg-neutral-700" />
    </div>
  );
}

export function MarketPulseLine() {
  const { indices, isLoading } = useMarketIndices();
  const items = indices
    .filter((item) => ["^KS11", "^IXIC", "^GSPC"].includes(item.symbol))
    .slice(0, 2);

  if (isLoading || items.length === 0) {
    return (
      <span className="text-sm font-medium text-secondary">
        시장 지수 확인 중
      </span>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-secondary">
      {items.map((item) => {
        const direction = getDirection(item);
        return (
          <span key={item.symbol}>
            {item.label}{" "}
            <span className={`font-bold ${getChangeClassName(direction)}`}>
              {formatSigned(item.changePercent, 2)}%
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function MarketIndicesWidget() {
  const { indices, isLoading, isRefreshing, updatedAt, hasError, reload } =
    useMarketIndices();
  const displayItems: Array<MarketIndex | null> = isLoading
    ? Array.from({ length: 6 }, () => null)
    : indices.length > 0
      ? indices
      : Array.from({ length: 6 }, () => null);
  const isStale = updatedAt ? Date.now() - updatedAt.getTime() > STALE_AFTER : false;

  return (
    <section className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-subtle sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[22px] font-bold leading-tight text-primary">
            오늘의 시장
          </h2>
          <p className="mt-1 text-sm text-secondary">
            USD/KRW, VIX, 미국/한국 주요 지수
          </p>
        </div>
        <span
          className={`shrink-0 rounded-sm bg-card-subtle px-2 py-1 text-xs font-semibold ${
            isStale ? "text-amber-500" : "text-secondary"
          }`}
        >
          {isLoading
            ? "불러오는 중"
            : isRefreshing
              ? "갱신 중"
              : `마지막 갱신: ${formatUpdateTime(updatedAt)}`}
        </span>
      </div>

      {hasError && !isLoading ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg bg-card-subtle px-4 py-4 text-sm text-secondary sm:flex-row sm:items-center sm:justify-between">
          <span>시장 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.</span>
          <button
            type="button"
            onClick={() => reload()}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-3 text-sm font-bold text-primary transition hover:bg-card focus:outline-none focus:ring-2 focus:ring-brand/35"
          >
            다시 시도
          </button>
        </div>
      ) : null}

      <div className="mt-5 grid min-w-0 grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {displayItems.map((item, index) => {
          if (!item) {
            return <MarketCardSkeleton key={index} />;
          }

          const direction = getDirection(item);
          const changeClassName = getChangeClassName(direction);

          return (
            <Link
              key={item.symbol}
              href={`/asset/${encodeURIComponent(item.symbol)}`}
              className="min-w-0 rounded-xl bg-card-subtle p-4 transition hover:bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand/35"
            >
              <p className="truncate text-xs font-semibold text-secondary">
                {item.label}
              </p>
              <p className="mt-3 truncate text-xl font-bold tabular-nums text-primary">
                {formatNumber(item.price, item.decimals)}
              </p>
              <p className={`mt-2 truncate text-xs font-bold tabular-nums ${changeClassName}`}>
                {formatSigned(item.change, item.decimals)} ·{" "}
                {formatSigned(item.changePercent, 2)}%
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
