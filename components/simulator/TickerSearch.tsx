"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { TickerMeta } from "@/lib/data/tickerIndex";
import { createSearcher } from "@/lib/data/tickerSearch";
import { isTickerAvailable } from "@/lib/utils/validation";
import type { SelectedTicker } from "@/store/useSimulationStore";

const popularTickers = [
  "AAPL",
  "MSFT",
  "NVDA",
  "GOOGL",
  "AMZN",
  "005930.KS",
  "000660.KS",
  "005380.KS",
  "035420.KS",
  "035720.KS",
  "SPY",
  "QQQ",
  "VOO",
  "SCHD",
  "069500.KS",
];

type TickerSearchProps = {
  tickers: TickerMeta[];
  startDate: string;
  selectedTickers: SelectedTicker[];
  onAdd: (ticker: string) => void;
  onRemove: (ticker: string) => void;
};

export function TickerSearch({
  tickers,
  startDate,
  selectedTickers,
  onAdd,
  onRemove,
}: TickerSearchProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searcher = useMemo(() => createSearcher(tickers), [tickers]);
  const selectedSet = useMemo(
    () => new Set(selectedTickers.map((item) => item.ticker)),
    [selectedTickers],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 200);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const results = useMemo(() => {
    if (!debouncedQuery) {
      const popular = new Set(popularTickers);
      return tickers.filter((ticker) => popular.has(ticker.ticker)).slice(0, 15);
    }

    return searcher
      .search(debouncedQuery)
      .slice(0, 30)
      .map((result) => result.item);
  }, [debouncedQuery, searcher, tickers]);

  const canAddMore = selectedTickers.length < 10;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
        <label
          htmlFor="tickerSearch"
          className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
        >
          종목 검색
        </label>
        <input
          id="tickerSearch"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="티커 또는 종목명 검색 (예: AAPL, 애플, 삼성전자)"
          className="mt-2 h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none transition focus:ring-2 focus:ring-info dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-50"
        />

        <div className="mt-5 grid gap-3">
          {!debouncedQuery ? (
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              인기 종목
            </p>
          ) : null}
          {results.length === 0 ? (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                &quot;{debouncedQuery}&quot;에 대한 검색 결과가 없습니다.
              </p>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                찾으시는 종목이 사이트에 없으신가요?
              </p>
              <Link
                href={`/request?ticker=${encodeURIComponent(debouncedQuery)}`}
                className="mt-5 inline-flex h-11 items-center justify-center rounded-md border border-neutral-900 bg-neutral-950 px-5 text-sm font-medium text-white transition hover:bg-neutral-800 dark:border-white/10 dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-neutral-200"
              >
                종목 추가 요청하기 →
              </Link>
            </div>
          ) : null}
          {results.map((ticker) => {
            const available = isTickerAvailable(ticker, startDate);
            const selected = selectedSet.has(ticker.ticker);
            const disabled = !available || selected || !canAddMore;

            return (
              <div
                key={ticker.ticker}
                className={`grid gap-3 rounded-lg border p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${
                  available
                    ? "border-neutral-200 dark:border-white/10"
                    : "border-neutral-200 bg-neutral-50 opacity-70 dark:border-white/10 dark:bg-white/[0.03]"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-base text-neutral-950 dark:text-neutral-50">
                      {ticker.ticker}
                    </strong>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                      {ticker.exchange}
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      상장일 {ticker.ipo_date}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-neutral-800 dark:text-neutral-200">
                    {ticker.name_ko || ticker.name}
                  </p>
                  <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                    {ticker.name}
                  </p>
                </div>
                {available ? (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onAdd(ticker.ticker)}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-900 bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-neutral-50 dark:text-neutral-950"
                  >
                    {selected ? "추가됨" : canAddMore ? "추가" : "최대 10개"}
                  </button>
                ) : (
                  <span className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-200 px-3 text-sm font-medium text-neutral-500 dark:border-white/10 dark:text-neutral-400">
                    선택 불가
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <aside className="rounded-lg border border-neutral-200 bg-neutral-50 p-5 dark:border-white/10 dark:bg-white/[0.03] lg:sticky lg:top-6 lg:self-start">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-neutral-950 dark:text-neutral-50">
            선택된 종목
          </h2>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {selectedTickers.length} / 10
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {selectedTickers.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              최소 1개 이상 선택하세요.
            </p>
          ) : (
            selectedTickers.map((item) => (
              <span
                key={item.ticker}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1 text-sm text-neutral-800 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-100"
              >
                {item.ticker}
                <button
                  type="button"
                  onClick={() => onRemove(item.ticker)}
                  className="text-neutral-500 transition hover:text-negative"
                  aria-label={`${item.ticker} 제거`}
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
