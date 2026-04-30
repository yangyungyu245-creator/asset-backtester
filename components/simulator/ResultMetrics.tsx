import { formatKRW } from "@/lib/utils/format";

type ResultMetricsProps = {
  finalValue: number;
  totalContributions: number;
  totalReturn: number;
  effectiveAnnualRate: number;
};

export function ResultMetrics({
  finalValue,
  totalContributions,
  totalReturn,
  effectiveAnnualRate,
}: ResultMetricsProps) {
  const cards = [
    { label: "최종 자산", value: formatKRW(finalValue), tone: "default" },
    { label: "총 원금", value: formatKRW(totalContributions), tone: "default" },
    {
      label: "총 수익",
      value: `${totalReturn >= 0 ? "+" : ""}${formatKRW(totalReturn)}`,
      tone: totalReturn >= 0 ? "positive" : "negative",
    },
    {
      label: "실효 연수익률",
      value: `${effectiveAnnualRate >= 0 ? "+" : ""}${effectiveAnnualRate.toFixed(2)}%`,
      tone: effectiveAnnualRate >= 0 ? "positive" : "negative",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]"
        >
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {card.label}
          </p>
          <p
            className={`mt-2 text-xl font-semibold md:text-2xl ${
              card.tone === "positive"
                ? "text-positive"
                : card.tone === "negative"
                  ? "text-negative"
                  : "text-neutral-950 dark:text-neutral-50"
            }`}
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
