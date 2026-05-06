import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StockLogo } from "@/components/asset/StockLogo";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type WatchlistRow = {
  id: string;
  symbol: string;
  added_at: string;
};

export const metadata: Metadata = {
  title: "관심종목",
  description: "저장한 관심종목을 확인합니다.",
};

export default async function WatchlistPage() {
  if (!isSupabaseConfigured()) {
    redirect("/login?next=/watchlist");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/watchlist");
  }

  const { data } = await supabase
    .from("watchlist")
    .select("id, symbol, added_at")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });
  const rows = (data ?? []) as WatchlistRow[];

  return (
    <section className="grid gap-6 py-4 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary sm:text-[40px]">
            관심종목
          </h1>
          <p className="mt-3 text-sm leading-6 text-secondary">
            자주 확인하는 종목을 모아볼 수 있습니다.
          </p>
        </div>
        <Button href="/search" variant="outline">
          종목 검색 →
        </Button>
      </div>

      {rows.length > 0 ? (
        <Card rounded="2xl" padding="lg">
          <div className="divide-y divide-border">
            {rows.map((row) => (
              <Link
                key={row.id}
                href={`/asset/${encodeURIComponent(row.symbol)}`}
                className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <StockLogo symbol={row.symbol} />
                  <div className="min-w-0">
                  <p className="font-mono text-lg font-bold text-primary">
                    {row.symbol}
                  </p>
                  <p className="mt-1 text-xs text-secondary">
                    추가일 {new Date(row.added_at).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                  </div>
                <span className="shrink-0 text-sm font-bold text-brand">
                  보기 →
                </span>
              </Link>
            ))}
          </div>
        </Card>
      ) : (
        <Card rounded="2xl" padding="lg" className="text-center">
          <p className="text-base font-bold text-primary">
            아직 관심종목이 없습니다.
          </p>
          <p className="mt-2 text-sm leading-6 text-secondary">
            자산 상세 페이지에서 하트를 눌러 종목을 저장해 보세요.
          </p>
          <Button href="/search" className="mt-5">
            종목 찾기
          </Button>
        </Card>
      )}
    </section>
  );
}
