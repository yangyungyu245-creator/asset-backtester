"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RequestCard } from "@/components/request/RequestCard";
import { RequestForm } from "@/components/request/RequestForm";
import type { TickerRequest } from "@/components/request/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type RequestBoardProps = {
  requests: TickerRequest[];
  initialTicker?: string;
  csvConfigured: boolean;
};

export function RequestBoard({
  requests,
  initialTicker = "",
  csvConfigured,
}: RequestBoardProps) {
  const router = useRouter();
  const [localRequests, setLocalRequests] = useState(requests);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);
  const [isFormOpen, setIsFormOpen] = useState(Boolean(initialTicker));
  const [formTicker, setFormTicker] = useState(initialTicker);

  useEffect(() => {
    setLocalRequests((previous) => {
      const optimistic = previous.filter((request) => {
        if (!request.id.startsWith("optimistic-")) return false;
        return !requests.some(
          (incoming) =>
            incoming.ticker === request.ticker &&
            incoming.nameKo === request.nameKo &&
            incoming.category === request.category,
        );
      });

      return [...optimistic, ...requests];
    });
  }, [requests]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return localRequests;
    }

    return localRequests.filter((request) => {
      return (
        request.ticker.toLowerCase().includes(normalized) ||
        request.nameKo.toLowerCase().includes(normalized)
      );
    });
  }, [localRequests, query]);

  const visibleRequests = filtered.slice(0, visibleCount);

  function openForm(ticker = query) {
    setFormTicker(ticker.trim().toUpperCase());
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
  }

  return (
    <div className="grid gap-6">
      <Card rounded="2xl" padding="lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label htmlFor="requestSearch" className="sr-only">
            요청 검색
          </label>
          <input
            id="requestSearch"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(20);
            }}
            placeholder="이미 누가 요청했는지 확인하세요..."
            className="h-11 min-w-0 flex-1 rounded-md border border-border bg-card px-3 text-sm text-primary outline-none transition focus:ring-2 focus:ring-brand/30"
          />
          <Button type="button" onClick={() => openForm()} className="sm:w-auto">
            + 새 요청 작성
          </Button>
        </div>
        {!csvConfigured ? (
          <p className="mt-3 text-sm text-up">
            요청 목록 CSV URL이 설정되지 않아 목록을 불러오지 못했습니다.
          </p>
        ) : null}
      </Card>

      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-primary">
            요청 목록
          </h2>
          <span className="text-sm text-secondary">
            {filtered.length}건
          </span>
        </div>

        {visibleRequests.length > 0 ? (
          visibleRequests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))
        ) : query.trim() ? (
          <Card rounded="2xl" className="p-8 text-center">
            <p className="text-sm text-secondary">
              &quot;{query}&quot;에 대한 요청이 없습니다.
            </p>
            <Button type="button" onClick={() => openForm(query)} className="mt-5">
              직접 요청하기
            </Button>
          </Card>
        ) : (
          <Card rounded="2xl" className="p-8 text-center">
            <p className="text-sm text-secondary">
              아직 요청이 없습니다.
            </p>
            <Button type="button" onClick={() => openForm("")} className="mt-5">
              + 새 요청 작성
            </Button>
          </Card>
        )}

        {filtered.length > visibleCount ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setVisibleCount((count) => count + 20)}
            className="mx-auto mt-2"
          >
            더보기
          </Button>
        ) : null}
      </section>

      {isFormOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-neutral-950/55 p-0 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="requestFormTitle"
        >
          <div className="mx-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-border bg-card p-5 shadow-strong sm:rounded-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-secondary">
                  커뮤니티 종목 요청
                </p>
                <h2
                  id="requestFormTitle"
                  className="mt-1 text-xl font-bold text-primary"
                >
                  새 요청 작성
                </h2>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-xl leading-none text-secondary transition hover:bg-card-subtle hover:text-primary"
                aria-label="요청 작성 닫기"
              >
                ×
              </button>
            </div>
            <RequestForm
              initialTicker={formTicker}
              onSuccess={(request) => {
                setLocalRequests((current) => [request, ...current]);
                closeForm();
                router.refresh();
                window.setTimeout(() => router.refresh(), 1500);
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
