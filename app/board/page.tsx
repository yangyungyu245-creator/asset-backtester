import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { loadTickerRequests } from "@/lib/request/requests";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BoardPage() {
  const { requests } = await loadTickerRequests();

  return (
    <section className="mx-auto grid max-w-5xl gap-6 py-4 sm:py-8">
      <div>
        <p className="text-sm font-semibold text-secondary">FIRE LIFE 커뮤니티</p>
        <h1 className="mt-3 text-3xl font-bold tracking-normal text-primary sm:text-[40px]">
          게시판
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-secondary">
          서비스 개선 의견과 종목 추가 요청을 한 곳에서 확인할 수 있습니다.
        </p>
      </div>

      <div className="grid gap-3">
        <Link href="/board/feedback" className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand/35">
          <Card rounded="2xl" padding="lg" className="transition hover:bg-card-subtle">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-primary">건의/문의 게시판</h2>
                <p className="mt-2 text-sm leading-6 text-secondary">
                  기능 요청, 버그 신고, 개선 사항을 남겨주세요.
                </p>
              </div>
              <span className="text-2xl font-bold text-secondary" aria-hidden="true">
                →
              </span>
            </div>
          </Card>
        </Link>

        <Link href="/board/request" className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand/35">
          <Card rounded="2xl" padding="lg" className="transition hover:bg-card-subtle">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-primary">종목 요청</h2>
                <p className="mt-2 text-sm leading-6 text-secondary">
                  추가하고 싶은 종목을 요청하세요.
                </p>
                <p className="mt-3 text-xs font-bold text-secondary">{requests.length}건</p>
              </div>
              <span className="text-2xl font-bold text-secondary" aria-hidden="true">
                →
              </span>
            </div>
          </Card>
        </Link>
      </div>

      <p className="text-center text-sm text-secondary">
        추후 다양한 게시판이 개설될 예정입니다.
      </p>
    </section>
  );
}
