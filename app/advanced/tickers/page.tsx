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
  const [assetSymbol, setAssetSymbol] = useState("");
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryAsset = params.get("asset")?.trim().toUpperCase() ?? "";
    const pendingAsset = window.sessionStorage.getItem("firelife.pendingAsset")?.trim().toUpperCase() ?? "";
    setAssetSymbol(queryAsset || pendingAsset);
  }, []);

  useEffect(() => {
    const pending =
      assetSymbol ||
      (typeof window !== "undefined"
        ? window.sessionStorage.getItem("firelife.pendingAsset") ?? ""
        : "");
    if (!pending) return;
    addTicker(pending);
    window.sessionStorage.removeItem("firelife.pendingAsset");
  }, [addTicker, assetSymbol]);

  return (
    <section className="py-4 sm:py-8">
      <AdvancedStepper currentStep={2} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary sm:text-[40px]">
            종목 선택
          </h1>
          <p className="mt-3 text-base leading-7 text-secondary">
            시작일 이전에 상장된 종목만 선택할 수 있습니다.
          </p>
          {assetSymbol ? (
            <p className="mt-2 text-sm font-bold text-brand">
              {assetSymbol}이 자동으로 추가되었습니다.
            </p>
          ) : null}
          <p className="mt-2 text-sm font-bold text-primary">
            시작일: {startDate}
          </p>
        </div>
        <Link
          href="/advanced/dates"
          className="text-sm font-bold text-brand transition hover:text-brand-dark"
        >
          시작일 변경
        </Link>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="rounded-2xl border border-border bg-card p-5 text-sm text-secondary shadow-subtle">
            종목 인덱스를 불러오는 중입니다.
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-up-bg p-5 text-sm text-up">
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
        <Button asChild href="/advanced/dates" variant="outline">
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
