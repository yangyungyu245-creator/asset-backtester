import { ImageResponse } from "next/og";
import { decodeScenario } from "@/lib/share/decodeScenario";

export const runtime = "edge";

const size = {
  width: 1200,
  height: 630,
};

function formatKRW(amount: number) {
  if (amount >= 100_000_000) {
    return `${(amount / 100_000_000).toFixed(1)}억원`;
  }

  if (amount >= 10_000) {
    return `${Math.round(amount / 10_000).toLocaleString("ko-KR")}만원`;
  }

  return `${amount.toLocaleString("ko-KR")}원`;
}

export async function GET(request: Request) {
  const encoded = new URL(request.url).searchParams.get("s");
  let title = "FIRE LIFE";
  let subtitle = "실제 종목 데이터 기반 백테스트";
  let detail = "공유된 시나리오를 열어 결과를 확인하세요.";

  if (encoded) {
    try {
      const scenario = decodeScenario(encoded);
      const tickers = scenario.selectedTickers
        .slice(0, 5)
        .map((item) => `${item.ticker} ${item.weight}%`)
        .join(" · ");
      const monthlyTotal = scenario.contributionSchedule.reduce(
        (total, period) => total + period.monthlyAmount,
        0,
      );

      title = tickers || "포트폴리오 백테스트";
      subtitle = `${scenario.startDate} ~ ${scenario.endDate}`;
      detail = `초기 ${formatKRW(scenario.initialAmount)} · 월 적립 ${formatKRW(monthlyTotal)}`;
    } catch {
      detail = "공유 URL 형식을 확인해 주세요.";
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0a",
          color: "#fafafa",
          padding: "64px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: 30, color: "#a3a3a3" }}>📈 FIRE LIFE</div>
          <div style={{ fontSize: 24, color: "#38bdf8" }}>made by 양클로드</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.15 }}>
            {title}
          </div>
          <div style={{ fontSize: 34, color: "#d4d4d4" }}>{subtitle}</div>
          <div
            style={{
              alignSelf: "flex-start",
              border: "1px solid #404040",
              borderRadius: 16,
              padding: "18px 24px",
              fontSize: 30,
              color: "#f5f5f5",
            }}
          >
            {detail}
          </div>
        </div>
        <div style={{ fontSize: 24, color: "#a3a3a3" }}>
          Yahoo Finance 데이터 · 배당/환율/리밸런싱 옵션 지원
        </div>
      </div>
    ),
    size,
  );
}
