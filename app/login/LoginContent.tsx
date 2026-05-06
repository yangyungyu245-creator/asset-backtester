"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Provider } from "@supabase/supabase-js";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { authUnavailableMessage, isAuthConfigured } from "@/lib/auth/status";
import { createClient } from "@/lib/supabase/client";

export function LoginContent() {
  const searchParams = useSearchParams();
  const [isPending, setIsPending] = useState<Provider | null>(null);
  const next = searchParams.get("next") ?? "/";
  const authFailed = searchParams.get("error") === "auth_failed";
  const supabase = useMemo(() => (isAuthConfigured() ? createClient() : null), []);

  async function signInWith(provider: Provider) {
    if (!supabase) {
      alert(authUnavailableMessage);
      return;
    }

    setIsPending(provider);
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", next);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo.toString(),
      },
    });

    if (error) {
      setIsPending(null);
      alert("로그인을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  return (
    <main className="mx-auto grid max-w-md gap-6 py-10">
      <div>
        <h1 className="text-3xl font-bold text-primary">로그인</h1>
        <p className="mt-3 text-sm leading-6 text-secondary">
          관심종목과 시뮬레이션 설정을 저장하세요.
        </p>
      </div>

      {authFailed ? (
        <div className="rounded-xl border border-up/30 bg-up-bg p-4 text-sm font-semibold text-up">
          로그인 처리 중 문제가 발생했습니다. 다시 시도해 주세요.
        </div>
      ) : null}

      {!supabase ? (
        <div className="rounded-xl border border-border bg-card-subtle p-4 text-sm leading-6 text-secondary">
          Supabase 환경 변수를 설정하면 구글/카카오 로그인이 활성화됩니다.
        </div>
      ) : null}

      <Card rounded="2xl" padding="lg" className="grid gap-3">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="w-full"
          disabled={Boolean(isPending)}
          onClick={() => signInWith("google")}
        >
          {isPending === "google" ? "구글로 이동 중..." : "G 구글로 로그인"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="w-full border-transparent bg-[#FEE500] text-neutral-950 hover:bg-[#F6DD00]"
          disabled={Boolean(isPending)}
          onClick={() => signInWith("kakao")}
        >
          {isPending === "kakao" ? "카카오로 이동 중..." : "카카오로 로그인"}
        </Button>
      </Card>

      <p className="text-center text-xs leading-5 text-secondary">
        로그인 시 서비스 이용에 필요한 최소 정보만 사용합니다.
      </p>
    </main>
  );
}

