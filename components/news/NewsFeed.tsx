"use client";

import { useEffect, useState } from "react";

type NewsItem = {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  thumbnail: string | null;
};

type NewsResponse = {
  news?: NewsItem[];
};

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);

  if (!dateStr || Number.isNaN(date.getTime())) {
    return "방금 전";
  }

  const diff = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;

  return date.toLocaleDateString("ko-KR");
}

function NewsPlaceholder() {
  return (
    <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-card-subtle text-secondary">
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1" />
        <path d="M19 20a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2Z" />
        <path d="M7 10h4M7 14h2" />
      </svg>
    </div>
  );
}

function NewsSkeleton() {
  return (
    <div className="flex animate-pulse gap-3 p-3">
      <div className="h-14 w-20 shrink-0 rounded-lg bg-neutral-200 dark:bg-neutral-700" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-4/5 rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-4 w-2/3 rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-3 w-1/3 rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>
    </div>
  );
}

export default function NewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hiddenThumbnails, setHiddenThumbnails] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let isMounted = true;

    fetch("/api/news")
      .then((response) => response.json() as Promise<NewsResponse>)
      .then((data) => {
        if (isMounted) {
          setNews(data.news ?? []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setNews([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-subtle sm:p-5">
        <h2 className="text-[22px] font-bold leading-tight text-primary">경제 뉴스</h2>
        <div className="mt-4 space-y-1">
          {Array.from({ length: 4 }, (_, index) => (
            <NewsSkeleton key={index} />
          ))}
        </div>
      </section>
    );
  }

  if (news.length === 0) {
    return null;
  }

  return (
    <section className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-subtle sm:p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-bold leading-tight text-primary">경제 뉴스</h2>
          <p className="mt-1 text-sm text-secondary">주요 경제/증시 헤드라인</p>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        {news.map((item) => {
          const thumbnail =
            item.thumbnail && !hiddenThumbnails.has(item.link) ? item.thumbnail : null;

          return (
            <a
              key={`${item.source}-${item.link}`}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 rounded-xl p-3 transition hover:bg-card-subtle focus:outline-none focus:ring-2 focus:ring-brand/35"
            >
              {thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbnail}
                  alt=""
                  className="h-14 w-20 shrink-0 rounded-lg object-cover"
                  onError={() => {
                    setHiddenThumbnails((current) => new Set(current).add(item.link));
                  }}
                />
              ) : (
                <NewsPlaceholder />
              )}

              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-primary">
                  {item.title}
                </p>
                <p className="mt-1 truncate text-xs text-secondary">
                  {item.source} · {timeAgo(item.pubDate)}
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
