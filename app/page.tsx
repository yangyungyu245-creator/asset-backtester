import Link from "next/link";
import { MarketIndicesWidget } from "@/components/market/MarketIndicesWidget";

const modes = [
  {
    icon: "◎",
    title: "간단 모드",
    subtitle: "초기 금액과 월 적립액만 입력해 장기 복리 결과를 빠르게 확인합니다.",
    href: "/simple",
    badge: null,
  },
  {
    icon: "▣",
    title: "고급 모드",
    subtitle: "실제 종목 과거 데이터로 포트폴리오를 백테스트하고 미래 시점까지 확장해 볼 수 있습니다.",
    href: "/advanced/dates",
    badge: "Beta",
  },
];

export default function HomePage() {
  return (
    <section className="mx-auto grid max-w-4xl gap-8 py-6 sm:py-10">
      <div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          FIRE 투자 시뮬레이터
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-neutral-950 dark:text-neutral-50 sm:text-4xl">
          경제적 자유를 향한 여정, FIRE LIFE와 함께
        </h1>
      </div>

      <MarketIndicesWidget />

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        {modes.map((mode) => (
          <Link
            key={mode.title}
            href={mode.href}
            className="group relative min-h-56 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm transition duration-150 hover:border-info focus:outline-none focus:ring-2 focus:ring-info dark:border-white/10 dark:bg-[#1a1a1a] dark:hover:border-info"
          >
            {mode.badge ? (
              <span className="absolute right-4 top-4 rounded-full border border-info/40 px-2 py-1 text-xs font-medium text-info">
                {mode.badge}
              </span>
            ) : null}
            <div className="text-3xl" aria-hidden="true">
              {mode.icon}
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
              {mode.title}
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-neutral-600 dark:text-neutral-400">
              {mode.subtitle}
            </p>
            <p className="mt-8 text-sm font-medium text-info transition group-hover:translate-x-1">
              시작하기
            </p>
          </Link>
        ))}
      </div>

      <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
        과거 데이터 기반 백테스트와 장기 투자 설계를 한곳에서 확인하세요.
      </p>
    </section>
  );
}
