import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "소개",
  description: "FIRE LIFE 사용 가이드와 데이터 출처를 확인합니다.",
};

const guideCards = [
  {
    icon: "📊",
    title: "간단 백테스트",
    href: "/simple",
    cta: "시작하기 →",
    when: "가정한 수익률로 미래 자산을 빠르게 추산하고 싶을 때",
    input: "초기 투자금, 월 적립액, 연 수익률, 기간",
    output: "최종 자산, 원금/이자, CAGR",
  },
  {
    icon: "📈",
    title: "고급 백테스트",
    href: "/advanced/dates",
    cta: "시작하기 →",
    when: "실제 시장 데이터로 과거부터 현재까지 성과를 점검하고 싶을 때",
    input: "기간, 종목과 비중, 월 적립액",
    output: "자산 추이, S&P 500 비교, MDD, 종목별 기여도",
  },
  {
    icon: "🔍",
    title: "종목 검색",
    href: "/search",
    cta: "검색하러 가기 →",
    when: "종목 정보와 차트를 보고 바로 시뮬레이션으로 이어가고 싶을 때",
    input: "국내외 주식, ETF, 지수, 가상자산 등 360여 개 종목",
    output: "가격 차트, 기본 정보, 시뮬레이션 진입",
  },
];

const faqs = [
  {
    question: "종목이 없어요",
    answer: "종목 요청 게시판에 남겨주시면 우선순위를 보고 데이터 목록에 추가합니다.",
  },
  {
    question: "결과가 실제와 다를 수 있나요?",
    answer: "네. 백테스트는 과거 데이터와 입력 가정을 바탕으로 계산한 추정입니다.",
  },
  {
    question: "어떤 모드를 먼저 쓰면 좋나요?",
    answer: "빠른 감은 간단 모드, 실제 시장 흐름을 반영한 점검은 고급 모드가 좋습니다.",
  },
];

export default function AboutPage() {
  return (
    <section className="grid gap-6 py-4 sm:py-8">
      <div className="grid gap-3">
        <Badge variant="brand" className="w-fit">
          사용 가이드
        </Badge>
        <div>
          <h1 className="text-3xl font-extrabold leading-tight text-primary sm:text-[40px]">
            FIRE LIFE 🔥
          </h1>
          <p className="mt-3 text-lg font-semibold text-secondary">
            자기 자산의 미래를 설계하는 툴
          </p>
        </div>
      </div>

      <Card rounded="2xl" padding="lg" className="bg-brand-bg">
        <h2 className="text-[22px] font-bold text-primary">
          경제적 자유를 향한 여정, FIRE LIFE와 함께
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-secondary">
          FIRE LIFE는 투자 금액, 적립 계획, 종목 비중을 바꿔가며 자산의 흐름을
          확인하는 무료 시뮬레이션 도구입니다. 복잡한 투자 판단을 대신하지는
          않지만, 내 계획이 어떤 숫자로 이어질 수 있는지 차분하게 점검할 수
          있도록 돕습니다.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {guideCards.map((card) => (
          <Card key={card.title} rounded="2xl" padding="lg" className="min-w-0">
            <div className="text-3xl" aria-hidden="true">
              {card.icon}
            </div>
            <h2 className="mt-4 text-xl font-bold text-primary">
              {card.title}
            </h2>
            <div className="mt-4 grid gap-3 text-sm leading-6">
              <p>
                <span className="font-bold text-primary">언제 쓰나</span>
                <br />
                <span className="text-secondary">{card.when}</span>
              </p>
              <p>
                <span className="font-bold text-primary">입력</span>
                <br />
                <span className="text-secondary">{card.input}</span>
              </p>
              <p>
                <span className="font-bold text-primary">결과</span>
                <br />
                <span className="text-secondary">{card.output}</span>
              </p>
            </div>
            <Button href={card.href} className="mt-5 w-full">
              {card.cta}
            </Button>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card rounded="2xl" padding="lg">
          <h2 className="text-[22px] font-bold text-primary">데이터 출처</h2>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-secondary">
            <p>가격 데이터는 Yahoo Finance와 FIRE LIFE 보유 데이터를 사용합니다.</p>
            <p>데이터는 매주 월요일 새벽 3시(KST)에 자동 갱신됩니다.</p>
            <p>실질가치 옵션은 연 2% 인플레이션을 가정해 계산합니다.</p>
          </div>
        </Card>

        <Card rounded="2xl" padding="lg">
          <h2 className="text-[22px] font-bold text-primary">자주 묻는 질문</h2>
          <div className="mt-4 divide-y divide-border">
            {faqs.map((faq) => (
              <div key={faq.question} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-bold text-primary">{faq.question}</p>
                <p className="mt-1 text-sm leading-6 text-secondary">{faq.answer}</p>
              </div>
            ))}
          </div>
          <Button href="/request" variant="outline" className="mt-5 w-full">
            종목 요청 게시판 →
          </Button>
        </Card>
      </div>

      <Card rounded="2xl" padding="lg" variant="outline">
        <h2 className="text-[22px] font-bold text-primary">면책과 크레딧</h2>
        <p className="mt-3 text-sm leading-7 text-secondary">
          본 시뮬레이션은 과거 데이터와 사용자가 입력한 가정을 기반으로 한
          참고용 계산이며, 실제 투자 결과를 보장하지 않습니다. 투자 결정과 그
          책임은 사용자 본인에게 있습니다.
        </p>
        <p className="mt-4 text-sm font-bold text-primary">
          made by 양클로드
        </p>
      </Card>
    </section>
  );
}
