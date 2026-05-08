import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "소개",
  description: "FIRE LIFE의 투자 시뮬레이션, 종목 검색, 포트폴리오, 배당, 뉴스 기능을 소개합니다.",
};

const features = [
  {
    icon: "📊",
    title: "투자 시뮬레이션",
    lines: [
      "간단 모드: 수익률 가정 + 복리 계산",
      "고급 모드: 실제 360+ 종목 데이터로 백테스트",
      "S&P 500 비교, CAGR, MDD 분석",
    ],
  },
  {
    icon: "🔍",
    title: "종목 검색 + 실시간 시세",
    lines: [
      "실시간 가격, 등락률, 캔들/라인 차트",
      "이동평균선(5/20/60일), 거래량",
      "PER, EPS, 배당 정보, 52주 고저",
    ],
  },
  {
    icon: "💼",
    title: "내 포트폴리오 관리",
    lines: [
      "실제 보유 종목 등록 + 수익률 추적",
      "예상 배당금 계산 (월별)",
      "분야별 비중 시각화",
      "포트폴리오로 바로 백테스트 시작",
    ],
  },
  {
    icon: "📰",
    title: "경제 뉴스",
    lines: [
      "국내외 경제/증시 뉴스 실시간 피드",
      "한경, Investing.com, CNBC 소스",
    ],
  },
  {
    icon: "🆓",
    title: "무료 · 광고 없음",
    lines: [
      "로그인 없이도 시뮬레이션 가능",
      "구글 계정으로 포트폴리오/관심종목 저장",
    ],
  },
];

export default function AboutPage() {
  return (
    <section className="mx-auto grid max-w-4xl gap-8 py-4 sm:py-8">
      <div className="grid gap-4 text-center">
        <Badge variant="brand" className="mx-auto w-fit">
          경제적 자유를 향한 여정
        </Badge>
        <div>
          <h1 className="text-4xl font-extrabold leading-tight text-primary sm:text-5xl">
            FIRE LIFE 🔥
          </h1>
          <p className="mt-4 text-lg font-semibold leading-8 text-secondary">
            자산의 미래를 계산하고, 실제 시장 데이터로 점검하고, 내 포트폴리오를 꾸준히 관리하는 투자 도구입니다.
          </p>
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="grid gap-4">
        {features.map((feature) => (
          <Card key={feature.title} rounded="2xl" padding="lg">
            <div className="flex gap-4">
              <div className="text-3xl leading-none" aria-hidden="true">
                {feature.icon}
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-primary">{feature.title}</h2>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-secondary">
                  {feature.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button href="/simple" size="lg" className="w-full">
          시뮬레이션 시작하기 →
        </Button>
        <Button href="/search" size="lg" variant="secondary" className="w-full">
          종목 검색하기 →
        </Button>
      </div>

      <div className="h-px bg-border" />

      <Card rounded="2xl" padding="lg" variant="outline">
        <div className="grid gap-3 text-sm leading-7 text-secondary">
          <p>데이터: Yahoo Finance · 매주 월요일 새벽 3시(KST) 자동 갱신</p>
          <p>
            문의/건의:{" "}
            <a href="/board" className="font-bold text-brand hover:underline">
              게시판 →
            </a>
          </p>
          <p>Instagram: @firelife.app</p>
          <p className="pt-2 font-bold text-primary">made by 양클로드</p>
        </div>
      </Card>
    </section>
  );
}
