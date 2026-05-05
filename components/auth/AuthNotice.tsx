"use client";

import { authUnavailableMessage } from "@/lib/auth/status";

export function AuthNotice() {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
      <p className="font-semibold text-neutral-950 dark:text-neutral-50">
        로그인 저장 기능 준비 중
      </p>
      <p className="mt-1">{authUnavailableMessage}</p>
      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
        Supabase 환경 변수를 연결하면 전략, 포트폴리오, 관심 종목 저장 기능을 실제 계정 기반으로 확장할 수 있습니다.
      </p>
    </div>
  );
}
