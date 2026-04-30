import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const modes = [
  {
    title: "간단 모드",
    subtitle: "초기 금액 + 연 수익률만 입력. 예금·적금 복리 계산",
    useCase: "내가 이 돈을 5% 예금에 10년 넣으면 얼마 되지?",
    href: "/simple",
  },
  {
    title: "고급 모드",
    subtitle: "실제 종목 과거 데이터 기반. 포트폴리오 백테스트",
    useCase: "2015년부터 애플 40% + S&P500 60%로 매월 적립했다면?",
    href: "/advanced/dates",
  },
];

export default function HomePage() {
  return (
    <section className="grid gap-6 py-6 sm:py-10">
      <div className="max-w-2xl">
        <p className="text-sm text-neutral-400">투자 시나리오 백테스트</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-neutral-50 sm:text-4xl">
          내 투자 가정을 과거 데이터로 확인하세요.
        </h1>
        <p className="mt-4 text-base leading-7 text-neutral-400">
          간단 복리 계산부터 종목별 비중, 월 적립액 변경, 환율 적용까지 한
          흐름에서 시뮬레이션합니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {modes.map((mode) => (
          <Card key={mode.title} className="flex min-h-64 flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold text-neutral-50">{mode.title}</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-400">{mode.subtitle}</p>
              <p className="mt-5 rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-neutral-300">
                {mode.useCase}
              </p>
            </div>
            <Button asChild href={mode.href} className="mt-6 w-full">
              시작하기
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
}
