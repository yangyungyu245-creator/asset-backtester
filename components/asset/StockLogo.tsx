"use client";

import { useState } from "react";
import { stockLogos } from "@/lib/data/stockLogos";

type StockLogoProps = {
  symbol: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

const badgeGradients = [
  ["#3B82F6", "#2563EB"],
  ["#10B981", "#059669"],
  ["#8B5CF6", "#7C3AED"],
  ["#F97316", "#EA580C"],
  ["#EC4899", "#DB2777"],
  ["#14B8A6", "#0D9488"],
  ["#6366F1", "#4F46E5"],
  ["#EF4444", "#DC2626"],
];

function hashSymbol(symbol: string) {
  return symbol.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function fallbackText(symbol: string) {
  const normalized = symbol.replace(/^[.^]+/, "").toUpperCase();
  if (!normalized) return "?";
  return /^[0-9]/.test(normalized) ? normalized.charAt(0) : normalized.slice(0, 2);
}

export function StockLogo({
  symbol,
  name,
  size = "md",
  className = "",
}: StockLogoProps) {
  const normalizedSymbol = symbol.toUpperCase().replace(".", "_") === "BRK_B"
    ? "BRK_B"
    : symbol.toUpperCase();
  const logoUrl = stockLogos[normalizedSymbol] ?? stockLogos[symbol.toUpperCase()];
  const [failed, setFailed] = useState(false);
  const classes = `${sizeClasses[size]} shrink-0 rounded-full ${className}`;
  const [from, to] = badgeGradients[hashSymbol(symbol) % badgeGradients.length];

  if (logoUrl && !failed) {
    return (
      <img
        src={logoUrl}
        alt={name || symbol}
        className={`${classes} bg-white object-cover ring-1 ring-border`}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      className={`${classes} inline-flex items-center justify-center font-bold text-white shadow-subtle ring-1 ring-white/15`}
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
      aria-hidden="true"
    >
      {fallbackText(symbol)}
    </span>
  );
}
