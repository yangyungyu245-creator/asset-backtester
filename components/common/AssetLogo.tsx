"use client";

import { useState } from "react";
import { stockDomains } from "@/lib/data/stock-logos";

export type AssetLogoType = "stock" | "etf" | "index" | "fx" | "crypto" | "other";

type AssetLogoProps = {
  symbol: string;
  name?: string;
  assetType?: AssetLogoType;
  size?: "sm" | "md" | "lg" | number;
  className?: string;
};

const LOGO_DEV_TOKEN = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;

const sizeMap = {
  sm: 32,
  md: 40,
  lg: 56,
};

function normalizeSymbol(symbol: string) {
  const upper = symbol.trim().toUpperCase();
  return upper.replace(".", "_") === "BRK_B" ? "BRK.B" : upper;
}

function getLogoUrl(symbol: string): string | null {
  const normalized = normalizeSymbol(symbol);
  const domain = stockDomains[normalized] ?? stockDomains[symbol.trim().toUpperCase()];
  if (!domain) return null;

  if (LOGO_DEV_TOKEN) {
    const params = new URLSearchParams({
      token: LOGO_DEV_TOKEN,
      size: "80",
      retina: "true",
      format: "png",
    });

    return `https://img.logo.dev/${encodeURIComponent(domain)}?${params.toString()}`;
  }

  return `https://logo.clearbit.com/${domain}`;
}

const BADGE_COLORS = [
  ["#3B82F6", "#2563EB"],
  ["#10B981", "#059669"],
  ["#8B5CF6", "#7C3AED"],
  ["#F97316", "#EA580C"],
  ["#EC4899", "#DB2777"],
  ["#14B8A6", "#0D9488"],
  ["#6366F1", "#4F46E5"],
  ["#EF4444", "#DC2626"],
] as const;

function getHashColor(symbol: string) {
  const hash = symbol
    .trim()
    .toUpperCase()
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return BADGE_COLORS[hash % BADGE_COLORS.length];
}

function getBadgeText(symbol: string): string {
  const upper = symbol.trim().toUpperCase();

  if (upper.startsWith("^")) {
    const map: Record<string, string> = {
      "^GSPC": "SP",
      "^IXIC": "NQ",
      "^DJI": "DJ",
      "^KS11": "KS",
      "^KQ11": "KQ",
      "^VIX": "VX",
    };
    return map[upper] || upper.slice(1, 3).toUpperCase();
  }

  if (upper.includes("=")) return upper.split("=")[0].slice(0, 2);
  if (/^\d/.test(upper)) return upper.slice(0, 2);
  return upper.slice(0, 2);
}

function resolveSize(size: AssetLogoProps["size"]) {
  return typeof size === "number" ? size : sizeMap[size ?? "md"];
}

export function AssetLogo({
  symbol,
  name,
  size = "md",
  className = "",
}: AssetLogoProps) {
  const [useFallback, setUseFallback] = useState(false);
  const pixelSize = resolveSize(size);
  const logoUrl = getLogoUrl(symbol);

  if (logoUrl && !useFallback) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={name || symbol}
        width={pixelSize}
        height={pixelSize}
        className={`shrink-0 rounded-full bg-white object-cover p-0.5 shadow-subtle ring-1 ring-border ${className}`}
        style={{ width: pixelSize, height: pixelSize, minWidth: pixelSize }}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setUseFallback(true)}
      />
    );
  }

  const [color1, color2] = getHashColor(symbol);
  const text = getBadgeText(symbol);
  const fontSize = pixelSize < 32 ? 10 : pixelSize < 48 ? 12 : 14;

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-subtle ring-1 ring-white/15 ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        minWidth: pixelSize,
        background: `linear-gradient(135deg, ${color1}, ${color2})`,
        fontSize,
      }}
      aria-label={name || symbol}
      role="img"
    >
      {text}
    </div>
  );
}

export default AssetLogo;
