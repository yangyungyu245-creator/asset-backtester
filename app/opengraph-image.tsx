import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "FIRE LIFE";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#0f172a",
          color: "#f8fafc",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 30,
            color: "#38bdf8",
            marginBottom: 28,
          }}
        >
          🔥 적립식 투자 · 포트폴리오 백테스트
        </div>
        <div
          style={{
            fontSize: 92,
            fontWeight: 900,
            letterSpacing: 2,
          }}
        >
          FIRE LIFE
        </div>
        <div
          style={{
            marginTop: 30,
            maxWidth: 900,
            fontSize: 34,
            lineHeight: 1.35,
            color: "#cbd5e1",
          }}
        >
          실제 종목 데이터 기반으로 나만의 투자 시나리오를 확인하세요.
        </div>
        <div
          style={{
            marginTop: 42,
            fontSize: 24,
            color: "#94a3b8",
          }}
        >
          firelife.vercel.app · made by 양클로드
        </div>
      </div>
    ),
    size,
  );
}
