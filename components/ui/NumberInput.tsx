"use client";

import { formatInputNumber, parseFormattedNumber } from "@/lib/utils/format";

type NumberInputProps = {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
};

function normalizeNumericText(value: string) {
  let raw = value.replace(/,/g, "").replace(/[^\d.-]/g, "");

  if (raw.startsWith(".")) {
    raw = `0${raw}`;
  }

  const sign = raw.includes("-") ? "-" : "";
  raw = sign + raw.replace(/-/g, "");

  const [integerPart, ...decimalParts] = raw.slice(sign.length).split(".");
  const normalizedInteger =
    integerPart.length > 1 ? integerPart.replace(/^0+(?=\d)/, "") : integerPart;
  const decimalPart = decimalParts.length > 0 ? `.${decimalParts.join("")}` : "";

  return `${sign}${normalizedInteger}${decimalPart}`;
}

export function NumberInput({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  min,
  max,
  step,
  suffix = "원",
}: NumberInputProps) {
  const isInvalid =
    Boolean(error) ||
    (min !== undefined && value < min) ||
    (max !== undefined && value > max);

  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="text-sm font-semibold text-primary"
      >
        {label}
      </label>
      <div
        className={`mt-2 flex h-11 items-center rounded-md border bg-card px-3 transition focus-within:ring-2 focus-within:ring-brand/30 ${
          isInvalid
            ? "border-up"
            : "border-border"
        }`}
      >
        <input
          id={id}
          type="text"
          inputMode={
            min !== undefined && min < 0
              ? "decimal"
              : step && step < 1
                ? "decimal"
                : "numeric"
          }
          value={formatInputNumber(value)}
          placeholder={placeholder}
          onChange={(event) => {
            const normalized = normalizeNumericText(event.target.value);
            const nextValue = parseFormattedNumber(normalized);
            onChange(nextValue);
          }}
          step={step}
          className="min-w-0 flex-1 bg-transparent text-sm text-primary outline-none"
        />
        <span className="ml-2 text-sm text-secondary">
          {suffix}
        </span>
      </div>
      {error ? <p className="mt-1 text-xs text-up">{error}</p> : null}
    </div>
  );
}
