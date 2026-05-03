import { RequestStatusBadge } from "@/components/request/RequestStatusBadge";
import type { TickerRequest } from "@/components/request/types";

const categoryLabels: Record<string, string> = {
  us_stock: "미국 주식",
  us_etf: "미국 ETF",
  kr_stock: "한국 주식",
  kr_etf: "한국 ETF",
  intl_stock: "해외 주식",
  intl_etf: "해외 ETF",
  crypto: "암호화폐",
};

function formatDate(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function RequestCard({ request }: { request: TickerRequest }) {
  const category = categoryLabels[request.category] ?? request.category;

  return (
    <article className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <RequestStatusBadge status={request.status} />
            <h2 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
              {request.ticker}
            </h2>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">-</span>
            <p className="min-w-0 break-words text-sm font-medium text-neutral-800 dark:text-neutral-200">
              {request.nameKo || request.ticker}
            </p>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            <span>{category}</span>
            {request.reason ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="break-words">{request.reason}</span>
              </>
            ) : null}
          </div>
        </div>
        <time className="shrink-0 text-xs text-neutral-500 dark:text-neutral-400">
          {formatDate(request.submittedAt)}
        </time>
      </div>

      {request.comment ? (
        <p className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-300">
          처리된 답변: {request.comment}
        </p>
      ) : null}
    </article>
  );
}
