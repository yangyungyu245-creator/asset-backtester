"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatKRW } from "@/lib/utils/format";

type ChartPoint = {
  period: number;
  date: string;
  contributions: number;
  value: number;
};

type AssetGrowthChartProps = {
  data: ChartPoint[];
};

function renderTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload?: ChartPoint }>;
  label?: string | number;
}) {
  const point = payload?.[0]?.payload;

  if (!active || !point) {
    return null;
  }

  const profit = point.value - point.contributions;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-medium">
      <p className="font-bold text-primary">{String(label ?? point.date)}</p>
      <div className="mt-2 grid gap-1 text-secondary">
        <p>평가금액 {formatKRW(point.value)}</p>
        <p>누적 원금 {formatKRW(point.contributions)}</p>
        <p className={profit >= 0 ? "text-up" : "text-down"}>
          수익 {profit >= 0 ? "+" : ""}
          {formatKRW(profit)}
        </p>
      </div>
    </div>
  );
}

export function AssetGrowthChart({ data }: AssetGrowthChartProps) {
  return (
    <div className="h-60 w-full md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="assetValue" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="period"
            tickFormatter={(period) => `${period}년`}
            tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(value) => formatKRW(Number(value))}
            tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip content={renderTooltip} wrapperStyle={{ outline: "none" }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#FF6B35"
            strokeWidth={2}
            fill="url(#assetValue)"
          />
          <Line
            type="monotone"
            dataKey="contributions"
            stroke="#94a3b8"
            strokeDasharray="5 5"
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
