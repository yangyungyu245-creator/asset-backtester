import { Button } from "@/components/ui/Button";
import type {
  AdvancedOptions,
  ContributionPeriod,
  SelectedTicker,
} from "@/store/useSimulationStore";
import { formatScenarioSummary, getOptionBadges } from "./format";

type ResultHeaderProps = {
  startDate: string;
  endDate: string;
  selectedTickers: SelectedTicker[];
  initialAmount: number;
  contributionSchedule: ContributionPeriod[];
  options: AdvancedOptions;
};

export function ResultHeader({
  startDate,
  endDate,
  selectedTickers,
  initialAmount,
  contributionSchedule,
  options,
}: ResultHeaderProps) {
  const summary = formatScenarioSummary({
    startDate,
    endDate,
    selectedTickers,
    initialAmount,
    contributionSchedule,
  });
  const badges = getOptionBadges(options);

  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold tracking-normal text-neutral-950 dark:text-neutral-50">
          시뮬레이션 결과
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600 dark:text-neutral-400">
          {summary}
        </p>
        {options.inflationAdjusted ? (
          <p className="mt-2 text-xs font-medium text-info">
            실질가치 표시 중: 시작 시점 기준, 연 2% 인플레이션을 가정해 환산했습니다.
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
      <Button asChild href="/advanced/dates" variant="outline" className="shrink-0">
        다른 시나리오
      </Button>
    </header>
  );
}
