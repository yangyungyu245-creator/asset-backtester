import { getTickerName } from "@/lib/data/tickerUtils";
import type {
  HoldingWithStats,
  Portfolio,
  PortfolioHolding,
  PortfolioWithStats,
} from "@/lib/types/portfolio";

type AssetQuote = {
  regularMarketPrice: number;
  trailingAnnualDividendRate: number;
  dividendYield: number;
};

type AssetApiResponse = {
  latestPrice?: number | null;
  fields?: {
    dividendRate?: number | null;
    dividendYield?: number | null;
  };
};

async function fetchQuotes(symbols: string[]): Promise<Record<string, AssetQuote>> {
  const uniqueSymbols = Array.from(new Set(symbols.map((symbol) => symbol.toUpperCase())));
  const results: Record<string, AssetQuote> = {};

  await Promise.allSettled(
    uniqueSymbols.map(async (symbol) => {
      const response = await fetch(`/api/asset/${encodeURIComponent(symbol)}?period=1m`, {
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = (await response.json()) as AssetApiResponse;
      const price = Number(data.latestPrice) || 0;
      const dividendYield = Number(data.fields?.dividendYield) || 0;
      const dividendRate =
        Number(data.fields?.dividendRate) || (price > 0 ? price * (dividendYield / 100) : 0);

      results[symbol] = {
        regularMarketPrice: price,
        trailingAnnualDividendRate: dividendRate,
        dividendYield,
      };
    }),
  );

  return results;
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
    const currentPrice = quote?.regularMarketPrice ?? 0;
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
      dividendYield: quote?.dividendYield ?? 0,
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
