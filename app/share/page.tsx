import type { Metadata } from "next";
import { ShareLoader } from "@/components/share/ShareLoader";
import { decodeScenario } from "@/lib/share/decodeScenario";

type SharePageProps = {
  searchParams: { s?: string };
};

export function generateMetadata({ searchParams }: SharePageProps): Metadata {
  const encoded = searchParams.s;
  const imageUrl = encoded
    ? `/api/og?s=${encodeURIComponent(encoded)}`
    : "/opengraph-image";

  let title = "공유된 투자 시뮬레이션";
  let description = "실제 종목 데이터 기반 투자 시나리오를 확인해 보세요.";

  if (encoded) {
    try {
      const scenario = decodeScenario(encoded);
      const tickers = scenario.selectedTickers
        .slice(0, 4)
        .map((item) => item.ticker)
        .join(", ");
      title = `${tickers || "포트폴리오"} 백테스트 결과`;
      description = `${scenario.startDate}부터 ${scenario.endDate}까지의 공유 시나리오입니다.`;
    } catch {
      title = "투자 시뮬레이션 공유";
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function SharePage() {
  return <ShareLoader />;
}
