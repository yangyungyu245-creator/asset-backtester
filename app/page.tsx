import Link from "next/link";
import { MarketIndicesWidget, MarketPulseLine } from "@/components/market/MarketIndicesWidget";

const categories = [
  {
    icon: "📊",
    title: "간단 백테스트",
    desc: "복리 시뮬레이션",
    href: "/simple",
  },
  {
    icon: "📈",
    title: "고급 백테스트",
    desc: "실제 시장 데이터",
    href: "/advanced/dates",
  },
  {
    icon: "🔍",
    title: "종목 검색",
    desc: "종목 정보 + 시뮬레이션",
    href: "/search",
  },
];

function CategoryCard({
  icon,
  title,
  desc,
  href,
}: {
  icon: string;
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[150px] flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-subtle transition hover:bg-card-subtle focus:outline-none focus:ring-2 focus:ring-brand/35 sm:min-h-[178px] sm:p-6"
    >
      <span className="text-3xl leading-none" aria-hidden="true">
        {icon}
      </span>
      <span>
        <span className="block text-lg font-bold text-primary">{title}</span>
        <span className="mt-1 block text-sm text-secondary">{desc}</span>
      </span>
    </Link>
  );
}

export default function HomePage() {
  return (
    <div className="grid gap-8 py-4 sm:gap-10 sm:py-8">
      <section className="grid gap-3">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h1 className="text-3xl font-bold leading-tight text-primary sm:text-[40px]">
            FIRE LIFE <span aria-hidden="true">🔥</span>
          </h1>
          <MarketPulseLine />
        </div>
        <p className="text-base text-secondary">
          자기 자산의 미래를 설계하는 툴
        </p>
      </section>

      <section aria-label="백테스트 시작">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {categories.map((category) => (
            <CategoryCard key={category.href} {...category} />
          ))}
        </div>
      </section>

      <MarketIndicesWidget />
    </div>
  );
}
