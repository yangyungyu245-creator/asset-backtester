"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdPlaceholder } from "@/components/simulator/AdPlaceholder";
import { simulateAdvanced } from "@/lib/simulation/advanced";
import { useSimulationStore } from "@/store/useSimulationStore";

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export default function AdvancedLoadingPage() {
  const router = useRouter();
  const {
    startDate,
    endDate,
    selectedTickers,
    initialAmount,
    contributionSchedule,
    options,
    setSimulationResult,
  } = useSimulationStore();
  const [countdown, setCountdown] = useState(5);
  const [isSimulating, setIsSimulating] = useState(true);

  const input = useMemo(
    () => ({
      startDate,
      endDate,
      initialAmount,
      contributionSchedule: contributionSchedule.map(
        ({ startYearMonth, endYearMonth, monthlyAmount }) => ({
          startYearMonth,
          endYearMonth,
          monthlyAmount,
        }),
      ),
      portfolio: selectedTickers.map(({ ticker, weight }) => ({ ticker, weight })),
      options,
    }),
    [
      contributionSchedule,
      endDate,
      initialAmount,
      options,
      selectedTickers,
      startDate,
    ],
  );

  useEffect(() => {
    if (!startDate || !endDate || selectedTickers.length === 0) {
      router.replace("/advanced/setup");
      return;
    }

    let cancelled = false;
    const timer = window.setInterval(() => {
      setCountdown((current) => Math.max(0, current - 1));
    }, 1000);

    async function runSimulation() {
      try {
        const [result] = await Promise.all([simulateAdvanced(input), delay(5000)]);
        if (cancelled) {
          return;
        }

        console.log("Advanced simulation result", result);
        setSimulationResult(result);
        router.push("/advanced/result");
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(error);
        alert(error instanceof Error ? error.message : "시뮬레이션에 실패했습니다.");
        router.replace("/advanced/setup");
      } finally {
        if (!cancelled) {
          setIsSimulating(false);
        }
      }
    }

    runSimulation();

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [
    endDate,
    input,
    router,
    selectedTickers.length,
    setSimulationResult,
    startDate,
  ]);

  return (
    <section className="mx-auto grid max-w-2xl gap-6 py-10 text-center">
      <div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          결과 분석 중
        </p>
        <h1 className="mt-3 text-5xl font-semibold text-neutral-950 dark:text-neutral-50">
          {countdown}
        </h1>
      </div>
      <AdPlaceholder />
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        {countdown === 0 && isSimulating
          ? "계산이 조금 더 걸리고 있습니다."
          : "잠시 후 결과 화면으로 이동합니다."}
      </p>
    </section>
  );
}
