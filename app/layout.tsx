import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  metadataBase: new URL("https://firelife.vercel.app"),
  title: {
    default: "FIRE LIFE",
    template: "%s | FIRE LIFE",
  },
  description:
    "자기 자산의 미래를 설계하기 위한 툴. 간단 복리 계산, 실제 시장 데이터 기반 백테스트, 종목 정보 탐색을 제공합니다.",
  keywords: [
    "FIRE LIFE",
    "자산 시뮬레이션",
    "복리 계산기",
    "주식 백테스트",
    "적립식 투자",
    "DCA 시뮬레이션",
  ],
  openGraph: {
    title: "FIRE LIFE",
    description:
      "경제적 자유를 향한 여정, FIRE LIFE와 함께. 자산의 미래를 계산하고 실제 시장 데이터로 점검하세요.",
    type: "website",
    locale: "ko_KR",
    siteName: "FIRE LIFE",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FIRE LIFE",
    description:
      "간단 복리 계산과 실제 종목 데이터 기반 백테스트를 한 곳에서 확인하세요.",
    images: ["/opengraph-image"],
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
            {children}
          </main>
          <Footer />
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
