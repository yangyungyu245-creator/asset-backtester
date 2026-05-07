"use client";

type CurrencyToggleProps = {
  value: string;
  onToggle: () => void;
  ariaLabel: string;
  className?: string;
};

export function CurrencyToggle({
  value,
  onToggle,
  ariaLabel,
  className = "",
}: CurrencyToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={ariaLabel}
      className={`inline-flex h-9 items-center gap-1 rounded-md border border-border px-3 text-sm font-bold text-primary transition hover:bg-card-subtle ${className}`}
    >
      <span className="min-w-4 text-center">{value}</span>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m7 10 5-5 5 5" />
        <path d="m7 14 5 5 5-5" />
      </svg>
    </button>
  );
}
