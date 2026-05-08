import { RequestBoard } from "@/components/request/RequestBoard";
import { Card } from "@/components/ui/Card";
import { loadTickerRequests } from "@/lib/request/requests";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RequestPageProps = {
  searchParams?: {
    ticker?: string;
  };
};

export default async function BoardRequestPage({ searchParams }: RequestPageProps) {
  const { requests, csvConfigured } = await loadTickerRequests();
  const initialTicker = searchParams?.ticker?.trim() ?? "";

  return (
    <section className="mx-auto grid max-w-5xl gap-6 py-4 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-secondary">
            커뮤니티 종목 요청
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-normal text-primary sm:text-[40px]">
            종목 추가 요청
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-secondary">
            원하는 종목이 사이트에 없다면 미국, 한국, 암호화폐 종목을 요청해 주세요.
            Yahoo Finance 데이터를 기준으로 검증하고 매주 월요일에 자동 처리합니다.
          </p>
        </div>
        <Card rounded="xl" padding="sm" className="grid gap-1 text-sm text-secondary">
          <p>지원: 미국 / 한국 / 암호화폐</p>
          <p>검증: Yahoo Finance 데이터 기준</p>
          <p>처리: 매주 월요일 18:00 UTC</p>
        </Card>
      </div>

      <RequestBoard
        requests={requests}
        initialTicker={initialTicker}
        csvConfigured={csvConfigured}
      />
    </section>
  );
}
