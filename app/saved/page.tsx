import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SavedSimulationCard } from "@/components/saved/SavedSimulationCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type SavedSimulation = {
  id: string;
  name: string;
  mode: "simple" | "advanced";
  config: Record<string, unknown>;
  created_at: string;
};

export const metadata: Metadata = {
  title: "저장한 시뮬레이션",
  description: "저장한 FIRE LIFE 시뮬레이션 설정을 복원합니다.",
};

export default async function SavedPage() {
  if (!isSupabaseConfigured()) {
    redirect("/login?next=/saved");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/saved");
  }

  const { data } = await supabase
    .from("saved_simulations")
    .select("id, name, mode, config, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as SavedSimulation[];

  return (
    <section className="grid gap-6 py-4 sm:py-8">
      <div>
        <h1 className="text-3xl font-bold text-primary sm:text-[40px]">
          저장한 시뮬레이션
        </h1>
        <p className="mt-3 text-sm leading-6 text-secondary">
          저장한 설정을 다시 불러와 결과를 확인할 수 있습니다.
        </p>
      </div>

      {rows.length > 0 ? (
        <Card rounded="2xl" padding="lg">
          <div className="divide-y divide-border">
            {rows.map((item) => (
              <SavedSimulationCard key={item.id} item={item} />
            ))}
          </div>
        </Card>
      ) : (
        <Card rounded="2xl" padding="lg" className="text-center">
          <p className="text-base font-bold text-primary">
            아직 저장한 시뮬레이션이 없습니다.
          </p>
          <p className="mt-2 text-sm leading-6 text-secondary">
            결과 화면에서 저장 버튼을 눌러 설정을 보관해 보세요.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <Button href="/simple" variant="outline">
              간단 모드
            </Button>
            <Button href="/advanced/dates">
              고급 모드
            </Button>
          </div>
        </Card>
      )}
    </section>
  );
}

