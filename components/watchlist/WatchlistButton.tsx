"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { authUnavailableMessage, isAuthConfigured } from "@/lib/auth/status";
import { createClient } from "@/lib/supabase/client";

type WatchlistButtonProps = {
  symbol: string;
  className?: string;
};

export function WatchlistButton({ symbol, className }: WatchlistButtonProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isWatched, setIsWatched] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const authConfigured = isAuthConfigured();
  const supabase = useMemo(
    () => (authConfigured ? createClient() : null),
    [authConfigured],
  );

  useEffect(() => {
    if (!supabase) return undefined;

    let cancelled = false;
    supabase.auth.getUser().then(async ({ data }) => {
      if (cancelled) return;
      setUser(data.user);

      if (data.user) {
        const { data: watchItem } = await supabase
          .from("watchlist")
          .select("id")
          .eq("user_id", data.user.id)
          .eq("symbol", symbol)
          .maybeSingle();
        if (!cancelled) setIsWatched(Boolean(watchItem));
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setIsWatched(false);
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [supabase, symbol]);

  async function toggleWatchlist() {
    if (!supabase) {
      alert(authUnavailableMessage);
      return;
    }

    if (!user) {
      window.location.href = `/login?next=${encodeURIComponent(`/asset/${symbol}`)}`;
      return;
    }

    setIsPending(true);
    if (isWatched) {
      const { error } = await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", user.id)
        .eq("symbol", symbol);
      if (!error) setIsWatched(false);
    } else {
      const { error } = await supabase
        .from("watchlist")
        .insert({ user_id: user.id, symbol });
      if (!error) setIsWatched(true);
    }
    setIsPending(false);
  }

  return (
    <button
      type="button"
      onClick={toggleWatchlist}
      disabled={isPending}
      aria-label={isWatched ? "관심종목 해제" : "관심종목 추가"}
      className={
        className ??
        "inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-bold text-primary transition hover:bg-card-subtle focus:outline-none focus:ring-2 focus:ring-brand/35 disabled:opacity-60"
      }
    >
      <span className={isWatched ? "text-up" : "text-secondary"} aria-hidden="true">
        {isWatched ? "♥" : "♡"}
      </span>
      <span className="ml-1">{isWatched ? "관심종목" : "관심종목"}</span>
    </button>
  );
}

