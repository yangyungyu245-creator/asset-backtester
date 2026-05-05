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
      ? "text-up"
      : tone === "negative"
        ? "text-down"
        : "text-primary";

  return (
    <article
      className={`animate-[fadeIn_320ms_ease-out_both] rounded-2xl border border-border bg-card p-4 shadow-subtle transition duration-200 hover:bg-card-subtle ${
        featured ? "col-span-2 lg:col-span-2" : ""
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <p className="text-xs font-bold text-secondary">
        {label}
      </p>
      <p
        className={`mt-2 font-bold tracking-normal text-numeric ${valueColor} ${
          featured ? "text-3xl md:text-[40px]" : "text-2xl md:text-[28px]"
        }`}
      >
        {value}
      </p>
      <p className="mt-2 min-h-5 text-xs leading-5 text-secondary">
        {helper}
      </p>
    </article>
  );
}
