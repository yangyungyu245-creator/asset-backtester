import type { Metadata } from "next";
import { AuthNotice } from "@/components/auth/AuthNotice";

export const metadata: Metadata = {
  title: "로그인",
  description: "FIRE LIFE 저장 기능 로그인",
};

export default function LoginPage() {
  return (
    <section className="mx-auto grid max-w-xl gap-5 py-10">
      <div>
        <h1 className="text-3xl font-semibold text-neutral-950 dark:text-neutral-50">
          로그인
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
          로그인하면 전략, 포트폴리오, 관심 종목을 저장할 수 있습니다.
        </p>
      </div>

      <AuthNotice />

      <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
        <label className="grid gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">
          이메일
          <input
            type="email"
            disabled
            placeholder="you@example.com"
            className="h-11 rounded-md border border-neutral-300 bg-neutral-50 px-3 text-sm text-neutral-500 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-400"
          />
        </label>
        <button
          type="button"
          disabled
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md border border-neutral-300 bg-neutral-100 px-4 text-sm font-medium text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-neutral-400"
        >
          Magic Link 보내기
        </button>
      </div>
    </section>
  );
}
