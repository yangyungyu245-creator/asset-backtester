import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
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
    <header className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-normal text-primary sm:text-[40px]">
          고급 백테스트 결과
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">
          {summary}
        </p>
        {options.inflationAdjusted ? (
          <p className="mt-2 text-xs font-bold text-brand">
            실질가치 표시 중: 시작 시점 기준, 연 2% 인플레이션을 가정해 환산했습니다.
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <Badge key={badge} variant="neutral">{badge}</Badge>
          ))}
        </div>
      </div>
      <Button asChild href="/advanced/dates" variant="outline" className="w-full shrink-0 sm:w-auto">
        다른 시나리오
      </Button>
    </header>
  );
}
