"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { StockLogo } from "@/components/asset/StockLogo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createSearcher } from "@/lib/data/tickerSearch";
import { loadTickerIndex, type TickerMeta } from "@/lib/data/tickerIndex";
import {
  createPortfolio,
  deleteHolding,
  deletePortfolio,
  getHoldings,
  getPortfolios,
  updatePortfolio,
  upsertHolding,
} from "@/lib/portfolio/actions";
import { calculatePortfolioStats } from "@/lib/portfolio/stats";
import { authUnavailableMessage, isAuthConfigured } from "@/lib/auth/status";
import { createClient } from "@/lib/supabase/client";
import type {
  HoldingWithStats,
  Portfolio,
  PortfolioWithStats,
} from "@/lib/types/portfolio";

type PortfolioFormState = {
  name: string;
  description: string;
};

type HoldingFormState = {
  id?: string;
  symbol: string;
  shares: string;
  avgPrice: string;
  currency: string;
};

const emptyPortfolioForm: PortfolioFormState = {
  name: "",
  description: "",
};

const emptyHoldingForm: HoldingFormState = {
  symbol: "",
  shares: "",
  avgPrice: "",
  currency: "USD",
};

function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KRW" ? 0 : 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function getReturnClass(value: number) {
  if (value > 0) return "text-up";
  if (value < 0) return "text-down";
  return "text-secondary";
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 py-6">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-medium">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-lg font-bold text-secondary transition hover:bg-card-subtle hover:text-primary"
            aria-label="닫기"
          >
            x
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export function PortfolioManager() {
  const authConfigured = isAuthConfigured();
  const supabase = useMemo(
    () => (authConfigured ? createClient() : null),
    [authConfigured],
  );
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [portfolios, setPortfolios] = useState<PortfolioWithStats[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tickers, setTickers] = useState<TickerMeta[]>([]);
  const [portfolioForm, setPortfolioForm] =
    useState<PortfolioFormState>(emptyPortfolioForm);
  const [holdingForm, setHoldingForm] =
    useState<HoldingFormState>(emptyHoldingForm);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  const [showHoldingModal, setShowHoldingModal] = useState(false);
  const [tickerQuery, setTickerQuery] = useState("");

  const selectedPortfolio =
    portfolios.find((portfolio) => portfolio.id === selectedId) ?? portfolios[0] ?? null;
  const searcher = useMemo(() => createSearcher(tickers), [tickers]);
  const tickerResults = useMemo(() => {
    const query = tickerQuery.trim();
    if (!query) return tickers.filter((ticker) => ticker.category.includes("etf")).slice(0, 8);
    return searcher.search(query).slice(0, 8).map((result) => result.item);
  }, [searcher, tickerQuery, tickers]);

  async function refreshPortfolios(nextSelectedId?: string) {
    setLoading(true);
    setError(null);

    try {
      const rows = await getPortfolios();
      const stats = await Promise.all(
        rows.map(async (portfolio) => {
          const holdings = await getHoldings(portfolio.id);
          return calculatePortfolioStats(portfolio, holdings);
        }),
      );
      setPortfolios(stats);
      setSelectedId(nextSelectedId ?? selectedId ?? stats[0]?.id ?? null);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "포트폴리오를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authConfigured || !supabase) {
      setError(authUnavailableMessage);
      setLoading(false);
      setAuthChecked(true);
      return;
    }

    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUser(data.user);
      setAuthChecked(true);
      if (!data.user) {
        window.location.href = `/login?next=${encodeURIComponent("/portfolio")}`;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [authConfigured, supabase]);

  useEffect(() => {
    if (!user) return;
    refreshPortfolios();
    loadTickerIndex().then(setTickers).catch(() => setTickers([]));
  }, [user]);

  function openCreatePortfolio() {
    setEditingPortfolio(null);
    setPortfolioForm(emptyPortfolioForm);
    setShowPortfolioModal(true);
  }

  function openEditPortfolio(portfolio: PortfolioWithStats) {
    setEditingPortfolio(portfolio);
    setPortfolioForm({
      name: portfolio.name,
      description: portfolio.description ?? "",
    });
    setShowPortfolioModal(true);
  }

  function openCreateHolding() {
    setHoldingForm(emptyHoldingForm);
    setTickerQuery("");
    setShowHoldingModal(true);
  }

  function openEditHolding(holding: HoldingWithStats) {
    setHoldingForm({
      id: holding.id,
      symbol: holding.symbol,
      shares: String(holding.shares),
      avgPrice: String(holding.avg_price),
      currency: holding.currency,
    });
    setTickerQuery(holding.symbol);
    setShowHoldingModal(true);
  }

  async function submitPortfolio(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = portfolioForm.name.trim();
    if (!name) return;

    setSaving(true);
    setError(null);
    try {
      if (editingPortfolio) {
        await updatePortfolio(
          editingPortfolio.id,
          name,
          portfolioForm.description.trim(),
        );
        await refreshPortfolios(editingPortfolio.id);
      } else {
        const created = await createPortfolio(name, portfolioForm.description.trim());
        await refreshPortfolios(created.id);
      }
      setShowPortfolioModal(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "포트폴리오를 저장하지 못했습니다.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitHolding(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPortfolio) return;

    const symbol = holdingForm.symbol.trim().toUpperCase();
    const shares = Number(holdingForm.shares);
    const avgPrice = Number(holdingForm.avgPrice);
    if (!symbol || !Number.isFinite(shares) || shares <= 0 || !Number.isFinite(avgPrice)) {
      setError("종목, 보유 주수, 평균 매수가를 확인해주세요.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await upsertHolding(
        selectedPortfolio.id,
        symbol,
        shares,
        Math.max(avgPrice, 0),
        holdingForm.currency,
      );
      await refreshPortfolios(selectedPortfolio.id);
      setShowHoldingModal(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "보유 종목을 저장하지 못했습니다.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removePortfolio(portfolio: PortfolioWithStats) {
    if (!window.confirm(`${portfolio.name} 포트폴리오를 삭제할까요?`)) return;
    setSaving(true);
    try {
      await deletePortfolio(portfolio.id);
      await refreshPortfolios(portfolios.find((item) => item.id !== portfolio.id)?.id);
    } finally {
      setSaving(false);
    }
  }

  async function removeHolding(holding: HoldingWithStats) {
    if (!window.confirm(`${holding.symbol} 보유 종목을 삭제할까요?`)) return;
    setSaving(true);
    try {
      await deleteHolding(holding.id);
      await refreshPortfolios(selectedPortfolio?.id);
    } finally {
      setSaving(false);
    }
  }

  if (!authChecked || loading) {
    return (
      <section className="py-8">
        <Card rounded="2xl" padding="lg">
          <p className="text-sm font-semibold text-secondary">
            포트폴리오를 불러오는 중입니다.
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section className="grid gap-6 py-4 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary sm:text-[40px]">
            내 포트폴리오
          </h1>
          <p className="mt-3 text-base leading-7 text-secondary">
            실제 보유 종목, 수익률, 예상 배당금을 한 곳에서 관리합니다.
          </p>
        </div>
        <Button type="button" onClick={openCreatePortfolio}>
          새 포트폴리오
        </Button>
      </div>

      {error ? (
        <div className="rounded-2xl bg-up-bg p-4 text-sm font-semibold text-up">
          {error}
        </div>
      ) : null}

      {portfolios.length === 0 ? (
        <Card rounded="2xl" padding="lg" className="text-center">
          <p className="text-lg font-bold text-primary">
            아직 포트폴리오가 없습니다.
          </p>
          <p className="mt-2 text-sm text-secondary">
            첫 포트폴리오를 만들고 보유 종목을 추가해보세요.
          </p>
          <Button type="button" className="mt-5" onClick={openCreatePortfolio}>
            포트폴리오 만들기
          </Button>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <div className="grid gap-3 self-start lg:sticky lg:top-24">
            {portfolios.map((portfolio) => (
              <button
                key={portfolio.id}
                type="button"
                onClick={() => setSelectedId(portfolio.id)}
                className={`rounded-2xl border p-5 text-left shadow-subtle transition ${
                  selectedPortfolio?.id === portfolio.id
                    ? "border-brand bg-brand-bg"
                    : "border-border bg-card hover:bg-card-subtle"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold text-primary">
                      {portfolio.name}
                    </p>
                    <p className="mt-1 text-xs text-secondary">
                      {portfolio.holdings.length}개 종목
                    </p>
                  </div>
                  <span className="text-sm font-bold text-brand">상세</span>
                </div>
                <p className="mt-4 text-2xl font-bold tabular-nums text-primary">
                  {formatCurrency(portfolio.totalValue)}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm font-bold">
                  <span className={getReturnClass(portfolio.totalReturn)}>
                    {formatCurrency(portfolio.totalReturn)} (
                    {formatPercent(portfolio.totalReturnPercent)})
                  </span>
                  <span className="text-success">
                    월 배당 {formatCurrency(portfolio.monthlyDividend)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {selectedPortfolio ? (
            <Card rounded="2xl" padding="lg">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-primary">
                    {selectedPortfolio.name}
                  </h2>
                  {selectedPortfolio.description ? (
                    <p className="mt-2 text-sm text-secondary">
                      {selectedPortfolio.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openEditPortfolio(selectedPortfolio)}
                  >
                    편집
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={saving}
                    onClick={() => removePortfolio(selectedPortfolio)}
                  >
                    삭제
                  </Button>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Metric label="총 자산" value={formatCurrency(selectedPortfolio.totalValue)} />
                <Metric label="총 원금" value={formatCurrency(selectedPortfolio.totalCost)} />
                <Metric
                  label="총 수익"
                  value={`${formatCurrency(selectedPortfolio.totalReturn)} (${formatPercent(
                    selectedPortfolio.totalReturnPercent,
                  )})`}
                  valueClass={getReturnClass(selectedPortfolio.totalReturn)}
                />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Metric
                  label="예상 연간 배당"
                  value={formatCurrency(selectedPortfolio.annualDividend)}
                  valueClass="text-success"
                />
                <Metric
                  label="예상 월 배당"
                  value={formatCurrency(selectedPortfolio.monthlyDividend)}
                  valueClass="text-success"
                />
              </div>

              <div className="mt-8 flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-primary">종목별 보유 현황</h3>
                <Button type="button" variant="ghost" size="sm" onClick={openCreateHolding}>
                  종목 추가
                </Button>
              </div>

              {selectedPortfolio.holdings.length === 0 ? (
                <div className="mt-4 rounded-xl bg-card-subtle p-6 text-center">
                  <p className="text-sm font-bold text-primary">
                    보유 종목을 추가하면 평가금액과 배당금이 계산됩니다.
                  </p>
                </div>
              ) : (
                <div className="mt-4 divide-y divide-border">
                  {selectedPortfolio.holdings.map((holding) => (
                    <HoldingRow
                      key={holding.id}
                      holding={holding}
                      onEdit={() => openEditHolding(holding)}
                      onDelete={() => removeHolding(holding)}
                    />
                  ))}
                </div>
              )}

              <div className="mt-8">
                <Button
                  href={`/advanced/dates?portfolio=${encodeURIComponent(
                    selectedPortfolio.id,
                  )}`}
                  variant="outline"
                >
                  이 포트폴리오로 백테스트
                </Button>
              </div>
            </Card>
          ) : null}
        </div>
      )}

      {showPortfolioModal ? (
        <Modal
          title={editingPortfolio ? "포트폴리오 편집" : "새 포트폴리오"}
          onClose={() => setShowPortfolioModal(false)}
        >
          <form className="grid gap-4" onSubmit={submitPortfolio}>
            <label className="grid gap-2 text-sm font-bold text-primary">
              이름
              <input
                value={portfolioForm.name}
                onChange={(event) =>
                  setPortfolioForm((form) => ({ ...form, name: event.target.value }))
                }
                className="h-11 rounded-md border border-border bg-card px-3 text-base font-medium outline-none focus:ring-2 focus:ring-brand/30"
                placeholder="미국 성장주"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-primary">
              설명
              <textarea
                value={portfolioForm.description}
                onChange={(event) =>
                  setPortfolioForm((form) => ({
                    ...form,
                    description: event.target.value,
                  }))
                }
                className="min-h-24 rounded-md border border-border bg-card px-3 py-2 text-base font-medium outline-none focus:ring-2 focus:ring-brand/30"
                placeholder="장기 성장을 위한 핵심 종목"
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowPortfolioModal(false)}
              >
                취소
              </Button>
              <Button type="submit" disabled={saving || !portfolioForm.name.trim()}>
                저장
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {showHoldingModal ? (
        <Modal
          title={holdingForm.id ? "종목 수정" : "종목 추가"}
          onClose={() => setShowHoldingModal(false)}
        >
          <form className="grid gap-4" onSubmit={submitHolding}>
            <label className="grid gap-2 text-sm font-bold text-primary">
              종목 검색
              <input
                value={tickerQuery}
                onChange={(event) => {
                  setTickerQuery(event.target.value);
                  setHoldingForm((form) => ({
                    ...form,
                    symbol: event.target.value.toUpperCase(),
                  }));
                }}
                className="h-11 rounded-md border border-border bg-card px-3 text-base font-medium outline-none focus:ring-2 focus:ring-brand/30"
                placeholder="NVDA, SCHD, BND"
              />
            </label>
            {tickerResults.length > 0 ? (
              <div className="grid max-h-52 gap-2 overflow-y-auto rounded-xl bg-card-subtle p-2">
                {tickerResults.map((ticker) => (
                  <button
                    key={ticker.ticker}
                    type="button"
                    onClick={() => {
                      setHoldingForm((form) => ({
                        ...form,
                        symbol: ticker.ticker,
                        currency: ticker.currency,
                      }));
                      setTickerQuery(ticker.ticker);
                    }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-card"
                  >
                    <StockLogo symbol={ticker.ticker} name={ticker.name_ko || ticker.name} />
                    <span className="min-w-0">
                      <span className="block font-bold text-primary">{ticker.ticker}</span>
                      <span className="block truncate text-xs text-secondary">
                        {ticker.name_ko || ticker.name}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-primary">
                보유 주수
                <input
                  type="number"
                  min="0"
                  step="0.000001"
                  value={holdingForm.shares}
                  onChange={(event) =>
                    setHoldingForm((form) => ({ ...form, shares: event.target.value }))
                  }
                  className="h-11 rounded-md border border-border bg-card px-3 text-base font-medium outline-none focus:ring-2 focus:ring-brand/30"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-primary">
                평균 매수가
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={holdingForm.avgPrice}
                  onChange={(event) =>
                    setHoldingForm((form) => ({ ...form, avgPrice: event.target.value }))
                  }
                  className="h-11 rounded-md border border-border bg-card px-3 text-base font-medium outline-none focus:ring-2 focus:ring-brand/30"
                />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-bold text-primary">
              통화
              <select
                value={holdingForm.currency}
                onChange={(event) =>
                  setHoldingForm((form) => ({ ...form, currency: event.target.value }))
                }
                className="h-11 rounded-md border border-border bg-card px-3 text-base font-medium outline-none focus:ring-2 focus:ring-brand/30"
              >
                <option value="USD">USD</option>
                <option value="KRW">KRW</option>
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowHoldingModal(false)}>
                취소
              </Button>
              <Button type="submit" disabled={saving || !holdingForm.symbol.trim()}>
                저장
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}

function Metric({
  label,
  value,
  valueClass = "text-primary",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl bg-card-subtle p-4">
      <p className="text-xs font-bold text-secondary">{label}</p>
      <p className={`mt-2 text-lg font-bold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  );
}

function HoldingRow({
  holding,
  onEdit,
  onDelete,
}: {
  holding: HoldingWithStats;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="grid gap-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="min-w-0">
        <div className="flex items-start gap-3">
          <StockLogo symbol={holding.symbol} name={holding.name} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/asset/${encodeURIComponent(holding.symbol)}`}
                className="font-bold text-primary underline-offset-4 hover:text-brand hover:underline"
              >
                {holding.symbol}
              </Link>
              <span className="truncate text-sm font-semibold text-primary">
                {holding.name}
              </span>
            </div>
            <p className="mt-1 text-sm text-secondary">
              {holding.shares.toLocaleString("ko-KR")}주 · 평균{" "}
              {formatCurrency(holding.avg_price, holding.currency)}
            </p>
            <p className="mt-2 text-sm text-secondary">
              현재가 {formatCurrency(holding.currentPrice, holding.currency)} · 평가{" "}
              {formatCurrency(holding.currentValue, holding.currency)}
            </p>
            <p className="mt-1 text-sm">
              <span className={getReturnClass(holding.returnAmount)}>
                {formatCurrency(holding.returnAmount, holding.currency)} (
                {formatPercent(holding.returnPercent)})
              </span>
              <span className="ml-2 text-success">
                연 배당 {formatCurrency(holding.annualDividendPerShare, holding.currency)}
                /주 · {formatPercent(holding.dividendYield)}
              </span>
            </p>
          </div>
        </div>
      </div>
      <div className="flex gap-2 md:justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onEdit}>
          수정
        </Button>
        <Button type="button" variant="danger" size="sm" onClick={onDelete}>
          삭제
        </Button>
      </div>
    </div>
  );
}
