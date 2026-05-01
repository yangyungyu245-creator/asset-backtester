"use client";

type RangeWithNumberProps = {
  id: string;
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  error?: string;
};

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

export function RangeWithNumber({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  error,
}: RangeWithNumberProps) {
  const update = (nextValue: number) => onChange(clamp(nextValue, min, max));

  return (
    <div>
      {label ? (
        <label
          htmlFor={`${id}-range`}
          className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
        >
          {label}
        </label>
      ) : null}
      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_6.5rem] items-center gap-3">
        <input
          id={`${id}-range`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => update(Number(event.target.value))}
          className="min-w-0 accent-info"
        />
        <label className="flex h-11 min-w-0 items-center rounded-md border border-neutral-300 bg-white px-3 focus-within:ring-2 focus-within:ring-info dark:border-white/10 dark:bg-neutral-950">
          <input
            id={id}
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => update(Number(event.target.value))}
            className="min-w-0 flex-1 bg-transparent text-right text-sm text-neutral-950 outline-none dark:text-neutral-50"
          />
          {unit ? (
            <span className="ml-2 shrink-0 text-sm text-neutral-500 dark:text-neutral-400">
              {unit}
            </span>
          ) : null}
        </label>
      </div>
      {error ? <p className="mt-1 text-xs text-negative">{error}</p> : null}
    </div>
  );
}
