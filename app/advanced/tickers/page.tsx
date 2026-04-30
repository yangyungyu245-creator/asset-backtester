"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdvancedStepper } from "@/components/simulator/AdvancedStepper";
import { TickerSearch } from "@/components/simulator/TickerSearch";
import { Button } from "@/components/ui/Button";
import { loadTickerIndex, type TickerMeta } from "@/lib/data/tickerIndex";
import { useSimulationStore } from "@/store/useSimulationStore";

export default function AdvancedTickersPage() {
  const router = useRouter();
  const {
    startDate,
    selectedTickers,
    addTicker,
    removeTicker,
  } = useSimulationStore();
  const [tickers, setTickers] = useState<TickerMeta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!startDate) {
      router.replace("/advanced/dates");
      return;
    }

    loadTickerIndex()
      .then((data) => setTickers(data))
      .catch((indexError: unknown) => {
        setError(
          indexError instanceof Error
            ? indexError.message
            : "종목 인덱스를 불러오지 못했습니다.",
        );
      })
      .finally(() => setLoading(false));
  }, [router, startDate]);

  return (
    <section className="py-4 sm:py-8">
      <AdvancedStepper currentStep={2} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-950 dark:text-neutral-50">
            종목 선택
          </h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
            시작일 이전에 상장된 종목만 선택할 수 있습니다.
          </p>
          <p className="mt-2 text-sm font-medium text-neutral-950 dark:text-neutral-50">
            시작일: {startDate}
          </p>
        </div>
        <Link
          href="/advanced/dates"
          className="text-sm font-medium text-info transition hover:text-blue-500"
        >
          시작일 변경
        </Link>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-5 text-sm text-neutral-500 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a] dark:text-neutral-400">
            종목 인덱스를 불러오는 중입니다.
          </div>
        ) : error ? (
          <div className="rounded-lg border border-negative/30 bg-negative/10 p-5 text-sm text-negative">
            {error}
          </div>
        ) : (
          <TickerSearch
            tickers={tickers}
            startDate={startDate}
            selectedTickers={selectedTickers}
            onAdd={addTicker}
            onRemove={removeTicker}
          />
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button asChild href="/advanced/dates" className="border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100 dark:bg-transparent dark:text-neutral-100 dark:hover:bg-white/5">
          이전
        </Button>
        <Button
          type="button"
          disabled={selectedTickers.length < 1}
          onClick={() => router.push("/advanced/setup")}
        >
          다음
        </Button>
      </div>
    </section>
  );
}
