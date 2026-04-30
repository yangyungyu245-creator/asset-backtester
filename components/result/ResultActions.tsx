import { Button } from "@/components/ui/Button";

export function ResultActions() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a] sm:flex-row sm:items-center sm:justify-end">
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
  );
}
