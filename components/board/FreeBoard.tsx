"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getHotPosts, getPosts } from "@/lib/free-board/actions";
import type { FreeBoardSort, FreePost } from "@/lib/types/free-board";

function timeAgo(value: string) {
  const diff = Math.max(0, (Date.now() - new Date(value).getTime()) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function PostCard({ post }: { post: FreePost }) {
  return (
    <Link
      href={`/board/free/${post.id}`}
      className="block rounded-xl border border-border bg-card p-4 shadow-subtle transition hover:bg-card-subtle sm:p-5"
    >
      <h3 className="break-words text-lg font-bold text-primary">{post.title}</h3>
      <p className="mt-2 line-clamp-2 whitespace-pre-wrap break-words text-sm leading-6 text-secondary">
        {post.content}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-secondary">
        <span>{timeAgo(post.created_at)}</span>
        <span aria-hidden="true">·</span>
        <span>익명</span>
        <span aria-hidden="true">·</span>
        <span>조회 {post.view_count}</span>
        <span>댓글 {post.comment_count}</span>
        <span>좋아요 {post.like_count}</span>
      </div>
    </Link>
  );
}

export function FreeBoard() {
  const [posts, setPosts] = useState<FreePost[]>([]);
  const [hotPosts, setHotPosts] = useState<FreePost[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<FreeBoardSort>("latest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [nextPosts, nextHotPosts] = await Promise.all([
          getPosts(search, sort),
          getHotPosts(5),
        ]);
        if (!ignore) {
          setPosts(nextPosts);
          setHotPosts(nextHotPosts);
        }
      } catch {
        if (!ignore) {
          setError("자유게시판 데이터를 불러오지 못했습니다. Supabase SQL 실행 여부를 확인해주세요.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    const timer = window.setTimeout(load, 180);
    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [search, sort]);

  return (
    <section className="mx-auto grid max-w-3xl gap-5 py-4 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-secondary">FIRE LIFE 커뮤니티</p>
          <h1 className="mt-3 text-3xl font-bold text-primary sm:text-[40px]">
            자유게시판
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-secondary">
            투자 이야기와 서비스 사용 팁을 익명으로 편하게 나눠보세요.
          </p>
        </div>
        <Button href="/board/free/write" className="sm:w-auto">
          글쓰기
        </Button>
      </div>

      <div className="grid gap-3">
        <label className="grid gap-2 text-sm font-bold text-primary">
          검색
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="검색어를 입력하세요"
            className="h-12 rounded-lg border border-border bg-card px-4 text-base font-medium outline-none focus:ring-2 focus:ring-brand/30"
          />
        </label>

        <div className="flex gap-2">
          {[
            { label: "최신순", value: "latest" as const },
            { label: "인기순", value: "popular" as const },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setSort(item.value)}
              className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                sort === item.value
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-card text-secondary hover:bg-card-subtle hover:text-primary"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {hotPosts.length > 0 ? (
        <Card rounded="xl" className="bg-card-subtle">
          <h2 className="text-sm font-bold text-brand">실시간 인기 글</h2>
          <div className="mt-3 grid gap-1">
            {hotPosts.map((post) => (
              <Link
                key={post.id}
                href={`/board/free/${post.id}`}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm font-semibold text-primary transition hover:bg-card"
              >
                <span className="truncate">{post.title}</span>
                <span className="shrink-0 text-xs text-secondary">
                  댓글 {post.comment_count} · 좋아요 {post.like_count}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      ) : null}

      {error ? (
        <Card rounded="xl" className="border-up/30 bg-up-bg text-sm font-semibold text-up">
          {error}
        </Card>
      ) : null}

      <section className="grid gap-3">
        <h2 className="text-base font-bold text-primary">전체 글</h2>
        {loading ? (
          <Card rounded="xl" className="p-8 text-center text-sm text-secondary">
            불러오는 중입니다...
          </Card>
        ) : posts.length > 0 ? (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <Card rounded="xl" className="p-8 text-center">
            <p className="text-sm text-secondary">아직 글이 없습니다. 첫 글을 작성해보세요.</p>
            <Button href="/board/free/write" className="mt-5">
              글쓰기
            </Button>
          </Card>
        )}
      </section>
    </section>
  );
}
