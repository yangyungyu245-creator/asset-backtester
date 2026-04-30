import type { TickerMeta } from "@/lib/data/tickerIndex";
import type {
  ContributionPeriod,
  SelectedTicker,
} from "@/store/useSimulationStore";

export function isTickerAvailable(ticker: TickerMeta, startDate: string): boolean {
  return startDate >= ticker.ipo_date;
}

export function getTickerInceptionDate(ticker: TickerMeta): string {
  return ticker.ipo_date;
}

export function isWeightSumValid(tickers: SelectedTicker[]): boolean {
  const sum = tickers.reduce((total, ticker) => total + ticker.weight, 0);
  return Math.abs(sum - 100) <= 0.01;
}

function toMonthNumber(yearMonth: string) {
  const [year, month] = yearMonth.split("-").map(Number);
  return year * 12 + month;
}

export function validateContributionPeriods(
  periods: ContributionPeriod[],
  simulationStartYearMonth?: string,
  simulationEndYearMonth?: string,
): { valid: boolean; error?: string } {
  if (periods.length === 0) {
    return { valid: false, error: "적립 구간을 1개 이상 입력하세요." };
  }

  const sorted = [...periods].sort((a, b) =>
    a.startYearMonth.localeCompare(b.startYearMonth),
  );

  if (
    simulationStartYearMonth &&
    sorted[0].startYearMonth !== simulationStartYearMonth
  ) {
    return { valid: false, error: "첫 구간은 시뮬레이션 시작월부터 시작해야 합니다." };
  }

  if (
    simulationEndYearMonth &&
    sorted[sorted.length - 1].endYearMonth !== simulationEndYearMonth
  ) {
    return { valid: false, error: "마지막 구간은 시뮬레이션 종료월까지 포함해야 합니다." };
  }

  for (let index = 0; index < sorted.length; index += 1) {
    const period = sorted[index];
    const start = toMonthNumber(period.startYearMonth);
    const end = toMonthNumber(period.endYearMonth);

    if (start > end) {
      return { valid: false, error: "구간 시작월은 종료월보다 늦을 수 없습니다." };
    }

    if (period.monthlyAmount < 0) {
      return { valid: false, error: "월 적립액은 0원 이상이어야 합니다." };
    }

    const next = sorted[index + 1];
    if (next) {
      const nextStart = toMonthNumber(next.startYearMonth);
      if (nextStart <= end) {
        return { valid: false, error: "적립 구간이 서로 겹칩니다." };
      }
      if (nextStart !== end + 1) {
        return { valid: false, error: "적립 구간 사이에 비어 있는 월이 있습니다." };
      }
    }
  }

  return { valid: true };
}
