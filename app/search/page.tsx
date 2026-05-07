"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StockLogo } from "@/components/asset/StockLogo";
import type { AssetLogoType } from "@/components/common/AssetLogo";
import { loadTickerIndex, type TickerMeta } from "@/lib/data/tickerIndex";
import { createSearcher } from "@/lib/data/tickerSearch";

const popularTickers = [
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "AAPL", name: "Apple" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "META", name: "Meta" },
  { symbol: "SPY", name: "S&P 500 ETF" },
  { symbol: "QQQ", name: "NASDAQ ETF" },
  { symbol: "005930.KS", name: "삼성전자" },
  { symbol: "005380.KS", name: "현대자동차" },
  { symbol: "035420.KS", name: "NAVER" },
];

function getTickerAssetType(category: TickerMeta["category"]): AssetLogoType {
  if (category.includes("etf")) return "etf";
  if (category === "crypto") return "crypto";
  if (category.includes("stock")) return "stock";
  return "other";
}

export default function SearchPage() {
  const [tickers, setTickers] = useState<TickerMeta[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickerIndex()
      .then((data) => setTickers(data))
      .catch(() => setError("종목 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 180);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const searcher = useMemo(() => createSearcher(tickers), [tickers]);
  const results = useMemo(() => {
    if (!debouncedQuery) {
      const popular = new Set(popularTickers.map((ticker) => ticker.symbol));
      return tickers.filter((ticker) => popular.has(ticker.ticker)).slice(0, 12);
    }

    return searcher
      .search(debouncedQuery)
      .slice(0, 24)
      .map((result) => result.item);
  }, [debouncedQuery, searcher, tickers]);

  return (
    <div className="grid gap-6 py-4 sm:py-8">
      <section className="grid gap-3">
        <h1 className="text-3xl font-bold text-primary sm:text-[40px]">
          종목 검색
        </h1>
        <p className="text-base text-secondary">
          종목 정보를 확인하고 상세 페이지에서 시뮬레이션으로 이어가세요.
        </p>
      </section>

      <Card rounded="2xl" padding="lg">
        <label htmlFor="assetSearch" className="text-sm font-semibold text-primary">
          종목명 또는 티커
        </label>
        <input
          id="assetSearch"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="예: AAPL, 애플, 삼성전자"
          className="mt-2 h-12 w-full rounded-md border border-border bg-card px-4 text-base text-primary outline-none transition placeholder:text-secondary focus:ring-2 focus:ring-brand/30"
        />

        <section className="mt-5">
          <h2 className="mb-3 text-base font-bold text-primary">인기 종목</h2>
          <div className="flex max-h-[112px] flex-wrap gap-2 overflow-hidden">
            {popularTickers.map((ticker) => (
              <Link
                key={ticker.symbol}
                href={`/asset/${encodeURIComponent(ticker.symbol)}`}
                className="inline-flex min-w-0 items-center gap-2 rounded-lg bg-card-subtle px-3 py-2 transition hover:bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand/35"
              >
                <StockLogo symbol={ticker.symbol} name={ticker.name} size="sm" />
                <span className="max-w-[8.5rem] truncate text-sm font-bold text-primary">
                  {ticker.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-secondary">
            {debouncedQuery ? "검색 결과" : "인기 종목"}
          </p>
          <Link
            href={`/request${debouncedQuery ? `?ticker=${encodeURIComponent(debouncedQuery)}` : ""}`}
            className="text-sm font-bold text-brand transition hover:text-brand-dark"
          >
            종목 추가 요청 →
          </Link>
        </div>

        {loading ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="h-[104px] animate-pulse rounded-xl bg-card-subtle"
              />
            ))}
          </div>
        ) : error ? (
          <div className="mt-4 rounded-xl bg-card-subtle p-5 text-sm text-secondary">
            {error}
          </div>
        ) : results.length === 0 ? (
          <div className="mt-4 rounded-xl bg-card-subtle p-6 text-center">
            <p className="text-sm text-secondary">
              &quot;{debouncedQuery}&quot;에 대한 검색 결과가 없습니다.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {results.map((ticker) => (
              <Link
                key={ticker.ticker}
                href={`/asset/${encodeURIComponent(ticker.ticker)}`}
                className="rounded-xl bg-card-subtle p-4 transition hover:bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand/35"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <StockLogo
                      symbol={ticker.ticker}
                      name={ticker.name_ko || ticker.name}
                      assetType={getTickerAssetType(ticker.category)}
                    />
                    <div className="min-w-0">
                    <p className="font-bold text-primary">{ticker.ticker}</p>
                    <p className="mt-1 truncate text-sm text-primary">
                      {ticker.name_ko || ticker.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-secondary">
                      {ticker.name}
                    </p>
                    </div>
                  </div>
                  <Badge variant="neutral">{ticker.exchange}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card rounded="2xl" className="bg-card-subtle">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-bold text-primary">찾는 종목이 없나요?</p>
            <p className="mt-1 text-sm text-secondary">
              티커를 알려주시면 데이터 추가 가능 여부를 확인합니다.
            </p>
          </div>
          <Button href="/request" variant="ghost">
            종목 추가 요청 →
          </Button>
        </div>
      </Card>
    </div>
  );
}
