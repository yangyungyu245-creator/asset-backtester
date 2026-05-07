"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AssetMeta } from "@/lib/types/quotes";

export type Quote = AssetMeta;

export function useQuotes(symbols: string[], intervalMs = 60_000) {
  const normalizedSymbols = useMemo(
    () => Array.from(new Set(symbols.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean))).slice(0, 100),
    [symbols],
  );
  const symbolKey = normalizedSymbols.join(",");
  const [quotes, setQuotes] = useState<Map<string, Quote>>(new Map());
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const fetchQuotes = useCallback(async () => {
    if (normalizedSymbols.length === 0) {
      setQuotes(new Map());
      setLoading(false);
      setUpdatedAt(null);
      return;
    }

    try {
      const response = await fetch(`/api/quotes?symbols=${encodeURIComponent(symbolKey)}`);
      if (!response.ok) return;

      const data = (await response.json()) as {
        quotes?: Quote[];
        updatedAt?: string;
      };
      const nextQuotes = new Map<string, Quote>();
      (data.quotes ?? []).forEach((quote) => nextQuotes.set(quote.symbol.toUpperCase(), quote));
      setQuotes(nextQuotes);
      setUpdatedAt(data.updatedAt ?? null);
    } catch {
      // Keep the last successful quote map on transient polling failures.
    } finally {
      setLoading(false);
    }
  }, [normalizedSymbols.length, symbolKey]);

  useEffect(() => {
    setLoading(true);
    fetchQuotes();

    const timer = window.setInterval(fetchQuotes, intervalMs);
    return () => window.clearInterval(timer);
  }, [fetchQuotes, intervalMs]);

  return { quotes, loading, updatedAt };
}
