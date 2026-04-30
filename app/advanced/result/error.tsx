"use client";

import { Button } from "@/components/ui/Button";

type ResultErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ResultError({ error, reset }: ResultErrorProps) {
  return (
    <section className="mx-auto grid max-w-xl gap-5 py-16 text-center">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
          결과 화면을 불러오지 못했습니다
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
          {error.message || "알 수 없는 오류가 발생했습니다."}
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button type="button" onClick={reset}>
          다시 시도
        </Button>
        <Button asChild href="/advanced/dates" variant="outline">
          처음으로
        </Button>
      </div>
    </section>
  );
}
