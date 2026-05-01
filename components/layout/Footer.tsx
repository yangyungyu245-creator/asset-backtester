export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white px-4 py-8 text-xs text-neutral-500 dark:border-white/10 dark:bg-neutral-950 sm:px-6">
      <div className="mx-auto grid w-full max-w-5xl gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="grid gap-2">
          <p className="font-semibold text-neutral-800 dark:text-neutral-100">
            투자 시뮬레이터
          </p>
          <p>실제 종목 데이터를 기반으로 투자 시나리오를 계산하는 도구입니다.</p>
          <p>
            본 시뮬레이션의 결과는 과거 데이터 기반 추정이며, 실제 투자 결과를
            보장하지 않습니다.
          </p>
          <p>
            주가 데이터: Yahoo Finance · 매주 월요일 새벽 3시(KST) 자동 갱신 ·
            실질가치 옵션: 연 2% 인플레이션 가정
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p>made by WHY_N.ART</p>
        </div>
      </div>
    </footer>
  );
}
