import type { TickerData } from "@/lib/simulation/types";

export type AssetKind = "stock" | "etf" | "index" | "fx" | "crypto" | "other";

export const assetDisplayNameMap: Record<string, string> = {
  "^GSPC": "S&P 500",
  "^IXIC": "나스닥 종합",
  "^KS11": "코스피",
  "^KQ11": "코스닥",
  "^VIX": "VIX",
  "KRW=X": "USD/KRW",
};

export const assetDescriptionMap: Record<string, string> = {
  "^GSPC": "미국 대형주 500개 기업으로 구성된 대표 주가지수입니다.",
  "^IXIC": "나스닥 시장에 상장된 주요 기술주 중심의 종합 지수입니다.",
  "^KS11": "한국 유가증권시장 전체 흐름을 보여주는 대표 지수입니다.",
  "^KQ11": "한국 코스닥 시장의 흐름을 보여주는 대표 지수입니다.",
  "^VIX": "미국 주식시장의 기대 변동성을 나타내는 지수입니다.",
  "KRW=X": "미국 달러 대비 원화 환율입니다.",
};

export function getAssetKind(
  symbol: string,
  category?: TickerData["category"],
  quoteType?: string,
): AssetKind {
  if (symbol.includes("=X")) {
    return "fx";
  }

  if (symbol.startsWith("^")) {
    return "index";
  }

  if (category?.includes("etf") || quoteType === "ETF") {
    return "etf";
  }

  if (category === "crypto") {
    return "crypto";
  }

  if (category?.includes("stock") || quoteType === "EQUITY") {
    return "stock";
  }

  return "other";
}

export function getAssetKindLabel(kind: AssetKind) {
  const labels: Record<AssetKind, string> = {
    stock: "주식",
    etf: "ETF",
    index: "지수",
    fx: "환율",
    crypto: "가상자산",
    other: "자산",
  };

  return labels[kind];
}

export function getAssetDisplayName({
  symbol,
  localNameKo,
  localName,
  quoteLongName,
  quoteShortName,
}: {
  symbol: string;
  localNameKo?: string;
  localName?: string;
  quoteLongName?: string;
  quoteShortName?: string;
}) {
  return (
    assetDisplayNameMap[symbol] ??
    localNameKo ??
    quoteLongName ??
    quoteShortName ??
    localName ??
    symbol
  );
}
