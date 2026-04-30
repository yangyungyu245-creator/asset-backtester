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

export function AssetGrowthChart({ data }: AssetGrowthChartProps) {
  return (
    <div className="h-60 w-full md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="assetValue" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
          <XAxis
            dataKey="period"
            tickFormatter={(period) => `${period}년`}
            tick={{ fill: "#737373", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(value) => formatKRW(Number(value))}
            tick={{ fill: "#737373", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip
            formatter={(value, name) => [
              formatKRW(Number(value)),
              name === "value" ? "평가금액" : "누적 원금",
            ]}
            labelFormatter={(_, payload) => {
              const point = payload?.[0]?.payload as ChartPoint | undefined;
              return point ? point.date : "";
            }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid rgba(148, 163, 184, 0.35)",
              background: "rgba(10, 10, 10, 0.92)",
              color: "#f5f5f5",
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
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
