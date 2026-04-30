import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  metadataBase: new URL("https://investment-simulator.vercel.app"),
  title: {
    default: "투자 시뮬레이터",
    template: "%s | 투자 시뮬레이터",
  },
  description:
    "실제 종목 데이터 기반 투자 시뮬레이션. 적립식 복리, 포트폴리오 백테스트, 기간별 적립액 변경 가능.",
  keywords: [
    "투자 시뮬레이터",
    "복리 계산기",
    "주식 백테스트",
    "적립식 투자",
    "DCA 시뮬레이션",
  ],
  openGraph: {
    title: "투자 시뮬레이터",
    description:
      "실제 종목 데이터 기반 투자 시뮬레이션. 적립식 복리와 포트폴리오 백테스트를 한 번에 확인하세요.",
    type: "website",
    locale: "ko_KR",
    siteName: "투자 시뮬레이터",
  },
  twitter: {
    card: "summary_large_image",
    title: "투자 시뮬레이터",
    description:
      "실제 종목 데이터 기반 투자 시뮬레이션과 적립식 포트폴리오 백테스트.",
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
      </body>
    </html>
  );
}
