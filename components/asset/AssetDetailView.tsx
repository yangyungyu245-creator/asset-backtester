"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactKRW, formatPercentValue } from "@/components/result/format";
import { SaveActionButton } from "@/components/saved/SaveActionButton";

type AssetDetail = {
  symbol: string;
  name: string;
  nameKo: string;
  assetType: string;
  currency: string;
  exchange: string;
  latestPrice: number | null;
  change: number | null;
  changePercent: number | null;
  chart: Array<{ date: string; close: number }>;
  chartSource: "local" | "yahoo" | "none";
  fields: {
    marketCap: number | null;
    dividendYield: number | null;
    aum: number | null;
    nav: number | null;
    premiumDiscount: number | null;
    expenseRatio: number | null;
    underlyingIndex: string | null;
    issuer: string | null;
    peRatio: number | null;
  };
  warnings: string[];
};

type AssetDetailViewProps = {
  symbol: string;
};

const periods = [
  { value: "1m", label: "1개월" },
  { value: "3m", label: "3개월" },
  { value: "6m", label: "6개월" },
  { value: "1y", label: "1년" },
  { value: "5y", label: "5년" },
  { value: "max", label: "전체" },
];

function formatNumber(value: number | null, currency?: string) {
  if (value === null || !Number.isFinite(value)) {
    return "데이터 준비 중";
  }

  if (currency === "KRW") {
    return formatCompactKRW(value);
  }

  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatLargeNumber(value: number | null, currency?: string) {
  if (value === null || !Number.isFinite(value)) {
    return "데이터 준비 중";
  }

  if (currency === "KRW") {
    return formatCompactKRW(value);
  }

  return `${new Intl.NumberFormat("ko-KR", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value)} ${currency ?? ""}`.trim();
}

function formatPercent(value: number | null, digits = 2) {
  if (value === null || !Number.isFinite(value)) {
    return "데이터 준비 중";
  }

  return formatPercentValue(value, digits);
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-neutral-50 p-4 dark:bg-white/[0.04]">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-neutral-950 dark:text-neutral-50">
        {value}
      </p>
    </div>
  );
}

export function AssetDetailView({ symbol }: AssetDetailViewProps) {
  const [period, setPeriod] = useState("1y");
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAsset() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/asset/${encodeURIComponent(symbol)}?period=${period}`,
          { cache: "no-store" },
        );
        const payload = (await response.json()) as AssetDetail;

        if (!response.ok) {
          throw new Error("자산 정보를 불러오지 못했습니다.");
        }

        if (!cancelled) {
          setAsset(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "자산 정보를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadAsset();

    return () => {
      cancelled = true;
    };
  }, [period, symbol]);

  const changeClassName = useMemo(() => {
    const change = asset?.changePercent ?? 0;

    if (change > 0) {
      return "text-red-500";
    }

    if (change < 0) {
      return "text-blue-500";
    }

    return "text-neutral-500 dark:text-neutral-400";
  }, [asset?.changePercent]);

  return (
    <section className="grid gap-6 py-4 sm:py-8">
      <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div>
            <p className="text-sm text-info">{asset?.assetType ?? "자산 상세"}</p>
            <h1 className="mt-2 break-words text-3xl font-semibold text-neutral-950 dark:text-neutral-50">
              {asset?.nameKo || asset?.name || symbol}
            </h1>
            <p className="mt-2 font-mono text-sm text-neutral-500 dark:text-neutral-400">
              {symbol}
            </p>
            <div className="mt-4">
              <SaveActionButton label="관심 종목 추가" />
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
              {formatNumber(asset?.latestPrice ?? null, asset?.currency)}
            </p>
            <p className={`mt-1 text-sm font-medium ${changeClassName}`}>
              {formatNumber(asset?.change ?? null, asset?.currency)} (
              {formatPercent(asset?.changePercent ?? null)})
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
              가격 차트
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {asset?.chartSource === "local"
                ? "FIRE LIFE 보유 가격 데이터를 사용합니다."
                : asset?.chartSource === "yahoo"
                  ? "Yahoo Finance 차트 데이터를 사용합니다."
                  : "차트 데이터가 아직 준비되지 않았습니다."}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:flex">
            {periods.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setPeriod(item.value)}
                className={`h-9 rounded-md border px-3 text-xs font-medium transition ${
                  period === item.value
                    ? "border-info bg-info text-white"
                    : "border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-white/10 dark:text-neutral-200 dark:hover:bg-white/5"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 h-80">
          {isLoading ? (
            <div className="h-full animate-pulse rounded-lg bg-neutral-100 dark:bg-white/5" />
          ) : asset && asset.chart.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={asset.chart} margin={{ left: 0, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="asset-detail-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} minTickGap={28} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  width={72}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("ko-KR", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(Number(value))
                  }
                />
                <Tooltip
                  formatter={(value) => [
                    formatNumber(Number(value), asset.currency),
                    "가격",
                  ]}
                  labelFormatter={(label) => `날짜 ${label}`}
                />
                <Area
                  dataKey="close"
                  type="monotone"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#asset-detail-fill)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center rounded-lg bg-neutral-50 text-sm text-neutral-500 dark:bg-white/[0.04] dark:text-neutral-400">
              차트 데이터 준비 중
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
        <h2 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
          기본 정보
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DetailField label="자산 유형" value={asset?.assetType ?? "데이터 준비 중"} />
          <DetailField label="거래소" value={asset?.exchange ?? "데이터 준비 중"} />
          <DetailField label="통화" value={asset?.currency ?? "데이터 준비 중"} />
          <DetailField
            label="시가총액"
            value={formatLargeNumber(asset?.fields.marketCap ?? null, asset?.currency)}
          />
          <DetailField
            label="배당수익률"
            value={formatPercent(asset?.fields.dividendYield ?? null)}
          />
          <DetailField
            label="운용자산"
            value={formatLargeNumber(asset?.fields.aum ?? null, asset?.currency)}
          />
          <DetailField
            label="순자산가치(NAV)"
            value={formatNumber(asset?.fields.nav ?? null, asset?.currency)}
          />
          <DetailField
            label="괴리율"
            value={formatPercent(asset?.fields.premiumDiscount ?? null)}
          />
          <DetailField
            label="운용보수"
            value={formatPercent(asset?.fields.expenseRatio ?? null)}
          />
          <DetailField
            label="기초지수"
            value={asset?.fields.underlyingIndex ?? "데이터 준비 중"}
          />
          <DetailField
            label="운용사"
            value={asset?.fields.issuer ?? "데이터 준비 중"}
          />
          <DetailField
            label="PER"
            value={
              asset?.fields.peRatio
                ? asset.fields.peRatio.toFixed(2)
                : "데이터 준비 중"
            }
          />
        </div>
        {error ? <p className="mt-4 text-sm text-negative">{error}</p> : null}
        {asset?.warnings.map((warning) => (
          <p key={warning} className="mt-4 text-sm text-info">
            {warning}
          </p>
        ))}
      </section>
    </section>
  );
}
