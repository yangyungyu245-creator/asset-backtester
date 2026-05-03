export type RequestStatus = "pending" | "added" | "rejected" | "duplicate" | string;

const statusConfig: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  pending: {
    label: "대기중",
    className:
      "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  },
  added: {
    label: "처리됨",
    className:
      "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300",
  },
  rejected: {
    label: "거절됨",
    className: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  },
  duplicate: {
    label: "중복",
    className:
      "border-neutral-300 bg-neutral-100 text-neutral-600 dark:border-white/10 dark:bg-white/10 dark:text-neutral-300",
  },
};

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const normalized = (status || "pending").toLowerCase();
  const config = statusConfig[normalized] ?? statusConfig.pending;

  return (
    <span
      className={`inline-flex h-7 shrink-0 items-center rounded-full border px-2.5 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}
