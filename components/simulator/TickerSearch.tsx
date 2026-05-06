"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { TickerMeta } from "@/lib/data/tickerIndex";
import { createSearcher } from "@/lib/data/tickerSearch";
import { isTickerAvailable } from "@/lib/utils/validation";
import type { SelectedTicker } from "@/store/useSimulationStore";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StockLogo } from "@/components/asset/StockLogo";
import type { AssetLogoType } from "@/components/common/AssetLogo";

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

function getTickerAssetType(category: TickerMeta["category"]): AssetLogoType {
  if (category.includes("etf")) return "etf";
  if (category === "crypto") return "crypto";
  if (category.includes("stock")) return "stock";
  return "other";
}

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
      <Card rounded="2xl" padding="lg">
        <label
          htmlFor="tickerSearch"
          className="text-sm font-bold text-primary"
        >
          종목 검색
        </label>
        <input
          id="tickerSearch"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="티커 또는 종목명 검색 (예: AAPL, 애플, 삼성전자)"
          className="mt-2 h-12 w-full rounded-md border border-border bg-card px-4 text-base text-primary outline-none transition placeholder:text-secondary focus:ring-2 focus:ring-brand/30"
        />

        <div className="mt-5 grid gap-3">
          {!debouncedQuery ? (
            <p className="text-xs font-bold text-secondary">
              인기 종목
            </p>
          ) : null}
          {results.length === 0 ? (
            <div className="rounded-xl bg-card-subtle p-6 text-center">
              <p className="text-sm text-secondary">
                &quot;{debouncedQuery}&quot;에 대한 검색 결과가 없습니다.
              </p>
              <p className="mt-2 text-sm text-secondary">
                찾으시는 종목이 사이트에 없으신가요?
              </p>
              <Button
                href={`/request?ticker=${encodeURIComponent(debouncedQuery)}`}
                className="mt-5"
              >
                종목 추가 요청하기 →
              </Button>
            </div>
          ) : null}
          {results.map((ticker) => {
            const available = isTickerAvailable(ticker, startDate);
            const selected = selectedSet.has(ticker.ticker);
            const disabled = !available || selected || !canAddMore;
            const detailHref = `/asset/${encodeURIComponent(ticker.ticker)}`;

            return (
              <div
                key={ticker.ticker}
                className={`grid gap-3 rounded-xl p-4 transition sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${
                  available
                    ? "bg-card-subtle hover:bg-brand-bg"
                    : "bg-card-subtle opacity-60"
                }`}
              >
                <div className="min-w-0">
                  <StockLogo
                    symbol={ticker.ticker}
                    name={ticker.name_ko || ticker.name}
                    assetType={getTickerAssetType(ticker.category)}
                    size="sm"
                    className="mb-2"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/asset/${encodeURIComponent(ticker.ticker)}`}
                      className="text-base font-bold text-primary underline-offset-4 hover:text-brand hover:underline"
                    >
                      {ticker.ticker}
                    </Link>
                    <Badge variant="neutral">{ticker.exchange}</Badge>
                    <span className="text-xs text-secondary">
                      상장일 {ticker.ipo_date}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-primary">
                    {ticker.name_ko || ticker.name}
                  </p>
                  <p className="truncate text-xs text-secondary">
                    {ticker.name}
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Link
                    href={detailHref}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-bold text-primary transition hover:bg-card"
                  >
                    상세보기
                  </Link>
                  {available ? (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onAdd(ticker.ticker)}
                      className="inline-flex h-10 items-center justify-center rounded-lg border border-brand bg-brand px-4 text-sm font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {selected ? "추가됨" : canAddMore ? "선택" : "최대 10개"}
                    </button>
                  ) : (
                    <span className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-3 text-sm font-bold text-secondary">
                      선택 불가
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <aside className="rounded-2xl border border-border bg-card p-5 shadow-subtle lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-primary">
            선택된 종목
          </h2>
          <span className="text-xs text-secondary">
            {selectedTickers.length} / 10
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {selectedTickers.length === 0 ? (
            <p className="text-sm text-secondary">
              최소 1개 이상 선택하세요.
            </p>
          ) : (
            selectedTickers.map((item) => (
              <span
                key={item.ticker}
                className="inline-flex items-center gap-2 rounded-sm bg-card-subtle px-3 py-1 text-sm font-bold text-primary"
              >
                <StockLogo symbol={item.ticker} size="sm" />
                {item.ticker}
                <button
                  type="button"
                  onClick={() => onRemove(item.ticker)}
                  className="text-secondary transition hover:text-up"
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
