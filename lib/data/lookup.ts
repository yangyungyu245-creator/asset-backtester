export function lookupValue(
  series: [string, number][],
  targetDate: string,
): number | null {
  let lo = 0;
  let hi = series.length - 1;
  let result = -1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (series[mid][0] <= targetDate) {
      result = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return result === -1 ? null : series[result][1];
}

export function findNextTradingDay(
  series: [string, number][],
  targetDate: string,
): string | null {
  let lo = 0;
  let hi = series.length - 1;
  let result = -1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (series[mid][0] >= targetDate) {
      result = mid;
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }

  return result === -1 ? null : series[result][0];
}
