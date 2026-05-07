"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/Button";
import {
  createPortfolio,
  getPortfolios,
  upsertHolding,
} from "@/lib/portfolio/actions";
import { authUnavailableMessage, isAuthConfigured } from "@/lib/auth/status";
import { createClient } from "@/lib/supabase/client";
import type { Portfolio } from "@/lib/types/portfolio";

type AddToPortfolioButtonProps = {
  symbol: string;
  currentPrice?: number | null;
  currency?: string | null;
  className?: string;
};

export function AddToPortfolioButton({
  symbol,
  currentPrice,
  currency = "USD",
  className,
}: AddToPortfolioButtonProps) {
  const authConfigured = isAuthConfigured();
  const supabase = useMemo(
    () => (authConfigured ? createClient() : null),
    [authConfigured],
  );
  const [user, setUser] = useState<User | null>(null);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState("");
  const [createNew, setCreateNew] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [shares, setShares] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        getPortfolios()
          .then((items) => {
            setPortfolios(items);
            setSelectedPortfolioId(items[0]?.id ?? "");
          })
          .catch(() => setPortfolios([]));
      }
    });
  }, [supabase]);

  useEffect(() => {
    if (typeof currentPrice === "number" && Number.isFinite(currentPrice)) {
      setAvgPrice(String(Number(currentPrice.toFixed(2))));
    }
  }, [currentPrice]);

  if (!authConfigured || !user) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericShares = Number(shares);
    const numericAvgPrice = Number(avgPrice);
    if (!Number.isFinite(numericShares) || numericShares <= 0) {
      setMessage("보유 주수를 확인해주세요.");
      return;
    }
    if (!Number.isFinite(numericAvgPrice) || numericAvgPrice < 0) {
      setMessage("평균 매수가를 확인해주세요.");
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      let portfolioId = selectedPortfolioId;
      if (createNew) {
        const name = newPortfolioName.trim();
        if (!name) {
          setMessage("새 포트폴리오 이름을 입력해주세요.");
          return;
        }
        const created = await createPortfolio(name);
        portfolioId = created.id;
      }

      if (!portfolioId) {
        setMessage("포트폴리오를 선택해주세요.");
        return;
      }

      await upsertHolding(
        portfolioId,
        symbol,
        numericShares,
        numericAvgPrice,
        currency || "USD",
      );
      setMessage(`${symbol}을 포트폴리오에 추가했습니다.`);
      setOpen(false);
      setShares("");
      if (createNew) {
        const items = await getPortfolios();
        setPortfolios(items);
        setSelectedPortfolioId(portfolioId);
        setCreateNew(false);
        setNewPortfolioName("");
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "포트폴리오에 추가하지 못했습니다.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (!supabase) {
            alert(authUnavailableMessage);
            return;
          }
          setOpen(true);
        }}
        className={
          className ??
          "inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-bold text-primary transition hover:bg-card-subtle focus:outline-none focus:ring-2 focus:ring-brand/35"
        }
      >
        + 포트폴리오
      </button>
      {message && !open ? (
        <span className="text-xs font-bold text-brand">{message}</span>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-medium">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-primary">
                포트폴리오에 {symbol} 추가
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-1 text-lg font-bold text-secondary transition hover:bg-card-subtle hover:text-primary"
                aria-label="닫기"
              >
                x
              </button>
            </div>

            <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <p className="text-sm font-bold text-primary">포트폴리오 선택</p>
                {portfolios.map((portfolio) => (
                  <label
                    key={portfolio.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl bg-card-subtle p-3"
                  >
                    <input
                      type="radio"
                      checked={!createNew && selectedPortfolioId === portfolio.id}
                      onChange={() => {
                        setCreateNew(false);
                        setSelectedPortfolioId(portfolio.id);
                      }}
                      className="accent-brand"
                    />
                    <span className="font-bold text-primary">{portfolio.name}</span>
                  </label>
                ))}
                <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-card-subtle p-3">
                  <input
                    type="radio"
                    checked={createNew}
                    onChange={() => setCreateNew(true)}
                    className="accent-brand"
                  />
                  <span className="font-bold text-primary">새 포트폴리오 만들기</span>
                </label>
              </div>

              {createNew ? (
                <label className="grid gap-2 text-sm font-bold text-primary">
                  새 포트폴리오 이름
                  <input
                    value={newPortfolioName}
                    onChange={(event) => setNewPortfolioName(event.target.value)}
                    className="h-11 rounded-md border border-border bg-card px-3 text-base font-medium outline-none focus:ring-2 focus:ring-brand/30"
                    placeholder="미국 성장주"
                  />
                </label>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-primary">
                  보유 주수
                  <input
                    type="number"
                    min="0"
                    step="0.000001"
                    value={shares}
                    onChange={(event) => setShares(event.target.value)}
                    className="h-11 rounded-md border border-border bg-card px-3 text-base font-medium outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold text-primary">
                  평균 매수가
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={avgPrice}
                    onChange={(event) => setAvgPrice(event.target.value)}
                    className="h-11 rounded-md border border-border bg-card px-3 text-base font-medium outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </label>
              </div>

              {message ? (
                <p className="rounded-xl bg-card-subtle p-3 text-sm font-semibold text-secondary">
                  {message}
                </p>
              ) : null}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  취소
                </Button>
                <Button type="submit" disabled={saving}>
                  추가
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
