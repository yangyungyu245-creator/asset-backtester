const integerFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 0,
});

export const krwFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

export const percentFormatter = new Intl.NumberFormat("ko-KR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatKRW(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const absolute = Math.abs(Math.round(amount));

  if (absolute >= 100_000_000) {
    return `${sign}${(absolute / 100_000_000).toFixed(2)}억`;
  }

  if (absolute >= 10_000) {
    return `${sign}${integerFormatter.format(Math.floor(absolute / 10_000))}만`;
  }

  return `${sign}${integerFormatter.format(absolute)}원`;
}

export function formatInputNumber(value: number): string {
  return integerFormatter.format(value);
}

export function parseFormattedNumber(value: string): number {
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatPercent(value: number, digits = 2): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}
