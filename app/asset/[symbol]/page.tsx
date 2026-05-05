import type { Metadata } from "next";
import { AssetDetailView } from "@/components/asset/AssetDetailContent";

type AssetPageProps = {
  params: { symbol: string };
};

export function generateMetadata({ params }: AssetPageProps): Metadata {
  const symbol = decodeURIComponent(params.symbol);

  return {
    title: `${symbol} 자산 상세`,
    description: `${symbol} 가격 차트와 기본 정보를 확인합니다.`,
  };
}

export default function AssetPage({ params }: AssetPageProps) {
  const symbol = decodeURIComponent(params.symbol);

  return <AssetDetailView symbol={symbol} />;
}
