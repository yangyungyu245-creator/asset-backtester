"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getPostSummaries } from "@/lib/board/actions";
import {
  CATEGORY_LABELS,
  VISIBILITY_LABELS,
  type BoardCategory,
  type BoardPostSummary,
} from "@/lib/types/board";

const filters: Array<{ label: string; value: BoardCategory | "all" }> = [
  { label: "전체", value: "all" },
  { label: "건의", value: "feedback" },
  { label: "버그", value: "bug" },
  { label: "기능 요청", value: "feature" },
  { label: "기타", value: "other" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function FeedbackBoard() {
  const [posts, setPosts] = useState<BoardPostSummary[]>([]);
  const [filter, setFilter] = useState<BoardCategory | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    getPostSummaries(filter === "all" ? undefined : filter)
      .then(setPosts)
      .catch(() => {
        setError("게시판 데이터를 불러오지 못했습니다. Supabase SQL 실행 여부를 확인해주세요.");
      })
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <section className="mx-auto grid max-w-5xl gap-6 py-4 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-secondary">FIRE LIFE 게시판</p>
          <h1 className="mt-3 text-3xl font-bold tracking-normal text-primary sm:text-[40px]">
            건의/문의 게시판
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-secondary">
            기능 요청, 버그 신고, 개선 의견을 남겨주세요. 작성자 이름과 이메일은 표시하지 않습니다.
          </p>
        </div>
        <Button href="/board/feedback/write" className="sm:w-auto">
          글쓰기
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
              filter === item.value
                ? "border-brand bg-brand text-white"
                : "border-border bg-card text-secondary hover:bg-card-subtle hover:text-primary"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? (
        <Card rounded="2xl" className="border-up/30 bg-up-bg text-sm font-semibold text-up">
          {error}
        </Card>
      ) : null}

      <section className="grid gap-3">
        {loading ? (
          <Card rounded="2xl" className="p-8 text-center text-sm text-secondary">
            불러오는 중입니다...
          </Card>
        ) : posts.length > 0 ? (
          posts.map((post) => {
            const isMine = post.is_mine;
            const isLocked = post.visibility === "private" && !isMine;
            const className =
              "rounded-xl border border-border bg-card p-4 shadow-subtle transition sm:p-5";
            const content = (
              <article>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-brand/10 px-2 py-1 text-xs font-bold text-brand">
                    {CATEGORY_LABELS[post.category]}
                  </span>
                  {isLocked ? (
                    <span className="rounded bg-card-subtle px-2 py-1 text-xs font-bold text-secondary">
                      잠금
                    </span>
                  ) : null}
                  {post.admin_reply ? (
                    <span className="rounded bg-down-bg px-2 py-1 text-xs font-bold text-down">
                      답변 완료 ✓
                    </span>
                  ) : null}
                  {isMine ? (
                    <span className="rounded bg-card-subtle px-2 py-1 text-xs font-bold text-secondary">
                      내 글
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-3 break-words text-lg font-bold text-primary">
                  {post.title}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-secondary">
                  <time>{formatDate(post.created_at)}</time>
                  <span aria-hidden="true">·</span>
                  <span>{VISIBILITY_LABELS[post.visibility]}</span>
                </div>
                {isLocked ? (
                  <p className="mt-3 rounded-md bg-card-subtle px-3 py-2 text-sm text-secondary">
                    비공개 글입니다. 작성자만 본문을 열람할 수 있습니다.
                  </p>
                ) : null}
                {post.admin_reply ? (
                  <p className="mt-3 line-clamp-2 rounded-md bg-card-subtle px-3 py-2 text-sm text-secondary">
                    관리자: {post.admin_reply}
                  </p>
                ) : null}
              </article>
            );

            return isLocked ? (
              <div key={post.id} className={className}>
                {content}
              </div>
            ) : (
              <Link
                key={post.id}
                href={`/board/feedback/${post.id}`}
                className={`${className} hover:bg-card-subtle`}
              >
                {content}
              </Link>
            );
          })
        ) : (
          <Card rounded="2xl" className="p-8 text-center">
            <p className="text-sm text-secondary">
              아직 글이 없습니다. 첫 번째 글을 작성해보세요!
            </p>
            <Button href="/board/feedback/write" className="mt-5">
              글쓰기
            </Button>
          </Card>
        )}
      </section>
    </section>
  );
}
