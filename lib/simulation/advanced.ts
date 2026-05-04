import { loadFxData, type FxData } from "@/lib/data/fxLoader";
import { findNextTradingDay, lookupValue } from "@/lib/data/lookup";
import { loadMultipleTickers } from "@/lib/data/priceLoader";
import type {
  AdvancedSimulationInput,
  PortfolioItem,
  PortfolioSnapshot,
  SimulationResult,
  TickerData,
} from "@/lib/simulation/types";

type SupportedFxCurrency = "USD" | "JPY" | "EUR";
type Holdings = Map<string, number>;

const INFLATION_RATE = 0.02;
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

const supportedFxCurrencies = new Set<string>(["USD", "JPY", "EUR"]);

function isSupportedFxCurrency(currency: string): currency is SupportedFxCurrency {
  return supportedFxCurrencies.has(currency);
}

function addMonths(yearMonth: string, months: number) {
  const [year, month] = yearMonth.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, 1));
  return `${date.getUTCFullYear()}-${`${date.getUTCMonth() + 1}`.padStart(2, "0")}`;
}

function monthStart(yearMonth: string) {
  return `${yearMonth}-01`;
}

function monthEnd(yearMonth: string) {
  const nextMonth = addMonths(yearMonth, 1);
  const [year, month] = nextMonth.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 0));
  return date.toISOString().slice(0, 10);
}

function dateToYearMonth(date: string) {
  return date.slice(0, 7);
}

function dateToYear(date: string) {
  return Number(date.slice(0, 4));
}

function daysBetween(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  return Math.max(1, (end - start) / 86_400_000);
}

function getContributionForMonth(
  yearMonth: string,
  schedule: AdvancedSimulationInput["contributionSchedule"],
) {
  const period = schedule.find(
    (item) => item.startYearMonth <= yearMonth && yearMonth <= item.endYearMonth,
  );
  return period?.monthlyAmount ?? 0;
}

function isRebalanceMonth(
  yearMonth: string,
  rebalance: AdvancedSimulationInput["options"]["rebalance"],
) {
  if (rebalance === "none") {
    return false;
  }

  if (rebalance === "monthly") {
    return true;
  }

  const month = Number(yearMonth.slice(5, 7));

  if (rebalance === "quarterly") {
    return month % 3 === 0;
  }

  return month === 12;
}

function getFxRate(
  currency: string,
  date: string,
  fxMap: Map<SupportedFxCurrency, FxData>,
  warnings: string[],
) {
  if (currency === "KRW") {
    return 1;
  }

  if (!isSupportedFxCurrency(currency)) {
    warnings.push(`${currency} FX is not supported. KRW conversion was skipped.`);
    return 1;
  }

  const fx = fxMap.get(currency);
  if (!fx) {
    warnings.push(`${currency} FX data was not loaded. KRW conversion was skipped.`);
    return 1;
  }

  const rate = lookupValue(fx.rates, date);
  if (rate !== null) {
    return rate;
  }

  const fallback = fx.rates[0]?.[1] ?? 1;
  warnings.push(
    `${currency} FX data starts at ${fx.data_start}. First available rate was used for ${date}.`,
  );
  return fallback;
}

function normalizePortfolio(portfolio: PortfolioItem[]) {
  const weightSum = portfolio.reduce((sum, item) => sum + item.weight, 0);
  if (weightSum === 0) {
    return portfolio;
  }

  return portfolio.map((item) => ({
    ...item,
    weight: item.weight / weightSum,
  }));
}

function valueHolding(
  ticker: string,
  shares: number,
  date: string,
  tickerMap: Map<string, TickerData>,
  fxMap: Map<SupportedFxCurrency, FxData>,
  warnings: string[],
  dataIssues: SimulationResult["dataIssues"],
) {
  const tickerData = tickerMap.get(ticker);
  if (!tickerData) {
    dataIssues.push({ ticker, issue: "Ticker data was not loaded for valuation." });
    return null;
  }

  const price = lookupValue(tickerData.prices, date);
  if (price === null || price <= 0) {
    dataIssues.push({ ticker, issue: `No valuation price found on or before ${date}.` });
    return null;
  }

  const fxRate = getFxRate(tickerData.currency, date, fxMap, warnings);
  const localValue = shares * price;

  return {
    tickerData,
    price,
    fxRate,
    value: tickerData.currency === "KRW" ? localValue : localValue * fxRate,
  };
}

function buyPortfolio(
  amountKrw: number,
  targetDate: string,
  portfolio: ReturnType<typeof normalizePortfolio>,
  tickerMap: Map<string, TickerData>,
  fxMap: Map<SupportedFxCurrency, FxData>,
  holdings: Holdings,
  warnings: string[],
  dataIssues: SimulationResult["dataIssues"],
  endDate: string,
) {
  if (amountKrw <= 0) {
    return 0;
  }

  let invested = 0;

  for (const item of portfolio) {
    const tickerData = tickerMap.get(item.ticker);
    if (!tickerData) {
      dataIssues.push({ ticker: item.ticker, issue: "Ticker data was not loaded." });
      continue;
    }

    const tradeDate = findNextTradingDay(tickerData.prices, targetDate);
    if (!tradeDate || tradeDate > endDate) {
      dataIssues.push({
        ticker: item.ticker,
        issue: `No trading day found on or after ${targetDate}.`,
      });
      continue;
    }

    const price = lookupValue(tickerData.prices, tradeDate);
    if (!price || price <= 0) {
      dataIssues.push({
        ticker: item.ticker,
        issue: `No valid price found for buy date ${tradeDate}.`,
      });
      continue;
    }

    const allocationKrw = amountKrw * item.weight;
    const fxRate = getFxRate(tickerData.currency, tradeDate, fxMap, warnings);
    const tradeAmount = tickerData.currency === "KRW" ? allocationKrw : allocationKrw / fxRate;
    const shares = tradeAmount / price;

    holdings.set(item.ticker, (holdings.get(item.ticker) ?? 0) + shares);
    invested += allocationKrw;
  }

  return invested;
}

function evaluateHoldings(
  date: string,
  holdings: Holdings,
  tickerMap: Map<string, TickerData>,
  fxMap: Map<SupportedFxCurrency, FxData>,
  warnings: string[],
  dataIssues: SimulationResult["dataIssues"],
) {
  let value = 0;

  for (const [ticker, shares] of Array.from(holdings.entries())) {
    const holdingValue = valueHolding(
      ticker,
      shares,
      date,
      tickerMap,
      fxMap,
      warnings,
      dataIssues,
    );

    value += holdingValue?.value ?? 0;
  }

  return value;
}

function createPortfolioSnapshot(
  date: string,
  holdings: Holdings,
  tickerMap: Map<string, TickerData>,
  fxMap: Map<SupportedFxCurrency, FxData>,
  warnings: string[],
  dataIssues: SimulationResult["dataIssues"],
): PortfolioSnapshot[] {
  const rows = Array.from(holdings.entries()).flatMap(([ticker, shares]) => {
    const holdingValue = valueHolding(
      ticker,
      shares,
      date,
      tickerMap,
      fxMap,
      warnings,
      dataIssues,
    );

    if (!holdingValue) {
      return [];
    }

    return [
      {
        ticker,
        name: holdingValue.tickerData.name,
        name_ko: holdingValue.tickerData.name_ko,
        shares,
        value: holdingValue.value,
        weight: 0,
      },
    ];
  });
  const totalValue = rows.reduce((sum, row) => sum + row.value, 0);

  return rows
    .map((row) => ({
      ...row,
      weight: totalValue > 0 ? (row.value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

function rebalanceHoldings(
  date: string,
  portfolio: ReturnType<typeof normalizePortfolio>,
  holdings: Holdings,
  tickerMap: Map<string, TickerData>,
  fxMap: Map<SupportedFxCurrency, FxData>,
  warnings: string[],
  dataIssues: SimulationResult["dataIssues"],
) {
  const totalValue = evaluateHoldings(
    date,
    holdings,
    tickerMap,
    fxMap,
    warnings,
    dataIssues,
  );

  if (totalValue <= 0) {
    return;
  }

  for (const item of portfolio) {
    const tickerData = tickerMap.get(item.ticker);
    if (!tickerData) {
      dataIssues.push({ ticker: item.ticker, issue: "Ticker data was not loaded." });
      continue;
    }

    const price = lookupValue(tickerData.prices, date);
    if (price === null || price <= 0) {
      dataIssues.push({
        ticker: item.ticker,
        issue: `No valid price found for rebalance date ${date}.`,
      });
      continue;
    }

    const fxRate = getFxRate(tickerData.currency, date, fxMap, warnings);
    const targetValueKrw = totalValue * item.weight;
    const targetValueLocal =
      tickerData.currency === "KRW" ? targetValueKrw : targetValueKrw / fxRate;

    holdings.set(item.ticker, targetValueLocal / price);
  }
}

function createYearlyBreakdown(
  input: AdvancedSimulationInput,
  timeSeries: SimulationResult["timeSeries"],
) {
  const yearlyBreakdown: SimulationResult["yearlyBreakdown"] = [];
  const startYear = dateToYear(input.startDate);
  const endYear = dateToYear(input.endDate);

  for (let year = startYear; year <= endYear; year += 1) {
    const points = timeSeries.filter((point) => dateToYear(point.date) === year);
    if (points.length === 0) {
      continue;
    }

    const first = points[0];
    const last = points[points.length - 1];
    const previous = timeSeries[timeSeries.indexOf(first) - 1];
    const startValue = previous?.value ?? first.value;
    const startContributions = previous?.contributions ?? input.initialAmount;
    const contributionsThisYear = Math.max(0, last.contributions - startContributions);
    const denominator = startValue === 0 ? Math.max(1, contributionsThisYear) : startValue;
    const yearReturn =
      ((last.value - startValue - contributionsThisYear) / denominator) * 100;
    const cumReturn =
      last.contributions === 0
        ? 0
        : ((last.value - last.contributions) / last.contributions) * 100;

    yearlyBreakdown.push({
      year,
      startValue,
      contributionsThisYear,
      endValue: last.value,
      yearReturn,
      cumReturn,
    });
  }

  return yearlyBreakdown;
}

function calculateMaxDrawdown(timeSeries: SimulationResult["timeSeries"]) {
  const first = timeSeries[0];

  if (!first) {
    return {
      percent: 0,
      peakDate: "",
      troughDate: "",
      peakValue: 0,
      troughValue: 0,
    };
  }

  let peakValue = first.value;
  let peakDate = first.date;
  let maxDrawdown = 0;
  let resultPeakDate = first.date;
  let resultTroughDate = first.date;
  let resultPeakValue = first.value;
  let resultTroughValue = first.value;

  for (const point of timeSeries) {
    if (point.value > peakValue) {
      peakValue = point.value;
      peakDate = point.date;
    }

    const drawdown = peakValue > 0 ? (point.value - peakValue) / peakValue : 0;

    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
      resultPeakDate = peakDate;
      resultTroughDate = point.date;
      resultPeakValue = peakValue;
      resultTroughValue = point.value;
    }
  }

  return {
    percent: maxDrawdown * 100,
    peakDate: resultPeakDate,
    troughDate: resultTroughDate,
    peakValue: resultPeakValue,
    troughValue: resultTroughValue,
  };
}

function yearsFromStart(startDate: string, targetDate: string) {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const target = new Date(`${targetDate}T00:00:00Z`).getTime();
  return Math.max(0, (target - start) / MS_PER_YEAR);
}

function deflateAmount(amount: number, startDate: string, targetDate: string) {
  const deflator = Math.pow(1 + INFLATION_RATE, yearsFromStart(startDate, targetDate));
  return amount / deflator;
}

function applyInflationAdjustment(
  input: AdvancedSimulationInput,
  result: Omit<SimulationResult, "warnings" | "dataIssues">,
) {
  const timeSeries = result.timeSeries.map((point) => ({
    ...point,
    value: deflateAmount(point.value, input.startDate, point.date),
    contributions: deflateAmount(point.contributions, input.startDate, point.date),
  }));
  const finalValue = deflateAmount(result.finalValue, input.startDate, input.endDate);
  const totalContributions = deflateAmount(
    result.totalContributions,
    input.startDate,
    input.endDate,
  );
  const totalReturn = finalValue - totalContributions;

  return {
    ...result,
    finalValue,
    totalContributions,
    totalReturn,
    timeSeries,
    yearlyBreakdown: createYearlyBreakdown(input, timeSeries),
    maxDrawdown: calculateMaxDrawdown(timeSeries),
  };
}

export async function simulateAdvanced(
  input: AdvancedSimulationInput,
): Promise<SimulationResult> {
  const warnings: string[] = [];
  const dataIssues: SimulationResult["dataIssues"] = [];

  if (input.startDate > input.endDate) {
    throw new Error("Start date must be before end date.");
  }

  if (!input.options.reinvestDividends) {
    warnings.push(
      "Dividend reinvestment is always applied in this version because adj_close prices are used.",
    );
  }

  const portfolio = normalizePortfolio(input.portfolio);
  const tickerMap = await loadMultipleTickers(portfolio.map((item) => item.ticker));
  const currencies = Array.from(tickerMap.values()).map((ticker) => ticker.currency);
  const neededFx = Array.from(
    new Set(
      input.options.applyExchangeRate
        ? currencies.filter(isSupportedFxCurrency)
        : [],
    ),
  );
  const fxEntries = await Promise.all(
    neededFx.map(async (currency) => [currency, await loadFxData(currency)] as const),
  );
  const fxMap = input.options.applyExchangeRate
    ? new Map<SupportedFxCurrency, FxData>(fxEntries)
    : new Map<SupportedFxCurrency, FxData>();

  if (!input.options.applyExchangeRate && currencies.some((currency) => currency !== "KRW")) {
    warnings.push("Exchange-rate conversion is disabled. Foreign prices were treated as KRW.");
  }

  const holdings: Holdings = new Map();
  const timeSeries: SimulationResult["timeSeries"] = [];
  let totalContributions = 0;

  totalContributions += buyPortfolio(
    input.initialAmount,
    input.startDate,
    portfolio,
    tickerMap,
    fxMap,
    holdings,
    warnings,
    dataIssues,
    input.endDate,
  );
  const initialPortfolio = createPortfolioSnapshot(
    input.startDate,
    holdings,
    tickerMap,
    fxMap,
    warnings,
    dataIssues,
  );

  let yearMonth = dateToYearMonth(input.startDate);
  const endYearMonth = dateToYearMonth(input.endDate);

  while (yearMonth <= endYearMonth) {
    const contribution = getContributionForMonth(yearMonth, input.contributionSchedule);
    const targetDate =
      yearMonth === dateToYearMonth(input.startDate)
        ? input.startDate
        : monthStart(yearMonth);

    const invested = buyPortfolio(
      contribution,
      targetDate,
      portfolio,
      tickerMap,
      fxMap,
      holdings,
      warnings,
      dataIssues,
      input.endDate,
    );

    totalContributions += invested;

    const valuationDate = yearMonth === endYearMonth ? input.endDate : monthEnd(yearMonth);

    if (isRebalanceMonth(yearMonth, input.options.rebalance)) {
      rebalanceHoldings(
        valuationDate,
        portfolio,
        holdings,
        tickerMap,
        fxMap,
        warnings,
        dataIssues,
      );
    }

    timeSeries.push({
      date: valuationDate,
      value: evaluateHoldings(
        valuationDate,
        holdings,
        tickerMap,
        fxMap,
        warnings,
        dataIssues,
      ),
      contributions: totalContributions,
    });

    yearMonth = addMonths(yearMonth, 1);
  }

  const finalValue =
    timeSeries[timeSeries.length - 1]?.value ??
    evaluateHoldings(input.endDate, holdings, tickerMap, fxMap, warnings, dataIssues);
  const totalReturn = finalValue - totalContributions;
  const years = daysBetween(input.startDate, input.endDate) / 365.25;
  const cagr =
    totalContributions > 0 && finalValue > 0
      ? Math.pow(finalValue / totalContributions, 1 / years) - 1
      : 0;
  const yearlyBreakdown = createYearlyBreakdown(input, timeSeries);
  const maxDrawdown = calculateMaxDrawdown(timeSeries);
  const finalPortfolio = createPortfolioSnapshot(
    input.endDate,
    holdings,
    tickerMap,
    fxMap,
    warnings,
    dataIssues,
  );

  const result = {
    finalValue,
    totalContributions,
    totalReturn,
    cagr,
    maxDrawdown,
    timeSeries,
    yearlyBreakdown,
    initialPortfolio,
    finalPortfolio,
  };
  const adjustedResult = input.options.inflationAdjusted
    ? applyInflationAdjustment(input, result)
    : result;

  return {
    ...adjustedResult,
    warnings: Array.from(new Set(warnings)),
    dataIssues,
  };
}
