"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { authUnavailableMessage, isAuthConfigured } from "@/lib/auth/status";
import { createClient } from "@/lib/supabase/client";

type SaveSimulationButtonProps = {
  label: string;
  mode: "simple" | "advanced";
  config: Record<string, unknown>;
  defaultName: string;
  className?: string;
};

export function SaveSimulationButton({
  label,
  mode,
  config,
  defaultName,
  className,
}: SaveSimulationButtonProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isPending, setIsPending] = useState(false);
  const authConfigured = isAuthConfigured();
  const supabase = useMemo(
    () => (authConfigured ? createClient() : null),
    [authConfigured],
  );

  useEffect(() => {
    if (!supabase) return undefined;

    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => data.subscription.unsubscribe();
  }, [supabase]);

  async function saveSimulation() {
    if (!supabase) {
      alert(authUnavailableMessage);
      return;
    }

    if (!user) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    const name = window.prompt("저장 이름을 입력하세요.", defaultName)?.trim();
    if (!name) return;

    setIsPending(true);
    const { error } = await supabase.from("saved_simulations").insert({
      user_id: user.id,
      name,
      mode,
      config,
    });
    setIsPending(false);

    if (error) {
      alert("저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    alert("시뮬레이션 설정을 저장했습니다.");
  }

  return (
    <button
      type="button"
      onClick={saveSimulation}
      disabled={isPending}
      className={
        className ??
        "inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-bold text-primary transition hover:bg-card-subtle focus:outline-none focus:ring-2 focus:ring-brand/35 disabled:opacity-60"
      }
    >
      {isPending ? "저장 중..." : label}
    </button>
  );
}

