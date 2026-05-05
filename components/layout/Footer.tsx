import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card-subtle px-4 py-10 text-xs text-secondary sm:px-6">
      <div className="mx-auto grid w-full max-w-5xl gap-8 md:grid-cols-[1.1fr_1.4fr_auto] md:items-start">
        <div className="grid gap-2">
          <p className="font-extrabold tracking-wide text-primary">🔥 FIRE LIFE</p>
          <p>경제적 자유를 향한 여정, FIRE LIFE와 함께</p>
        </div>

        <div className="grid gap-2">
          <p>데이터: Yahoo Finance · 매주 월요일 새벽 3시(KST) 자동 갱신</p>
          <p>
            본 시뮬레이션은 과거 데이터 기반 추정이며 실제 투자 결과를 보장하지
            않습니다.
          </p>
        </div>

        <div className="grid gap-2 md:text-right">
          <p>made by 양클로드</p>
          <Link
            href="/request"
            className="font-semibold text-brand transition hover:text-brand-dark"
          >
            종목 추가 요청 →
          </Link>
        </div>
      </div>
    </footer>
  );
}
