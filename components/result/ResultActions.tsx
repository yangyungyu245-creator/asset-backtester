"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { encodeScenario } from "@/lib/share/encodeScenario";
import { useSimulationStore } from "@/store/useSimulationStore";
import { formatCompactKRW, formatPercentValue } from "./format";

export function ResultActions() {
  const {
    startDate,
    endDate,
    selectedTickers,
    initialAmount,
    contributionSchedule,
    options,
    simulationResult,
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

  function handleDownloadImage() {
    if (!simulationResult) {
      setMessage("다운로드할 결과가 없습니다.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const context = canvas.getContext("2d");

    if (!context) {
      setMessage("이미지를 만들 수 없습니다.");
      return;
    }

    const gradient = context.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, "#0a0a0a");
    gradient.addColorStop(1, "#171717");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1200, 630);

    context.fillStyle = "#38bdf8";
    context.fillRect(64, 64, 8, 502);

    context.fillStyle = "#fafafa";
    context.font = "700 58px sans-serif";
    context.fillText("투자 시뮬레이션 결과", 104, 140);

    context.fillStyle = "#d4d4d4";
    context.font = "30px sans-serif";
    context.fillText(`${startDate} ~ ${endDate}`, 104, 194);

    const tickers = selectedTickers
      .slice(0, 5)
      .map((item) => `${item.ticker} ${item.weight}%`)
      .join(" · ");
    context.fillStyle = "#a3a3a3";
    context.font = "26px sans-serif";
    context.fillText(tickers || "포트폴리오", 104, 238);

    const metrics = [
      ["최종 평가금액", formatCompactKRW(simulationResult.finalValue)],
      ["누적 원금", formatCompactKRW(simulationResult.totalContributions)],
      ["누적 수익", formatCompactKRW(simulationResult.totalReturn)],
      ["CAGR", formatPercentValue(simulationResult.cagr, 1)],
    ];

    metrics.forEach(([label, value], index) => {
      const x = 104 + (index % 2) * 500;
      const y = 340 + Math.floor(index / 2) * 120;
      context.fillStyle = "#737373";
      context.font = "24px sans-serif";
      context.fillText(label, x, y);
      context.fillStyle = "#fafafa";
      context.font = "700 42px sans-serif";
      context.fillText(value, x, y + 52);
    });

    context.fillStyle = "#a3a3a3";
    context.font = "24px sans-serif";
    context.fillText("asset-backtester.vercel.app · Yahoo Finance 데이터", 104, 570);

    const link = document.createElement("a");
    link.download = `asset-backtest-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setMessage("결과 이미지를 다운로드했습니다.");
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={handleDownloadImage}
        >
          PNG 다운로드
        </Button>
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
