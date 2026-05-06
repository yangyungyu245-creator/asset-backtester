import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SavedSimulationCard } from "@/components/saved/SavedSimulationCard";
import { StockLogo } from "@/components/asset/StockLogo";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type WatchlistRow = {
  id: string;
  symbol: string;
  added_at: string;
};

type SavedSimulation = {
  id: string;
  name: string;
  mode: "simple" | "advanced";
  config: Record<string, unknown>;
  created_at: string;
};

export const metadata: Metadata = {
  title: "마이페이지",
  description: "관심종목과 저장된 FIRE LIFE 시뮬레이션을 확인합니다.",
};

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ko-KR");
}

export default async function MyPage() {
  if (!isSupabaseConfigured()) {
    redirect("/login?next=/mypage");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/mypage");
  }

  const [{ data: watchlistData }, { data: savedData }] = await Promise.all([
    supabase
      .from("watchlist")
      .select("id, symbol, added_at")
      .eq("user_id", user.id)
      .order("added_at", { ascending: false }),
    supabase
      .from("saved_simulations")
      .select("id, name, mode, config, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);
  const watchlist = (watchlistData ?? []) as WatchlistRow[];
  const savedSimulations = (savedData ?? []) as SavedSimulation[];
  const displayName =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email ||
    "내 계정";

  return (
    <section className="grid gap-6 py-4 sm:py-8">
      <div>
        <h1 className="text-3xl font-bold text-primary sm:text-[40px]">
          마이페이지
        </h1>
        <p className="mt-3 text-sm leading-6 text-secondary">
          관심종목과 저장된 시뮬레이션을 한 곳에서 확인합니다.
        </p>
      </div>

      <Card rounded="2xl" padding="lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-xl font-bold text-primary">
              {displayName}
            </p>
            {user.email ? (
              <p className="mt-1 truncate text-sm text-secondary">{user.email}</p>
            ) : null}
            <p className="mt-2 text-xs text-secondary">
              가입일: {formatDate(user.created_at)}
            </p>
          </div>
          <Button href="/search" variant="outline">
            종목 검색
          </Button>
        </div>
      </Card>

      <Card rounded="2xl" padding="lg">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-primary">
              관심종목
            </h2>
            <p className="mt-1 text-sm text-secondary">{watchlist.length}개</p>
          </div>
          <Button href="/search" variant="ghost" size="sm">
            추가하기
          </Button>
        </div>

        {watchlist.length > 0 ? (
          <div className="mt-5 divide-y divide-border">
            {watchlist.map((row) => (
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
                      추가일: {formatDate(row.added_at)}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-bold text-brand">
                  보기
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl bg-card-subtle p-6 text-center">
            <p className="text-sm font-bold text-primary">
              아직 관심종목이 없습니다.
            </p>
            <p className="mt-2 text-sm text-secondary">
              종목을 검색하고 하트를 눌러 저장해보세요.
            </p>
            <Button href="/search" className="mt-5">
              종목 검색하러 가기
            </Button>
          </div>
        )}
      </Card>

      <Card rounded="2xl" padding="lg">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-primary">
              저장된 시뮬레이션
            </h2>
            <p className="mt-1 text-sm text-secondary">
              {savedSimulations.length}개
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="neutral">간단</Badge>
            <Badge variant="brand">고급</Badge>
          </div>
        </div>

        {savedSimulations.length > 0 ? (
          <div className="mt-5 divide-y divide-border">
            {savedSimulations.map((item) => (
              <SavedSimulationCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl bg-card-subtle p-6 text-center">
            <p className="text-sm font-bold text-primary">
              아직 저장된 시뮬레이션이 없습니다.
            </p>
            <p className="mt-2 text-sm text-secondary">
              결과 화면에서 저장 버튼을 눌러 설정을 보관할 수 있습니다.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
              <Button href="/simple" variant="outline">
                간단 모드
              </Button>
              <Button href="/advanced/dates">
                고급 모드
              </Button>
            </div>
          </div>
        )}
      </Card>
    </section>
  );
}
