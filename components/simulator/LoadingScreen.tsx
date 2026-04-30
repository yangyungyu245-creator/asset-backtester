"use client";

import { useEffect, useState } from "react";
import { AdPlaceholder } from "@/components/simulator/AdPlaceholder";

type LoadingScreenProps = {
  onDone: () => void;
};

export function LoadingScreen({ onDone }: LoadingScreenProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          onDone();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [onDone]);

  return (
    <section className="mx-auto grid max-w-2xl gap-6 py-10 text-center">
      <div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          결과 분석 중...
        </p>
        <h1 className="mt-3 text-5xl font-semibold text-neutral-950 dark:text-neutral-50">
          {countdown}
        </h1>
      </div>
      <AdPlaceholder />
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        광고 수익으로 무료 서비스를 운영합니다
      </p>
    </section>
  );
}
