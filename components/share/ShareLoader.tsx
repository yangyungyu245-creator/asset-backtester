"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { decodeScenario } from "@/lib/share/decodeScenario";
import { useSimulationStore } from "@/store/useSimulationStore";

function ShareLoaderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loadScenario = useSimulationStore((state) => state.loadScenario);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const encoded = searchParams.get("s");

    if (!encoded) {
      setError("공유 코드가 없습니다.");
      return;
    }

    try {
      const scenario = decodeScenario(encoded);
      loadScenario({
        startDate: scenario.startDate,
        endDate: scenario.endDate,
        selectedTickers: scenario.selectedTickers,
        allocationMode: scenario.allocationMode,
        initialAmount: scenario.initialAmount,
        customInitialAlloc: scenario.customInitialAlloc,
        initialAllocations: scenario.initialAllocations,
        contributionFrequency: scenario.contributionFrequency,
        contributionSchedule: scenario.contributionSchedule,
        options: scenario.options,
      });
      router.replace("/advanced/loading");
    } catch (decodeError) {
      setError(
        decodeError instanceof Error
          ? decodeError.message
          : "공유 URL을 불러오지 못했습니다.",
      );
    }
  }, [loadScenario, router, searchParams]);

  return (
    <section className="mx-auto grid max-w-xl gap-5 py-16 text-center">
      {error ? (
        <>
          <div>
            <h1 className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
              공유 URL을 열 수 없습니다
            </h1>
            <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
              {error}
            </p>
          </div>
          <Button asChild href="/advanced/dates" className="mx-auto">
            고급 모드 시작
          </Button>
        </>
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white p-5 text-sm text-neutral-500 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a] dark:text-neutral-400">
          공유 시나리오를 불러오는 중입니다.
        </div>
      )}
    </section>
  );
}

export function ShareLoader() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto grid max-w-xl gap-5 py-16 text-center">
          <div className="rounded-lg border border-neutral-200 bg-white p-5 text-sm text-neutral-500 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a] dark:text-neutral-400">
            공유 시나리오를 불러오는 중입니다.
          </div>
        </section>
      }
    >
      <ShareLoaderContent />
    </Suspense>
  );
}
