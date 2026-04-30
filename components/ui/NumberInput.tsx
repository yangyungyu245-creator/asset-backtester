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
  suffix = "원",
}: NumberInputProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
      >
        {label}
      </label>
      <div className="mt-2 flex h-11 items-center rounded-md border border-neutral-300 bg-white px-3 focus-within:ring-2 focus-within:ring-info dark:border-white/10 dark:bg-neutral-950">
        <input
          id={id}
          inputMode="numeric"
          value={formatInputNumber(value)}
          onChange={(event) => {
            const nextValue = parseFormattedNumber(event.target.value);
            onChange(Math.min(max ?? nextValue, Math.max(min ?? nextValue, nextValue)));
          }}
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
