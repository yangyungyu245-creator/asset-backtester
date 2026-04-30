type MetricCardProps = {
  label: string;
  value: string;
  helper: string;
  tone?: "default" | "positive" | "negative";
  featured?: boolean;
  index?: number;
};

export function MetricCard({
  label,
  value,
  helper,
  tone = "default",
  featured = false,
  index = 0,
}: MetricCardProps) {
  const valueColor =
    tone === "positive"
      ? "text-positive"
      : tone === "negative"
        ? "text-negative"
        : "text-neutral-950 dark:text-neutral-50";

  return (
    <article
      className="animate-[fadeIn_320ms_ease-out_both] rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md dark:border-white/10 dark:bg-[#1a1a1a] dark:hover:border-white/20"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      <p
        className={`mt-2 font-semibold tracking-normal ${valueColor} ${
          featured ? "text-3xl md:text-[32px]" : "text-2xl md:text-[28px]"
        }`}
      >
        {value}
      </p>
      <p className="mt-2 min-h-5 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
        {helper}
      </p>
    </article>
  );
}
