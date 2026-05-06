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
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
};

function fallbackLetter(symbol: string) {
  return symbol.replace(/^[.^]+/, "").charAt(0).toUpperCase() || "?";
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
      className={`${classes} inline-flex items-center justify-center bg-card-subtle font-bold text-secondary ring-1 ring-border`}
      aria-hidden="true"
    >
      {fallbackLetter(symbol)}
    </span>
  );
}
