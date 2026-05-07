"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AssetLogo from "@/components/common/AssetLogo";
import { getSector } from "@/lib/data/sectors";
import { getHoldings, getPortfolios } from "@/lib/portfolio/actions";
import { calculatePortfolioStats } from "@/lib/portfolio/stats";
import type { PortfolioWithStats } from "@/lib/types/portfolio";
import { useQuotes } from "@/hooks/useQuotes";

type TreemapItem = {
  symbol: string;
  name: string;
  weight: number;
  changePercent: number;
  sector: string;
};

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function getHeatColor(changePercent: number) {
  const alpha = Math.min(0.82, 0.2 + Math.abs(changePercent) * 0.05);
  const rgb = changePercent >= 0 ? "240, 68, 82" : "49, 130, 246";
  return `rgba(${rgb}, ${alpha})`;
}

function Treemap({ items }: { items: TreemapItem[] }) {
  const sorted = [...items].sort((a, b) => b.weight - a.weight);

  if (sorted.length === 0) {
    return (
      <div className="flex min-h-[180px] items-center justify-center rounded-lg bg-card-subtle px-4 text-sm text-secondary">
        가격 정보를 불러오는 중입니다.
      </div>
    );
  }

  return (
    <div
      className="grid min-h-[220px] auto-rows-[72px] gap-0.5 overflow-hidden rounded-lg sm:auto-rows-[88px]"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(92px, 1fr))" }}
    >
      {sorted.map((item) => {
        const span = item.weight > 0.25 ? 2 : 1;
        const rowSpan = item.weight > 0.32 ? 2 : 1;

        return (
          <Link
            key={item.symbol}
            href={`/asset/${encodeURIComponent(item.symbol)}`}
            className="flex min-w-0 flex-col justify-end p-3 text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white/45"
            style={{
              backgroundColor: getHeatColor(item.changePercent),
              gridColumn: `span ${span}`,
              gridRow: `span ${rowSpan}`,
            }}
          >
            <span className="truncate text-[10px] font-semibold text-white/70">
              {item.sector}
            </span>
            <span className="mt-1 truncate text-sm font-black">{item.symbol}</span>
            <span className="mt-0.5 text-xs font-bold text-white/85">
              {formatPercent(item.changePercent)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function PortfolioDashboard() {
  const [portfolio, setPortfolio] = useState<PortfolioWithStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadDashboard() {
      try {
        const portfolios = await getPortfolios();
        const firstPortfolio = portfolios[0];
        if (!firstPortfolio) return;

        const holdings = await getHoldings(firstPortfolio.id);
        if (holdings.length === 0) return;

        const stats = await calculatePortfolioStats(firstPortfolio, holdings);
        if (alive) {
          setPortfolio(stats);
        }
      } catch {
        if (alive) {
          setPortfolio(null);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      alive = false;
    };
  }, []);

  const symbols = useMemo(
    () => portfolio?.holdings.map((holding) => holding.symbol) ?? [],
    [portfolio],
  );
  const { quotes } = useQuotes(symbols, 60_000);

  const dashboardData = useMemo(() => {
    if (!portfolio) return null;

    const holdings = portfolio.holdings
      .map((holding) => {
        const quote = quotes.get(holding.symbol);
        const price = quote?.price ?? holding.currentPrice;
        const previousClose = quote?.previousClose ?? price;
        const currentValue = holding.shares * price;
        const previousValue = holding.shares * previousClose;
        const change = quote ? holding.shares * quote.change : 0;

        return {
          ...holding,
          currentValue,
          previousValue,
          todayChange: change,
          changePercent: quote?.changePercent ?? 0,
        };
      })
      .filter((holding) => holding.currentValue > 0);

    const totalValue = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
    const totalPreviousValue = holdings.reduce((sum, holding) => sum + holding.previousValue, 0);
    const todayReturn = holdings.reduce((sum, holding) => sum + holding.todayChange, 0);
    const todayReturnPercent =
      totalPreviousValue > 0 ? (todayReturn / totalPreviousValue) * 100 : 0;
    const treemapItems: TreemapItem[] = holdings.map((holding) => ({
      symbol: holding.symbol,
      name: holding.name,
      weight: totalValue > 0 ? holding.currentValue / totalValue : 0,
      changePercent: holding.changePercent,
      sector: getSector(holding.symbol),
    }));

    return {
      todayReturn,
      todayReturnPercent,
      treemapItems,
    };
  }, [portfolio, quotes]);

  if (loading || !portfolio || !dashboardData) return null;

  const month = new Date().getMonth() + 1;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-subtle">
      <div className="grid gap-5 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
              <span className="text-secondary">내 포트폴리오</span>
              <span className="text-secondary">·</span>
              <Link href="/portfolio" className="truncate text-primary hover:text-brand">
                {portfolio.name}
              </Link>
            </div>
            <Link
              href="/portfolio"
              className={`mt-2 inline-flex items-baseline gap-2 text-4xl font-black tracking-normal ${
                dashboardData.todayReturnPercent >= 0 ? "text-[#F04452]" : "text-[#3182F6]"
              }`}
            >
              {formatPercent(dashboardData.todayReturnPercent)}
              <span className="text-base font-bold text-secondary">&gt;</span>
            </Link>
            <p className="mt-1 text-sm font-semibold text-secondary">
              총 수익 {formatPercent(portfolio.totalReturnPercent)}
            </p>
          </div>
          <AssetLogo symbol={portfolio.holdings[0]?.symbol ?? "FIRE"} size="md" />
        </div>

        <Treemap items={dashboardData.treemapItems} />
      </div>

      <Link
        href="/portfolio"
        className="flex items-center justify-between gap-4 border-t border-border px-5 py-3 transition hover:bg-card-subtle sm:px-6"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-bold text-primary">
            {month}월 예상 배당금
          </span>
          <span className="shrink-0 rounded bg-card-subtle px-1.5 py-0.5 text-xs font-semibold text-secondary">
            세금 0% 적용
          </span>
        </span>
        <span className="shrink-0 text-base font-black text-primary">
          ₩{Math.round(portfolio.monthlyDividend).toLocaleString("ko-KR")} &gt;
        </span>
      </Link>
    </section>
  );
}

export default PortfolioDashboard;
