import { getTickerName } from "@/lib/data/tickerUtils";
import type {
  HoldingWithStats,
  Portfolio,
  PortfolioHolding,
  PortfolioWithStats,
} from "@/lib/types/portfolio";
import type { AssetMeta } from "@/lib/types/quotes";

async function fetchQuotes(symbols: string[]): Promise<Record<string, AssetMeta>> {
  const uniqueSymbols = Array.from(new Set(symbols.map((symbol) => symbol.toUpperCase())));
  if (uniqueSymbols.length === 0) return {};

  const response = await fetch(`/api/quotes?symbols=${encodeURIComponent(uniqueSymbols.join(","))}`, {
    cache: "no-store",
  });

  if (!response.ok) return {};

  const data = (await response.json()) as { quotes?: AssetMeta[] };

  return (data.quotes ?? []).reduce<Record<string, AssetMeta>>((acc, quote) => {
    acc[quote.symbol.toUpperCase()] = quote;
    return acc;
  }, {});
}

export async function calculatePortfolioStats(
  portfolio: Portfolio,
  holdings: PortfolioHolding[],
): Promise<PortfolioWithStats> {
  const quotes = await fetchQuotes(holdings.map((holding) => holding.symbol));

  const holdingsWithStats: HoldingWithStats[] = holdings.map((holding) => {
    const symbol = holding.symbol.toUpperCase();
    const quote = quotes[symbol];
    const shares = Number(holding.shares) || 0;
    const avgPrice = Number(holding.avg_price) || 0;
    const currentPrice = quote?.price ?? 0;
    const currentValue = shares * currentPrice;
    const cost = shares * avgPrice;
    const annualDividendPerShare = quote?.trailingAnnualDividendRate ?? 0;
    const annualDividend = shares * annualDividendPerShare;

    return {
      ...holding,
      symbol,
      shares,
      avg_price: avgPrice,
      name: getTickerName(symbol),
      currentPrice,
      currentValue,
      returnAmount: currentValue - cost,
      returnPercent: cost > 0 ? ((currentValue - cost) / cost) * 100 : 0,
      dividendYield: quote?.trailingAnnualDividendYield ?? 0,
      annualDividendPerShare,
      annualDividend,
    };
  });

  const totalValue = holdingsWithStats.reduce(
    (sum, holding) => sum + holding.currentValue,
    0,
  );
  const totalCost = holdingsWithStats.reduce(
    (sum, holding) => sum + holding.shares * holding.avg_price,
    0,
  );
  const annualDividend = holdingsWithStats.reduce(
    (sum, holding) => sum + holding.annualDividend,
    0,
  );

  return {
    ...portfolio,
    holdings: holdingsWithStats,
    totalValue,
    totalCost,
    totalReturn: totalValue - totalCost,
    totalReturnPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
    monthlyDividend: annualDividend / 12,
    annualDividend,
  };
}
