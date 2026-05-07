"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { hierarchy, treemap, treemapSquarify, type HierarchyRectangularNode } from "d3-hierarchy";
import { getSector } from "@/lib/data/sectors";
import { getHoldings, getPortfolios } from "@/lib/portfolio/actions";
import { calculatePortfolioStats } from "@/lib/portfolio/stats";
import type { PortfolioWithStats } from "@/lib/types/portfolio";
import { useQuotes } from "@/hooks/useQuotes";

type TreemapItem = {
  symbol: string;
  name: string;
  value: number;
  changePercent: number;
  sector: string;
  displayValue: string;
};

type TreemapGroup = {
  name: string;
  children: TreemapItem[];
};

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatMoney(value: number) {
  return `₩${Math.round(value).toLocaleString("ko-KR")}`;
}

function getHeatColor(changePercent: number) {
  if (Math.abs(changePercent) < 0.01) return "rgba(107, 118, 132, 0.3)";

  const alpha = Math.min(0.9, 0.3 + Math.abs(changePercent) * 0.06);
  const rgb = changePercent >= 0 ? "220, 38, 38" : "34, 197, 94";
  return `rgba(${rgb}, ${alpha})`;
}

function useElementSize() {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, [element]);

  return { ref: setElement, width };
}

function calculateTreemapLayout(items: TreemapItem[], width: number, height: number) {
  const grouped = items.reduce<Record<string, TreemapItem[]>>((acc, item) => {
    acc[item.sector] = acc[item.sector] ?? [];
    acc[item.sector].push(item);
    return acc;
  }, {});

  const root = hierarchy<{ children: TreemapGroup[] } | TreemapGroup | TreemapItem>({
    children: Object.entries(grouped).map(([sector, children]) => ({
      name: sector,
      children,
    })),
  })
    .sum((node) => ("value" in node ? node.value : 0))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  const layout = treemap<typeof root.data>()
    .size([width, height])
    .tile(treemapSquarify.ratio(1.2))
    .paddingOuter(2)
    .paddingInner(2)
    .paddingTop(18);

  return layout(root);
}

function PortfolioTreemap({ items }: { items: TreemapItem[] }) {
  const { ref, width } = useElementSize();
  const height = width > 0 ? Math.max(240, Math.min(420, width * 0.52)) : 280;
  const root = useMemo(
    () => (width > 0 ? calculateTreemapLayout(items, width, height) : null),
    [height, items, width],
  );

  if (items.length === 0) {
    return (
      <div className="flex min-h-[180px] items-center justify-center rounded-lg bg-card-subtle px-4 text-sm text-secondary">
        가격 정보를 불러오는 중입니다.
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden rounded-xl bg-card-subtle"
      style={{ height }}
    >
      {root?.children?.map((sector) => (
        <div
          key={(sector.data as TreemapGroup).name}
          className="absolute overflow-hidden rounded-[3px] bg-black/10"
          style={{
            left: sector.x0,
            top: sector.y0,
            width: sector.x1 - sector.x0,
            height: sector.y1 - sector.y0,
          }}
        >
          <div className="h-[18px] truncate px-1.5 py-0.5 text-[10px] font-semibold text-white/55">
            {(sector.data as TreemapGroup).name}
          </div>

          {sector.children?.map((leaf) => {
            const data = leaf.data as TreemapItem;
            const cellWidth = leaf.x1 - leaf.x0;
            const cellHeight = leaf.y1 - leaf.y0;
            const showPercent = cellHeight > 38;
            const showValue = cellWidth > 82 && cellHeight > 56;

            return (
              <TreemapCell
                key={data.symbol}
                leaf={leaf}
                sector={sector}
                showPercent={showPercent}
                showValue={showValue}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function TreemapCell({
  leaf,
  sector,
  showPercent,
  showValue,
}: {
  leaf: HierarchyRectangularNode<{ children: TreemapGroup[] } | TreemapGroup | TreemapItem>;
  sector: HierarchyRectangularNode<{ children: TreemapGroup[] } | TreemapGroup | TreemapItem>;
  showPercent: boolean;
  showValue: boolean;
}) {
  const data = leaf.data as TreemapItem;

  return (
    <Link
      href={`/asset/${encodeURIComponent(data.symbol)}`}
      className="absolute flex min-w-0 flex-col justify-end overflow-hidden rounded-[3px] p-1.5 text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white/45"
      style={{
        left: leaf.x0 - sector.x0,
        top: leaf.y0 - sector.y0,
        width: leaf.x1 - leaf.x0,
        height: leaf.y1 - leaf.y0,
        backgroundColor: getHeatColor(data.changePercent),
      }}
    >
      <span className="truncate text-sm font-black leading-tight">{data.symbol}</span>
      {showPercent && (
        <span className="mt-0.5 truncate text-xs font-bold text-white/90">
          {formatPercent(data.changePercent)}
        </span>
      )}
      {showValue && (
        <span className="mt-0.5 truncate text-[10px] font-semibold text-white/75">
          {data.displayValue}
        </span>
      )}
    </Link>
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
    () => (portfolio ? [...portfolio.holdings.map((holding) => holding.symbol), "KRW=X"] : []),
    [portfolio],
  );
  const { quotes } = useQuotes(symbols, 60_000);

  const dashboardData = useMemo(() => {
    if (!portfolio) return null;
    const krwPerUsd = quotes.get("KRW=X")?.price || 1380;

    const holdings = portfolio.holdings
      .map((holding) => {
        const quote = quotes.get(holding.symbol);
        const price = quote?.price ?? holding.currentPrice;
        const previousClose = quote?.previousClose ?? price;
        const currentValue = holding.shares * price;
        const previousValue = holding.shares * previousClose;
        const change = quote ? holding.shares * quote.change : 0;
        const multiplier = holding.currency === "KRW" || quote?.currency === "KRW" ? 1 : krwPerUsd;
        const currentValueKrw = currentValue * multiplier;
        const previousValueKrw = previousValue * multiplier;
        const todayChangeKrw = change * multiplier;

        return {
          ...holding,
          currentValue,
          currentValueKrw,
          previousValueKrw,
          todayChangeKrw,
          changePercent: quote?.changePercent ?? 0,
        };
      })
      .filter((holding) => holding.currentValueKrw > 0);

    const totalValueKrw = holdings.reduce((sum, holding) => sum + holding.currentValueKrw, 0);
    const totalPreviousValueKrw = holdings.reduce((sum, holding) => sum + holding.previousValueKrw, 0);
    const todayReturnKrw = holdings.reduce((sum, holding) => sum + holding.todayChangeKrw, 0);
    const todayReturnPercent =
      totalPreviousValueKrw > 0 ? (todayReturnKrw / totalPreviousValueKrw) * 100 : 0;
    const treemapItems: TreemapItem[] = holdings.map((holding) => ({
      symbol: holding.symbol,
      name: holding.name,
      value: holding.currentValueKrw,
      changePercent: holding.changePercent,
      sector: getSector(holding.symbol),
      displayValue: formatMoney(holding.currentValueKrw),
    }));

    return {
      totalValueKrw,
      todayReturnKrw,
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
              {formatMoney(dashboardData.totalValueKrw)}
              <span className="text-base font-bold text-secondary">&gt;</span>
            </Link>
            <p className="mt-1 text-sm font-semibold text-secondary">
              일간 수익 {dashboardData.todayReturnKrw >= 0 ? "+" : ""}
              {formatMoney(dashboardData.todayReturnKrw)} ({formatPercent(dashboardData.todayReturnPercent)})
            </p>
          </div>
        </div>

        <PortfolioTreemap items={dashboardData.treemapItems} />
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
