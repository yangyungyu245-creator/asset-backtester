"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import type { AdvancedOptions, SelectedTicker } from "@/store/useSimulationStore";
import { useSimulationStore } from "@/store/useSimulationStore";

type SavedSimulation = {
  id: string;
  name: string;
  mode: "simple" | "advanced";
  config: Record<string, unknown>;
  created_at: string;
};

type AdvancedConfig = {
  startDate: string;
  endDate: string;
  selectedTickers: SelectedTicker[];
  initialAmount: number;
  contributionSchedule: Array<{
    startYearMonth: string;
    endYearMonth: string;
    monthlyAmount: number;
  }>;
  options: AdvancedOptions;
};

function isAdvancedConfig(config: Record<string, unknown>): config is AdvancedConfig {
  return (
    typeof config.startDate === "string" &&
    typeof config.endDate === "string" &&
    Array.isArray(config.selectedTickers) &&
    typeof config.initialAmount === "number" &&
    Array.isArray(config.contributionSchedule) &&
    typeof config.options === "object" &&
    config.options !== null
  );
}

export function SavedSimulationCard({ item }: { item: SavedSimulation }) {
  const router = useRouter();
  const loadScenario = useSimulationStore((state) => state.loadScenario);
  const supabase = createClient();

  function restore() {
    if (item.mode === "advanced") {
      if (!isAdvancedConfig(item.config)) {
        alert("저장된 고급 시뮬레이션 형식이 올바르지 않습니다.");
        return;
      }

      loadScenario(item.config);
      router.push("/advanced/loading");
      return;
    }

    window.localStorage.setItem(
      "firelife.simpleSavedConfig",
      JSON.stringify(item.config),
    );
    router.push("/simple?restore=saved");
  }

  async function remove() {
    const ok = window.confirm("저장된 시뮬레이션을 삭제할까요?");
    if (!ok) return;

    const { error } = await supabase
      .from("saved_simulations")
      .delete()
      .eq("id", item.id);
    if (error) {
      alert("삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-4 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <p className="truncate text-lg font-bold text-primary">{item.name}</p>
        <p className="mt-1 text-sm text-secondary">
          {item.mode === "advanced" ? "고급 백테스트" : "간단 백테스트"} ·{" "}
          {new Date(item.created_at).toLocaleDateString("ko-KR")}
        </p>
      </div>
      <div className="flex gap-2">
        <Button type="button" onClick={restore}>
          복원
        </Button>
        <Button type="button" variant="outline" onClick={remove}>
          삭제
        </Button>
      </div>
    </div>
  );
}

