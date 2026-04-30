import Fuse from "fuse.js";
import type { TickerMeta } from "@/lib/data/tickerIndex";

export function createSearcher(tickers: TickerMeta[]) {
  return new Fuse(tickers, {
    keys: ["ticker", "name", "name_ko"],
    threshold: 0.3,
    includeScore: true,
    ignoreLocation: true,
  });
}
