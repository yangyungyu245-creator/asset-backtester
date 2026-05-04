"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { encodeScenario } from "@/lib/share/encodeScenario";
import type { SimulationPoint } from "@/lib/simulation/types";
import { useSimulationStore } from "@/store/useSimulationStore";
import { formatCompactKRW, formatPercentValue } from "./format";

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function drawLineChart(
  context: CanvasRenderingContext2D,
  data: SimulationPoint[],
  x: number,
  y: number,
  width: number,
  height: number,
) {
  if (data.length < 2) {
    return;
  }

  const values = data.flatMap((point) => [point.value, point.contributions]);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = Math.max(1, maxValue - minValue);
  const padding = 28;
  const chartX = x + padding;
  const chartY = y + padding;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  context.strokeStyle = "#334155";
  context.lineWidth = 1;
  context.setLineDash([4, 6]);
  for (let i = 0; i <= 3; i += 1) {
    const gridY = chartY + (chartHeight / 3) * i;
    context.beginPath();
    context.moveTo(chartX, gridY);
    context.lineTo(chartX + chartWidth, gridY);
    context.stroke();
  }
  context.setLineDash([]);

  const drawSeries = (
    key: "value" | "contributions",
    color: string,
    dashed = false,
  ) => {
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = key === "value" ? 4 : 3;
    context.setLineDash(dashed ? [10, 8] : []);

    data.forEach((point, index) => {
      const pointX = chartX + (chartWidth * index) / (data.length - 1);
      const pointY =
        chartY + chartHeight - ((point[key] - minValue) / range) * chartHeight;

      if (index === 0) {
        context.moveTo(pointX, pointY);
      } else {
        context.lineTo(pointX, pointY);
      }
    });

    context.stroke();
    context.setLineDash([]);
  };

  drawSeries("value", "#38bdf8");
  drawSeries("contributions", "#94a3b8", true);

  context.fillStyle = "#cbd5e1";
  context.font = "20px sans-serif";
  context.fillText("자산 추이", x + 24, y + 30);

  context.font = "18px sans-serif";
  context.fillStyle = "#38bdf8";
  context.fillText("평가금액", x + width - 210, y + 30);
  context.fillStyle = "#94a3b8";
  context.fillText("원금", x + width - 105, y + 30);

  context.fillStyle = "#94a3b8";
  context.font = "18px sans-serif";
  context.fillText(formatCompactKRW(maxValue), chartX, chartY - 6);
  context.fillText(formatCompactKRW(minValue), chartX, chartY + chartHeight + 22);
}

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
      setMessage("URL을 복사했습니다.");
    } catch {
      setMessage("클립보드 복사에 실패했습니다. 주소창 URL을 직접 복사해 주세요.");
    }
  }

  function handleDownloadImage() {
    if (!simulationResult) {
      setMessage("다운로드할 결과가 없습니다.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 900;
    const context = canvas.getContext("2d");

    if (!context) {
      setMessage("이미지를 만들 수 없습니다.");
      return;
    }

    const gradient = context.createLinearGradient(0, 0, 1200, 900);
    gradient.addColorStop(0, "#0a0a0a");
    gradient.addColorStop(1, "#172033");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1200, 900);

    context.fillStyle = "#38bdf8";
    context.fillRect(64, 64, 8, 760);

    context.fillStyle = "#fafafa";
    context.font = "900 56px sans-serif";
    context.fillText("📈 FIRE LIFE 결과", 104, 132);

    context.fillStyle = "#d4d4d4";
    context.font = "28px sans-serif";
    context.fillText(`${startDate} ~ ${endDate}`, 104, 184);

    const tickers = selectedTickers
      .slice(0, 6)
      .map((item) => `${item.ticker} ${item.weight}%`)
      .join(" · ");
    context.fillStyle = "#a3a3a3";
    context.font = "24px sans-serif";
    context.fillText(tickers || "포트폴리오", 104, 226);

    const metrics = [
      ["최종 자산", formatCompactKRW(simulationResult.finalValue), "#fafafa"],
      ["총 원금", formatCompactKRW(simulationResult.totalContributions), "#fafafa"],
      [
        "총 수익",
        formatCompactKRW(simulationResult.totalReturn),
        simulationResult.totalReturn >= 0 ? "#22c55e" : "#ef4444",
      ],
      ["CAGR", formatPercentValue(simulationResult.cagr * 100, 1), "#fafafa"],
      ["최대 낙폭", formatPercentValue(simulationResult.maxDrawdown.percent, 1), "#ef4444"],
    ];

    metrics.forEach(([label, value, color], index) => {
      const x = 104 + (index % 5) * 205;
      const y = 315;
      context.fillStyle = "#94a3b8";
      context.font = "22px sans-serif";
      context.fillText(label, x, y);
      context.fillStyle = color;
      context.font = "700 34px sans-serif";
      context.fillText(value, x, y + 48);
    });

    context.fillStyle = "#111827";
    drawRoundedRect(context, 104, 430, 1010, 330, 16);
    context.fill();
    drawLineChart(context, simulationResult.timeSeries, 104, 430, 1010, 330);

    context.fillStyle = "#a3a3a3";
    context.font = "22px sans-serif";
    context.fillText("asset-backtester.vercel.app · Yahoo Finance 데이터 · made by 양클로드", 104, 830);

    const link = document.createElement("a");
    link.download = `fire-life-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setMessage("차트가 포함된 결과 이미지를 다운로드했습니다.");
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
