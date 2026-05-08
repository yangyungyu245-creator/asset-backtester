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

function translateStatusMessage(message: string) {
  const normalized = message.toLowerCase().trim();

  if (!normalized) {
    return "";
  }
  if (normalized.includes("already exists")) {
    return "이미 등록된 종목입니다.";
  }
  if (normalized.includes("must look like")) {
    return "한국 종목은 005930.KS 또는 035720.KQ 형식이어야 합니다.";
  }
  if (normalized.includes("must contain only")) {
    return "미국 종목은 영문, 숫자, 하이픈, 점만 입력할 수 있습니다.";
  }
  if (normalized.includes("must end with -usd")) {
    return "암호화폐 종목은 BTC-USD 형식이어야 합니다.";
  }
  if (normalized.includes("added") || normalized.includes("success")) {
    return "종목이 추가되었습니다.";
  }
  if (normalized.includes("invalid")) {
    return "유효하지 않은 종목 코드입니다.";
  }
  if (normalized.includes("not found") || normalized.includes("no 1-month history")) {
    return "Yahoo Finance에서 최근 데이터를 찾을 수 없습니다.";
  }
  if (normalized.includes("processing")) {
    return "처리 중입니다.";
  }

  return message;
}

export function RequestCard({ request }: { request: TickerRequest }) {
  const category = categoryLabels[request.category] ?? request.category;
  const translatedComment = translateStatusMessage(request.comment);

  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-subtle sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <RequestStatusBadge status={request.status} />
            <h2 className="text-lg font-semibold text-primary">
              {request.ticker}
            </h2>
            <span className="text-sm text-secondary">-</span>
            <p className="min-w-0 break-words text-sm font-medium text-primary">
              {request.nameKo || request.ticker}
            </p>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-secondary">
            <span>{category}</span>
            {request.reason ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="break-words">{request.reason}</span>
              </>
            ) : null}
          </div>
        </div>
        <time className="shrink-0 text-xs text-secondary">
          {formatDate(request.submittedAt)}
        </time>
      </div>

      {translatedComment ? (
        <p className="mt-4 rounded-md border border-border bg-card-subtle px-3 py-2 text-sm text-secondary">
          처리된 답변: {translatedComment}
        </p>
      ) : null}
    </article>
  );
}
