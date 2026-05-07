export const sectorMap: Record<string, string> = {
  AAPL: "IT",
  MSFT: "IT",
  GOOGL: "IT",
  GOOG: "IT",
  META: "IT",
  AMZN: "IT",
  CRM: "IT",
  ADBE: "IT",
  ORCL: "IT",
  PLTR: "IT",
  COIN: "IT",

  NVDA: "첨단기술",
  AMD: "첨단기술",
  TSLA: "첨단기술",
  AVGO: "첨단기술",
  QCOM: "첨단기술",
  INTC: "첨단기술",
  MU: "첨단기술",
  ARM: "첨단기술",
  ASML: "첨단기술",
  SMCI: "첨단기술",

  JPM: "금융",
  BAC: "금융",
  GS: "금융",
  V: "금융",
  MA: "금융",
  PYPL: "금융",
  BLK: "금융",

  SPY: "ETF",
  VOO: "ETF",
  QQQ: "ETF",
  VTI: "ETF",
  SCHD: "ETF",
  ARKK: "ETF",
  MAGS: "ETF",
  BND: "채권",
  TLT: "채권",
  AGG: "채권",

  "005930.KS": "IT",
  "000660.KS": "첨단기술",
  "005380.KS": "자동차",
  "035420.KS": "IT",
};

export function getSector(symbol: string): string {
  return sectorMap[symbol.toUpperCase()] ?? "기타";
}
