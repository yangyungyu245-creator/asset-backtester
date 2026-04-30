"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { encodeScenario } from "@/lib/share/encodeScenario";
import { useSimulationStore } from "@/store/useSimulationStore";

export function ResultActions() {
  const {
    startDate,
    endDate,
    selectedTickers,
    initialAmount,
    contributionSchedule,
    options,
  } = useSimulationStore();
  const [message, setMessage] = useState<string | null>(null);

  async function handleShare() {
    const encoded = encodeScenario({
      v: 1,
      startDate,
      endDate,
      selectedTickers,
      initialAmount,
      contributionSchedule: contributionSchedule.map(
        ({ startYearMonth, endYearMonth, monthlyAmount }) => ({
          startYearMonth,
          endYearMonth,
          monthlyAmount,
        }),
      ),
      options,
    });
    const url = `${window.location.origin}/share?s=${encoded}`;

    try {
      await navigator.clipboard.writeText(url);
      setMessage("URL이 복사되었습니다.");
    } catch {
      setMessage("클립보드 복사에 실패했습니다. 주소창 URL을 직접 복사해주세요.");
    }
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={handleShare}
        >
          결과 공유
        </Button>
        <Button asChild href="/advanced/dates" className="w-full sm:w-auto">
          다른 시나리오 시도
        </Button>
        <Button
          asChild
          href="/advanced/loading"
          variant="outline"
          className="w-full sm:w-auto"
        >
          같은 조건으로 다시
        </Button>
      </div>
      {message ? (
        <p className="mt-3 text-right text-xs font-medium text-info">{message}</p>
      ) : null}
    </div>
  );
}
