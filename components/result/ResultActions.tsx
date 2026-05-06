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

  context.strokeStyle = "#E5E8EB";
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

  drawSeries("value", "#FF6B35");
  drawSeries("contributions", "#8B95A1", true);

  const maxLabel = formatCompactKRW(maxValue);
  const minLabel = formatCompactKRW(minValue);
  context.font = "18px sans-serif";
  const maxLabelX = Math.min(chartX + chartWidth - 112, Math.max(chartX, chartX + 8));
  const maxLabelY = Math.max(chartY + 24, chartY - 8);
  context.fillStyle = "rgba(25, 31, 40, 0.86)";
  drawRoundedRect(context, maxLabelX - 8, maxLabelY - 20, context.measureText(maxLabel).width + 16, 26, 8);
  context.fill();
  context.fillStyle = "#8B95A1";
  context.fillText(maxLabel, maxLabelX, maxLabelY);
  context.fillText(minLabel, chartX, chartY + chartHeight + 22);
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
      setMessage("공유 링크를 클립보드에 복사했습니다.");
    } catch {
      setMessage("브라우저 권한 때문에 자동 복사하지 못했습니다. 주소창의 URL을 직접 복사해 주세요.");
    }
  }

  function handleDownloadImage() {
    if (!simulationResult) {
      setMessage("저장할 시뮬레이션 결과가 없습니다.");
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
    gradient.addColorStop(0, "#191F28");
    gradient.addColorStop(1, "#111820");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1200, 900);

    context.fillStyle = "#FF6B35";
    context.fillRect(64, 64, 8, 760);

    context.fillStyle = "#F2F4F6";
    context.font = "900 56px sans-serif";
    context.fillText("FIRE LIFE 결과", 104, 132);

    context.fillStyle = "#B0B8C1";
    context.font = "28px sans-serif";
    context.fillText(`${startDate} ~ ${endDate}`, 104, 184);

    const tickers = selectedTickers
      .slice(0, 6)
      .map((item) => `${item.ticker} ${item.weight}%`)
      .join(" · ");
    context.fillStyle = "#B0B8C1";
    context.font = "24px sans-serif";
    context.fillText(tickers || "포트폴리오 없음", 104, 226);

    const metrics = [
      ["최종 자산", formatCompactKRW(simulationResult.finalValue), "#191F28"],
      ["총 원금", formatCompactKRW(simulationResult.totalContributions), "#191F28"],
      [
        "총 수익",
        formatCompactKRW(simulationResult.totalReturn),
        simulationResult.totalReturn >= 0 ? "#F04452" : "#3182F6",
      ],
      ["CAGR", formatPercentValue(simulationResult.cagr * 100, 1), "#F2F4F6"],
      ["최대 낙폭", formatPercentValue(simulationResult.maxDrawdown.percent, 1), "#3182F6"],
    ];

    metrics.forEach(([label, value, color], index) => {
      const metricX = 104 + (index % 5) * 205;
      const metricY = 315;
      context.fillStyle = "#B0B8C1";
      context.font = "22px sans-serif";
      context.fillText(label, metricX, metricY);
      context.fillStyle = color === "#191F28" ? "#F2F4F6" : color;
      context.font = "700 34px sans-serif";
      context.fillText(value, metricX, metricY + 48);
    });

    context.fillStyle = "#232B36";
    drawRoundedRect(context, 104, 430, 1010, 330, 16);
    context.fill();

    context.fillStyle = "#F2F4F6";
    context.font = "700 24px sans-serif";
    context.fillText("자산 추이", 128, 468);

    context.font = "18px sans-serif";
    context.fillStyle = "#FF6B35";
    context.fillRect(900, 458, 32, 4);
    context.fillText("포트폴리오", 942, 466);
    context.fillStyle = "#8B95A1";
    context.setLineDash([8, 6]);
    context.beginPath();
    context.moveTo(1040, 460);
    context.lineTo(1072, 460);
    context.strokeStyle = "#8B95A1";
    context.lineWidth = 4;
    context.stroke();
    context.setLineDash([]);
    context.fillText("원금", 1082, 466);

    drawLineChart(context, simulationResult.timeSeries, 104, 482, 1010, 250);

    context.fillStyle = "#B0B8C1";
    context.font = "22px sans-serif";
    context.fillText("firelife.vercel.app · Yahoo Finance 데이터 · made by 업로드", 104, 830);

    const link = document.createElement("a");
    link.download = `fire-life-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setMessage("PNG 이미지로 저장했습니다.");
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-subtle">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={handleDownloadImage}
        >
          PNG로 저장하기
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
          다른 시나리오 시작
        </Button>
        <Button
          asChild
          href="/advanced/loading"
          variant="outline"
          className="w-full sm:w-auto"
        >
          같은 조건으로 다시 계산
        </Button>
      </div>
      {message ? (
        <p className="mt-3 text-right text-xs font-bold text-brand">{message}</p>
      ) : null}
    </div>
  );
}
