"use client";

import { formatInputNumber, parseFormattedNumber } from "@/lib/utils/format";

type NumberInputProps = {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
};

export function NumberInput({
  id,
  label,
  value,
  onChange,
  error,
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
    <div>
      <label
        htmlFor={id}
        className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
      >
        {label}
      </label>
      <div
        className={`mt-2 flex h-11 items-center rounded-md border bg-white px-3 focus-within:ring-2 focus-within:ring-info dark:bg-neutral-950 ${
          isInvalid
            ? "border-negative"
            : "border-neutral-300 dark:border-white/10"
        }`}
      >
        <input
          id={id}
          inputMode={step && step < 1 ? "decimal" : "numeric"}
          value={formatInputNumber(value)}
          onChange={(event) => {
            const nextValue = parseFormattedNumber(event.target.value);
            onChange(nextValue);
          }}
          step={step}
          className="min-w-0 flex-1 bg-transparent text-sm text-neutral-950 outline-none dark:text-neutral-50"
        />
        <span className="ml-2 text-sm text-neutral-500 dark:text-neutral-400">
          {suffix}
        </span>
      </div>
      {error ? <p className="mt-1 text-xs text-negative">{error}</p> : null}
    </div>
  );
}
