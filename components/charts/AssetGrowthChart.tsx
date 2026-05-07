"use client";

import { ResultChart } from "@/components/charts/ResultChart";

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
    <ResultChart
      data={data.map((point) => ({
        date: `${2000 + point.period}-01-01`,
        value: point.value,
        contributions: point.contributions,
      }))}
      height={320}
      mobileHeight={240}
    />
  );
}
